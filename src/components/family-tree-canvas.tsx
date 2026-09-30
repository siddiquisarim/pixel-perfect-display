import {
  Baby,
  Bird,
  CalendarDays,
  Heart,
  LocateFixed,
  Lock,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  ShieldCheck,
  Sprout,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FamilyPerson, Relationship, TimelineEvent } from "@/lib/family-types";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

const BASE_POSITIONS: Record<string, Point> = {
  p_robert: { x: 238, y: 132 },
  p_pearl: { x: 482, y: 118 },
  p_david: { x: 354, y: 390 },
  p_yvonne: { x: 738, y: 370 },
  p_marcus: { x: 540, y: 648 },
  p_amara: { x: 810, y: 850 },
};

const RELATION_TO_MARCUS: Record<string, string> = {
  p_robert: "Paternal grandfather",
  p_pearl: "Paternal grandmother",
  p_david: "Father",
  p_yvonne: "Mother",
  p_marcus: "You · central trunk",
  p_amara: "Daughter",
};

const EVENT_POSITIONS: Record<string, Point> = {
  t_1: { x: 76, y: 210 },
  t_2: { x: 365, y: 246 },
  t_3: { x: 92, y: 420 },
  t_4: { x: 342, y: 520 },
  t_5: { x: 152, y: 610 },
  t_6: { x: 602, y: 735 },
  t_7: { x: 82, y: 740 },
};

const EVENT_LABELS = {
  birth: "Born",
  marriage: "Married",
  migration: "Moved",
  death: "Remembered",
  custom: "Milestone",
};

function pathBetween(from: Point, to: Point) {
  const middleY = from.y + (to.y - from.y) * 0.52;
  return `M ${from.x} ${from.y} C ${from.x} ${middleY}, ${to.x} ${middleY}, ${to.x} ${to.y}`;
}

function FruitNode({
  person,
  position,
  relation,
  verified,
  active,
  onSelect,
}: {
  person: FamilyPerson;
  position: Point;
  relation: string;
  verified: boolean;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className="absolute z-20 w-44 -translate-x-1/2 -translate-y-1/2 text-center"
      style={{ left: position.x, top: position.y }}
    >
      <Button
        variant="ghost"
        onClick={onSelect}
        aria-label={`Open ${person.first_name} ${person.last_name}, ${relation}`}
        className={cn(
          "group relative mx-auto size-28 rounded-full border-4 border-tree-bark bg-tree-fruit p-1 shadow-tree-fruit transition-transform duration-300 hover:-translate-y-1 hover:bg-tree-fruit focus-visible:ring-2 focus-visible:ring-primary",
          active && "border-primary ring-4 ring-primary/25",
          person.id === "p_marcus" && "size-32 border-primary",
        )}
      >
        <span className="absolute -left-2 top-4 h-7 w-4 -rotate-45 rounded-[70%_15%_70%_15%] bg-tree-leaf shadow-sm" />
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt=""
            className="size-full rounded-full object-cover grayscale-[18%] transition group-hover:grayscale-0"
          />
        ) : (
          <span className="flex size-full items-center justify-center rounded-full bg-secondary font-display text-2xl text-secondary-foreground">
            {person.first_name.charAt(0)}{person.last_name.charAt(0)}
          </span>
        )}
        {verified && (
          <span className="absolute -bottom-1 right-1 flex size-7 items-center justify-center rounded-full border-2 border-paper bg-verified text-verified-foreground">
            <ShieldCheck className="size-4" />
          </span>
        )}
      </Button>
      <div className={cn("mx-auto -mt-1 w-44 rounded-md border border-border bg-paper px-2.5 py-2 text-paper-foreground shadow-paper", active && "border-primary")}>
        <p className="truncate font-display text-base font-semibold">{person.first_name} {person.last_name}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-deep">{relation}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {person.birth_year ? `${person.birth_year} — ${person.is_living ? "Present" : "2004"}` : "Years unknown"}
        </p>
        <div className="mt-1.5 flex justify-center gap-1">
          {person.is_minor && <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[9px]"><Lock className="size-2.5" /> Protected</Badge>}
          {!person.is_living && <Badge variant="outline" className="px-1.5 py-0 text-[9px]">In memory</Badge>}
        </div>
      </div>
    </div>
  );
}

