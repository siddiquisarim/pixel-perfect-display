import {
  ArrowLeft,
  Baby,
  BookOpen,
  CalendarDays,
  Heart,
  LocateFixed,
  Lock,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FamilyPerson, Relationship, TimelineEvent } from "@/lib/family-types";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

const ROOT_ID = "p_marcus";
const CARD_WIDTH = 210;
const ROW_HEIGHT = 270;
const SIDE_GUTTER = 140;
const TOP_GUTTER = 150;

const KNOWN_RELATIONS: Record<string, string> = {
  p_robert: "Paternal grandfather",
  p_pearl: "Paternal grandmother",
  p_david: "Father",
  p_yvonne: "Mother",
  p_marcus: "You",
  p_amara: "Daughter",
};

const EVENT_LABELS = {
  birth: "Born",
  marriage: "Married",
  migration: "Moved",
  death: "Remembered",
  custom: "Milestone",
};

function generationDelta(relationship: Relationship) {
  if (relationship.relationship_type === "parent") return -1;
  if (relationship.relationship_type === "grandparent") return -2;
  return 0;
}

function createLayout(persons: FamilyPerson[], relationships: Relationship[]) {
  const generations = new Map<string, number>([[ROOT_ID, 0]]);
  let changed = true;
  let passes = 0;

  while (changed && passes < Math.max(persons.length * 2, 8)) {
    changed = false;
    passes += 1;
    for (const relationship of relationships) {
      const a = generations.get(relationship.person_a_id);
      const b = generations.get(relationship.person_b_id);
      const delta = generationDelta(relationship);
      if (a !== undefined && b === undefined) {
        generations.set(relationship.person_b_id, a - delta);
        changed = true;
      } else if (b !== undefined && a === undefined) {
        generations.set(relationship.person_a_id, b + delta);
        changed = true;
      }
    }
  }

  for (const person of persons) {
    if (!generations.has(person.id)) generations.set(person.id, 0);
  }

  const rows = new Map<number, FamilyPerson[]>();
  for (const person of persons) {
    const generation = generations.get(person.id) ?? 0;
    rows.set(generation, [...(rows.get(generation) ?? []), person]);
  }

  const orderedRows = [...rows.entries()].sort(([a], [b]) => a - b);
  const widestRow = Math.max(...orderedRows.map(([, people]) => people.length), 1);
  const width = Math.max(1040, widestRow * (CARD_WIDTH + 64) + SIDE_GUTTER * 2);
  const height = Math.max(850, orderedRows.length * ROW_HEIGHT + TOP_GUTTER + 100);
  const positions = new Map<string, Point>();

  orderedRows.forEach(([, people], rowIndex) => {
    const availableWidth = width - SIDE_GUTTER * 2;
    const step = availableWidth / people.length;
    people.forEach((person, personIndex) => {
      positions.set(person.id, {
        x: SIDE_GUTTER + step * (personIndex + 0.5),
        y: TOP_GUTTER + rowIndex * ROW_HEIGHT,
      });
    });
  });

  return { positions, orderedRows, width, height };
}

function relationshipLabel(personId: string, relationships: Relationship[]) {
  if (KNOWN_RELATIONS[personId]) return KNOWN_RELATIONS[personId];
  const direct = relationships.find(
    (relationship) =>
      (relationship.person_a_id === personId && relationship.person_b_id === ROOT_ID) ||
      (relationship.person_b_id === personId && relationship.person_a_id === ROOT_ID),
  );
  if (!direct) return "Family branch";
  if (direct.relationship_type === "spouse") return "Spouse";
  if (direct.relationship_type === "sibling") return "Sibling";
  if (direct.relationship_type === "grandparent") return "Grandparent";
  if (direct.relationship_type === "parent") {
    return direct.person_a_id === personId ? "Parent" : "Child";
  }
  return "Relative";
}