export function FamilyTreeCanvas({
  persons,
  relationships,
  timeline,
  selectedId,
  onSelect,
}: {
  persons: FamilyPerson[];
  relationships: Relationship[];
  timeline: TimelineEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1);

  const positions = useMemo(() => {
    const result = new Map<string, Point>(Object.entries(BASE_POSITIONS));
    const unplaced = persons.filter((person) => !result.has(person.id));
    unplaced.forEach((person, index) => {
      result.set(person.id, { x: 940 - (index % 3) * 160, y: 570 + Math.floor(index / 3) * 170 });
    });
    return result;
  }, [persons]);

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
      if (current.id === "p_marcus") return new Set(current.path);
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      for (const neighbor of adjacency.get(current.id) ?? []) {
        queue.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
    return new Set([selectedId]);
  }, [relationships, selectedId]);

  return (
    <section aria-label="Interactive Johnson family tree" className="relative overflow-hidden rounded-lg border border-tree-line/50 bg-tree-night shadow-inner">
      <div className="pointer-events-none absolute left-5 top-5 z-30 max-w-[270px]">
        <p className="font-display text-lg text-foreground">The Johnson family tree</p>
        <p className="mt-1 text-xs leading-relaxed text-foreground/60">Follow each branch from ancestor to descendant. Event leaves mark the moments that shaped the family.</p>
      </div>

      <TooltipProvider delayDuration={200}>
        <div className="absolute right-4 top-4 z-40 flex items-center gap-1 rounded-md border border-tree-line/60 bg-background/85 p-1 shadow-lg backdrop-blur">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.min(1.2, value + 0.1))}><Plus /></Button></TooltipTrigger><TooltipContent>Zoom in</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-foreground hover:bg-surface" onClick={() => setZoom((value) => Math.max(0.75, value - 0.1))}><Minus /></Button></TooltipTrigger><TooltipContent>Zoom out</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-foreground hover:bg-surface" onClick={() => setZoom(1)}><Maximize2 /></Button></TooltipTrigger><TooltipContent>Fit tree</TooltipContent></Tooltip>
        </div>
      </TooltipProvider>

      <div className="overflow-x-auto pb-3 pt-1">
        <div className="relative mx-auto h-[1040px] w-[1080px] origin-top transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `scale(${zoom})`, marginBottom: `${(zoom - 1) * 1040}px` }}>
          <svg className="absolute inset-0 z-0 h-full w-full" viewBox="0 0 1080 1040" aria-hidden="true">
            <defs>
              <linearGradient id="trunk" x1="0" y1="1" x2="0.65" y2="0">
                <stop offset="0" className="text-tree-bark-deep" stopColor="currentColor" />
                <stop offset="1" className="text-tree-bark" stopColor="currentColor" />
              </linearGradient>
              <filter id="tree-shadow"><feDropShadow dx="0" dy="10" stdDeviation="12" floodOpacity=".28" /></filter>
            </defs>

            <g className="fill-tree-leaf/10 stroke-tree-leaf/25" strokeWidth="2">
              <path d="M84 322 C25 220 88 70 232 74 C300 6 432 35 478 105 C552 20 704 35 752 116 C880 78 1028 168 976 304 C1042 395 932 488 825 442 C760 502 635 478 598 404 C500 474 382 442 348 365 C242 438 121 414 84 322Z" />
            </g>

            <g fill="url(#trunk)" filter="url(#tree-shadow)">
              <path d="M468 1015 C495 900 489 778 522 666 C535 619 531 559 510 510 C482 444 428 398 354 390 L354 372 C442 368 500 411 536 462 C546 349 506 250 482 134 L507 128 C542 250 568 340 566 450 C602 407 652 379 738 364 L741 385 C650 412 594 471 569 544 C561 575 567 613 580 650 C625 778 622 910 650 1015Z" />
              <path d="M520 526 C448 480 372 434 254 146 L281 136 C392 369 455 423 540 462Z" />
              <path d="M542 468 C505 355 462 257 456 134 L485 128 C507 247 551 333 570 430Z" />
              <path d="M560 454 C599 359 660 307 732 381 L714 399 C649 354 611 416 571 514Z" />
              <path d="M574 660 C663 698 744 760 806 850 L783 866 C711 785 645 742 560 718Z" />
            </g>

            <g fill="none" strokeLinecap="round">
              {relationships.map((relationship) => {
                const from = positions.get(relationship.person_a_id);
                const to = positions.get(relationship.person_b_id);
                if (!from || !to) return null;
                const active = lineageIds.has(relationship.person_a_id) && lineageIds.has(relationship.person_b_id);
                return (
                  <path
                    key={relationship.id}
                    d={pathBetween(from, to)}
                    className={cn(relationship.relationship_type === "spouse" ? "stroke-primary" : "stroke-tree-line", active && "stroke-primary tree-branch-active")}
                    strokeWidth={relationship.relationship_type === "spouse" ? 5 : 7}
                    strokeDasharray={relationship.relationship_type === "spouse" ? "5 9" : undefined}
                  />
                );
              })}
            </g>

            <g className="fill-tree-leaf/70">
              {[[150,130],[330,70],[580,80],[720,150],[860,220],[170,340],[900,380],[265,280],[640,250],[430,315]].map(([x,y], index) => (
                <ellipse key={index} cx={x} cy={y} rx="24" ry="11" transform={`rotate(${index % 2 ? 28 : -28} ${x} ${y})`} />
              ))}
            </g>
            <path d="M430 1020 Q540 970 684 1020" className="fill-tree-ground" />
          </svg>

          {relationships.filter((relationship) => relationship.relationship_type === "spouse").map((relationship) => {
            const a = positions.get(relationship.person_a_id);
            const b = positions.get(relationship.person_b_id);
            if (!a || !b) return null;
            return <div key={`label-${relationship.id}`} className="absolute z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-primary/35 bg-background/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-primary" style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 - 8 }}><Heart className="size-3 fill-primary/20" /> Spouses</div>;
          })}

          {timeline.map((event, index) => {
            const person = persons.find((entry) => entry.id === event.person_id);
            const position = EVENT_POSITIONS[event.id] ?? { x: 72 + (index % 2) * 880, y: 240 + index * 88 };
            if (!person) return null;
            const Icon = event.event_type === "marriage" ? Heart : event.event_type === "birth" ? Baby : event.event_type === "migration" ? MapPin : event.event_type === "death" ? Bird : CalendarDays;
            return (
              <button key={event.id} type="button" onClick={() => onSelect(person.id)} className="group absolute z-10 flex max-w-44 items-center gap-2 text-left" style={{ left: position.x, top: position.y }} aria-label={`${event.year}: ${event.title}`}>
                <span className="flex size-9 shrink-0 rotate-[-8deg] items-center justify-center rounded-[65%_18%_65%_18%] border border-tree-leaf-light/40 bg-tree-leaf text-tree-leaf-foreground shadow-md transition-transform group-hover:rotate-0 group-hover:scale-110"><Icon className="size-4" /></span>
                <span className="rounded-md border border-tree-line/60 bg-background/85 px-2 py-1.5 backdrop-blur-sm">
                  <span className="block text-[10px] font-bold text-primary">{event.year} · {EVENT_LABELS[event.event_type]}</span>
                  <span className="block max-w-28 text-[10px] leading-tight text-foreground/75">{event.title}</span>
                </span>
              </button>
            );
          })}

          {persons.map((person) => {
            const position = positions.get(person.id);
            if (!position) return null;
            const verified = relationships.some((relationship) => (relationship.person_a_id === person.id || relationship.person_b_id === person.id) && relationship.verification_status === "connected");
            return <FruitNode key={person.id} person={person} position={position} relation={RELATION_TO_MARCUS[person.id] ?? "Family branch"} verified={verified} active={selectedId === person.id || lineageIds.has(person.id)} onSelect={() => onSelect(person.id)} />;
          })}

          <div className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 text-center">
            <Sprout className="mx-auto size-5 text-tree-leaf-light" />
            <p className="mt-1 font-display text-sm text-foreground/80">Roots in Jamaica · New growth in London</p>
          </div>
          <div className="absolute bottom-7 right-7 z-20 flex items-center gap-2 rounded-md border border-tree-line/60 bg-background/80 px-3 py-2 text-[10px] text-foreground/65 backdrop-blur">
            <LocateFixed className="size-3.5 text-primary" /> Select a person to trace their branch
          </div>
        </div>
      </div>
    </section>
  );
}