function branchPath(from: Point, to: Point, spouse: boolean) {
  if (spouse || Math.abs(from.y - to.y) < 20) {
    return `M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y - 18}, ${(from.x + to.x) / 2} ${to.y - 18}, ${to.x} ${to.y}`;
  }
  const middleY = from.y + (to.y - from.y) * 0.52;
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

function PersonCard({
  person,
  position,
  relation,
  events,
  verified,
  active,
  onSelect,
}: {
  person: FamilyPerson;
  position: Point;
  relation: string;
  events: TimelineEvent[];
  verified: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  const latestEvents = [...events].sort((a, b) => a.year - b.year).slice(0, 2);

  return (
    <article
      className={cn(
        "absolute z-20 w-[210px] -translate-x-1/2 -translate-y-1/2 border border-tree-line bg-paper text-paper-foreground shadow-paper transition duration-200",
        active && "border-primary shadow-gold",
      )}
      style={{ left: position.x, top: position.y }}
    >
      <Button
        variant="ghost"
        onClick={onSelect}
        aria-label={`Open ${person.first_name} ${person.last_name}, ${relation}`}
        className="grid h-auto w-full grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded-none border-b border-border px-3 py-3 text-left hover:bg-accent"
      >
        <span className="relative size-12 shrink-0 overflow-hidden rounded-sm border border-border-strong bg-secondary">
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="size-full object-cover grayscale-[22%]" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-base text-secondary-foreground">
              {person.first_name.charAt(0)}{person.last_name.charAt(0)}
            </span>
          )}
          {verified && (
            <span className="absolute bottom-0 right-0 flex size-4 items-center justify-center bg-verified text-verified-foreground">
              <ShieldCheck className="size-3" />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-semibold">{person.first_name} {person.last_name}</span>
          <span className="mt-0.5 block truncate text-[9px] font-bold uppercase tracking-[0.12em] text-primary-deep">{relation}</span>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            {person.birth_year ? `${person.birth_year} — ${person.is_living ? "Present" : "2004"}` : "Years unknown"}
          </span>
        </span>
      </Button>

      <div className="min-h-14 px-3 py-2">
        {latestEvents.length ? (
          <div className="space-y-1">
            {latestEvents.map((event) => (
              <button key={event.id} type="button" onClick={onSelect} className="grid w-full grid-cols-[32px_minmax(0,1fr)] items-center gap-2 text-left">
                <span className="font-mono text-[9px] font-semibold text-primary-deep">{event.year}</span>
                <span className="truncate text-[9px] text-muted-foreground">{EVENT_LABELS[event.event_type]} · {event.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[9px] text-muted-foreground">No life events recorded</p>
        )}
        <div className="mt-1.5 flex gap-1">
          {person.is_minor && <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[8px]"><Lock className="size-2.5" /> Protected minor</Badge>}
          {events.length > 2 && <span className="text-[8px] text-muted-foreground">+{events.length - 2} more</span>}
        </div>
      </div>
    </article>
  );
}

function FocusedPersonTree({
  person,
  events,
  onBack,
  onOpenProfile,
}: {
  person: FamilyPerson;
  events: TimelineEvent[];
  onBack: () => void;
  onOpenProfile: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const orderedEvents = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events]);
  const width = 1040;
  const centerX = width / 2;
  const startY = 165;
  const eventGap = 170;
  const height = Math.max(760, startY + 210 + orderedEvents.length * eventGap);

  const centerTree = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: Math.max(0, centerX * zoom - viewport.clientWidth / 2), top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(centerTree);
    return () => window.cancelAnimationFrame(frame);
  }, [zoom]);

  return (
    <section aria-label={`${person.first_name} ${person.last_name} life tree`} className="relative overflow-hidden rounded-lg border border-tree-line/60 bg-tree-night shadow-inner">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-tree-line/40 bg-background/35 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Back to family tree" className="shrink-0 text-foreground hover:bg-surface" onClick={onBack}><ArrowLeft /></Button>
          <div className="min-w-0">
            <p className="truncate font-display text-lg text-foreground">{person.first_name}’s life tree</p>
            <p className="truncate text-xs text-foreground/60">A chronological branch of recorded milestones</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 border border-tree-line/60 bg-background/75 p-1 shadow-lg">
          <Button variant="ghost" size="icon" aria-label="Zoom in" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}><Plus /></Button>
          <Button variant="ghost" size="icon" aria-label="Zoom out" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}><Minus /></Button>
          <Button variant="ghost" size="icon" aria-label="Center life tree" className="text-foreground hover:bg-surface" onClick={centerTree}><Maximize2 /></Button>
        </div>
      </div>

      <div ref={viewportRef} className="overflow-auto">
        <div className="relative origin-top-left transition-transform duration-300 motion-reduce:transition-none" style={{ width, height, transform: `scale(${zoom})`, marginRight: `${(zoom - 1) * width}px`, marginBottom: `${(zoom - 1) * height}px` }}>
          <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
            <defs>
              <pattern id="life-archive-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" className="fill-none stroke-tree-line/10" strokeWidth="1" /></pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#life-archive-grid)" />
            <path d={`M ${centerX} ${startY + 78} C ${centerX} ${startY + 150}, ${centerX} ${height - 120}, ${centerX} ${height - 70}`} className="fill-none stroke-tree-bark" strokeLinecap="round" strokeWidth="9" />
            {orderedEvents.map((event, index) => {
              const y = startY + 235 + index * eventGap;
              const left = index % 2 === 0;
              const cardX = left ? centerX - 300 : centerX + 300;
              return <path key={event.id} d={`M ${centerX} ${y} C ${centerX + (left ? -70 : 70)} ${y}, ${cardX + (left ? 80 : -80)} ${y}, ${cardX} ${y}`} className="fill-none stroke-tree-line" strokeLinecap="round" strokeWidth="3" />;
            })}
          </svg>

          <article className="absolute z-20 w-[300px] -translate-x-1/2 -translate-y-1/2 border border-primary bg-paper p-4 text-paper-foreground shadow-gold" style={{ left: centerX, top: startY }}>
            <div className="flex items-center gap-4">
              <span className="size-20 shrink-0 overflow-hidden rounded-sm border border-border-strong bg-secondary">
                {person.avatar_url ? <img src={person.avatar_url} alt="" className="size-full object-cover grayscale-[18%]" /> : <span className="flex size-full items-center justify-center font-display text-xl">{person.first_name.charAt(0)}{person.last_name.charAt(0)}</span>}
              </span>
              <div className="min-w-0"><h2 className="font-display text-xl font-semibold">{person.first_name} {person.last_name}</h2><p className="mt-1 text-xs text-muted-foreground">{person.birth_year ? `Born ${person.birth_year}` : "Birth year unknown"} · {person.is_living ? "Living" : "Remembered"}</p>{person.is_minor && <Badge variant="outline" className="mt-2 gap-1"><Lock className="size-3" /> Protected minor</Badge>}</div>
            </div>
            <Button className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary-deep" onClick={onOpenProfile}><BookOpen className="size-4" /> View full profile</Button>
          </article>

          {orderedEvents.map((event, index) => {
            const y = startY + 235 + index * eventGap;
            const left = index % 2 === 0;
            return (
              <Button key={event.id} variant="outline" onClick={onOpenProfile} className="absolute z-20 h-auto w-[280px] -translate-x-1/2 -translate-y-1/2 whitespace-normal border-tree-line bg-paper p-0 text-left text-paper-foreground shadow-paper hover:border-primary hover:bg-accent" style={{ left: left ? centerX - 300 : centerX + 300, top: y }}>
                <span className="grid w-full grid-cols-[66px_minmax(0,1fr)]">
                  <span className="flex min-h-28 flex-col items-center justify-center border-r border-border bg-secondary px-2"><span className="font-display text-xl text-primary-deep">{event.year}</span><span className="mt-1 text-[8px] font-bold uppercase text-muted-foreground">{EVENT_LABELS[event.event_type]}</span></span>
                  <span className="min-w-0 p-3"><span className="block font-display text-sm font-semibold leading-snug">{event.title}</span><span className="mt-2 line-clamp-3 block text-[10px] leading-relaxed text-muted-foreground">{event.description || "No additional notes recorded."}</span></span>
                </span>
              </Button>
            );
          })}

          {orderedEvents.length === 0 && <div className="absolute left-1/2 top-[340px] z-20 w-[280px] -translate-x-1/2 border border-dashed border-tree-line bg-background/70 p-6 text-center text-foreground"><CalendarDays className="mx-auto size-6 text-primary" /><p className="mt-3 font-display text-sm">No life events recorded yet</p><Button variant="link" className="mt-1 text-primary" onClick={onOpenProfile}>Open profile to add one</Button></div>}
        </div>
      </div>
    </section>
  );
}

export function FamilyTreeCanvas({
  persons,
  relationships,
  timeline,
  selectedId,
  onSelect,
  onClearSelection,
  onOpenProfile,
}: {
  persons: FamilyPerson[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  onOpenProfile: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const layout = useMemo(() => createLayout(persons, relationships), [persons, relationships]);

  const centerOnRoot = () => {
    const viewport = viewportRef.current;
    const root = layout.positions.get(ROOT_ID);
    if (!viewport || !root) return;
    viewport.scrollTo({ left: Math.max(0, root.x * zoom - viewport.clientWidth / 2), behavior: "smooth" });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(centerOnRoot);
    return () => window.cancelAnimationFrame(frame);
  }, [layout, zoom]);

  const lineageIds = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const adjacency = new Map<string, string[]>();
    for (const relationship of relationships) {
      adjacency.set(relationship.person_a_id, [...(adjacency.get(relationship.person_a_id) ?? []), relationship.person_b_id]);
      adjacency.set(relationship.person_b_id, [...(adjacency.get(relationship.person_b_id) ?? []), relationship.person_a_id]);
    }
    const queue: Array<{ id: string; path: string[] }> = [{ id: selectedId, path: [selectedId] }];
    const visited = new Set<string>();
    while (queue.length) {
      const current = queue.shift();
      if (!current) break;
      if (current.id === ROOT_ID) return new Set(current.path);
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      for (const neighbor of adjacency.get(current.id) ?? []) {
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
    return new Set([selectedId]);
  }, [relationships, selectedId]);

  const focusedPerson = persons.find((person) => person.id === selectedId);
  if (focusedPerson) {
    return <FocusedPersonTree person={focusedPerson} events={timeline.filter((event) => event.person_id === focusedPerson.id)} onBack={onClearSelection} onOpenProfile={() => onOpenProfile(focusedPerson.id)} />;
  }

  return (
    <section aria-label="Interactive Johnson family tree" className="relative overflow-hidden rounded-lg border border-tree-line/60 bg-tree-night shadow-inner">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-tree-line/40 bg-background/35 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-display text-lg text-foreground">The Johnson family tree</p>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-foreground/60">Generations expand automatically. Scroll across wide branches, then select a record to trace its lineage.</p>
        </div>
        <TooltipProvider delayDuration={200}>
          <div className="flex shrink-0 items-center gap-1 border border-tree-line/60 bg-background/75 p-1 shadow-lg backdrop-blur">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Zoom in" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))}><Plus /></Button></TooltipTrigger><TooltipContent>Zoom in</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Zoom out" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.max(0.65, value - 0.1))}><Minus /></Button></TooltipTrigger><TooltipContent>Zoom out</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Center tree" className="text-foreground hover:bg-surface" onClick={centerOnRoot}><Maximize2 /></Button></TooltipTrigger><TooltipContent>Center on you</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div ref={viewportRef} className="overflow-auto">
        <div
          className="relative origin-top-left transition-transform duration-300 motion-reduce:transition-none"
          style={{ width: layout.width, height: layout.height, transform: `scale(${zoom})`, marginRight: `${(zoom - 1) * layout.width}px`, marginBottom: `${(zoom - 1) * layout.height}px` }}
        >
          <svg className="absolute inset-0 z-0 h-full w-full" viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true">
            <defs>
              <linearGradient id="branch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" className="text-tree-line" stopColor="currentColor" />
                <stop offset="1" className="text-tree-bark" stopColor="currentColor" />
              </linearGradient>
              <pattern id="archive-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" className="fill-none stroke-tree-line/10" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#archive-grid)" />

            {layout.orderedRows.map(([generation], rowIndex) => (
              <g key={generation}>
                <line x1="48" x2={layout.width - 48} y1={TOP_GUTTER + rowIndex * ROW_HEIGHT} y2={TOP_GUTTER + rowIndex * ROW_HEIGHT} className="stroke-tree-line/10" strokeDasharray="3 11" />
                <text x="40" y={TOP_GUTTER + rowIndex * ROW_HEIGHT - 92} className="fill-foreground/35 text-[10px] uppercase tracking-[0.16em]">{generation === 0 ? "Your generation" : generation < 0 ? `${Math.abs(generation)} generation${Math.abs(generation) > 1 ? "s" : ""} before` : `${generation} generation${generation > 1 ? "s" : ""} after`}</text>
              </g>
            ))}

            <g fill="none" strokeLinecap="round">
              {relationships.map((relationship) => {
                const from = layout.positions.get(relationship.person_a_id);
                const to = layout.positions.get(relationship.person_b_id);
                if (!from || !to) return null;
                const spouse = relationship.relationship_type === "spouse";
                const active = lineageIds.has(relationship.person_a_id) && lineageIds.has(relationship.person_b_id);
                return (
                  <path
                    key={relationship.id}
                    d={branchPath(from, to, spouse)}
                    className={cn(spouse ? "stroke-primary" : "stroke-tree-line", active && "stroke-primary tree-branch-active")}
                    strokeWidth={active ? 4 : 2.5}
                    strokeDasharray={spouse ? "4 7" : undefined}
                  />
                );
              })}
            </g>
          </svg>

          {relationships.filter((relationship) => relationship.relationship_type === "spouse").map((relationship) => {
            const a = layout.positions.get(relationship.person_a_id);
            const b = layout.positions.get(relationship.person_b_id);
            if (!a || !b) return null;
            return <div key={`label-${relationship.id}`} className="absolute z-10 flex -translate-x-1/2 items-center gap-1 bg-tree-night px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.12em] text-primary" style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 - 24 }}><Heart className="size-3" /> Spouses</div>;
          })}

          {persons.map((person) => {
            const position = layout.positions.get(person.id);
            if (!position) return null;
            const events = timeline.filter((event) => event.person_id === person.id);
            const verified = relationships.some((relationship) => (relationship.person_a_id === person.id || relationship.person_b_id === person.id) && relationship.verification_status === "connected");
            return <PersonCard key={person.id} person={person} position={position} relation={relationshipLabel(person.id, relationships)} events={events} verified={verified} active={selectedId === person.id || lineageIds.has(person.id)} onSelect={() => onSelect(person.id)} />;
          })}

          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 border-t border-primary/40 px-6 pt-2 text-center">
            <p className="font-display text-xs text-foreground/70">Johnson lineage · Jamaica to London</p>
          </div>
          <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2 border border-tree-line/60 bg-background/80 px-3 py-2 text-[9px] text-foreground/65 backdrop-blur">
            <LocateFixed className="size-3.5 text-primary" /> Select a person to trace their branch
          </div>
        </div>
      </div>
    </section>
  );
}