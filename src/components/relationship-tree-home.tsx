import { Link } from "@tanstack/react-router";
import { Maximize2, Minus, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FamilyPerson, Relationship } from "@/lib/family-types";
import { cn } from "@/lib/utils";

const ROOT_ID = "p_marcus";
const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 760;
const ROOT_POINT = { x: 560, y: 472 };

type ConnectionKind = "family" | "friend" | "community";
type NetworkNode = { person: FamilyPerson; x: number; y: number; kind: ConnectionKind; label: string };

const KIND_LABELS: Record<ConnectionKind, string> = {
  family: "Family",
  friend: "Family friend",
  community: "Community",
};

function connectionLabel(personId: string, relationships: Relationship[]) {
  const direct = relationships.find(
    (relationship) =>
      (relationship.person_a_id === ROOT_ID && relationship.person_b_id === personId) ||
      (relationship.person_b_id === ROOT_ID && relationship.person_a_id === personId),
  );
  if (!direct) return "Extended family";
  if (direct.relationship_type === "parent") {
    return direct.person_a_id === personId ? "Parent" : "Child";
  }
  return direct.relationship_type.charAt(0).toUpperCase() + direct.relationship_type.slice(1);
}

function createRadialNodes(persons: FamilyPerson[], relationships: Relationship[]): NetworkNode[] {
  const root = persons.find((person) => person.id === ROOT_ID);
  if (!root) return [];

  const connectedIds = new Set<string>([ROOT_ID]);
  for (const relationship of relationships) {
    if (relationship.verification_status !== "connected") continue;
    if (relationship.person_a_id === ROOT_ID) connectedIds.add(relationship.person_b_id);
    if (relationship.person_b_id === ROOT_ID) connectedIds.add(relationship.person_a_id);
  }

  const accepted = persons.filter((person) => person.id !== ROOT_ID && connectedIds.has(person.id));
  const slots = [
    { x: 300, y: 246 },
    { x: 560, y: 174 },
    { x: 820, y: 246 },
    { x: 250, y: 440 },
    { x: 870, y: 440 },
    { x: 370, y: 570 },
    { x: 750, y: 570 },
  ];

  return [
    { person: root, x: ROOT_POINT.x, y: ROOT_POINT.y, kind: "family", label: "You" },
    ...accepted.map((person, index) => ({
      person,
      ...(slots[index] ?? {
        x: 560 + Math.cos(index * 1.7) * (300 + Math.floor(index / slots.length) * 65),
        y: 360 + Math.sin(index * 1.7) * (220 + Math.floor(index / slots.length) * 45),
      }),
      kind: "family" as const,
      label: connectionLabel(person.id, relationships),
    })),
  ];
}

function branchPath(node: NetworkNode) {
  const bendY = ROOT_POINT.y - Math.max(70, Math.abs(ROOT_POINT.y - node.y) * 0.48);
  return `M ${ROOT_POINT.x} ${ROOT_POINT.y + 80} C ${ROOT_POINT.x} ${bendY}, ${node.x} ${bendY}, ${node.x} ${node.y}`;
}

function PortraitNode({ node, root }: { node: NetworkNode; root: boolean }) {
  const size = root ? 132 : 104;
  return (
    <Link
      to="/tree"
      aria-label={`Open the full family tree from ${node.person.first_name} ${node.person.last_name}`}
      className="group absolute z-20 -translate-x-1/2 -translate-y-1/2 text-center focus-visible:outline-none"
      style={{ left: node.x, top: node.y }}
    >
      <span
        className={cn(
          "relative mx-auto flex items-center justify-center rounded-full border-[5px] border-relationship-canvas bg-relationship-canvas p-1 shadow-portrait transition duration-300 group-hover:-translate-y-1 group-hover:shadow-portrait-hover group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-4 group-focus-visible:ring-offset-relationship-canvas motion-reduce:transition-none",
          root ? "ring-2 ring-primary" : node.kind === "family" ? "ring-2 ring-family" : node.kind === "friend" ? "ring-2 ring-family-friend" : "ring-2 ring-community",
        )}
        style={{ width: size, height: size }}
      >
        {node.person.avatar_url ? (
          <img
            src={node.person.avatar_url}
            alt=""
            className="size-full rounded-full object-cover grayscale-[12%] transition duration-500 group-hover:grayscale-0 motion-reduce:transition-none"
          />
        ) : (
          <span className="flex size-full items-center justify-center rounded-full bg-secondary font-display text-2xl text-secondary-foreground">
            {node.person.first_name.charAt(0)}{node.person.last_name.charAt(0)}
          </span>
        )}
        <span className={cn("absolute bottom-1 right-1 size-4 rounded-full border-[3px] border-relationship-canvas", node.kind === "family" ? "bg-family" : node.kind === "friend" ? "bg-family-friend" : "bg-community")} />
      </span>
      <span className={cn("mt-3 inline-flex max-w-44 flex-col border bg-relationship-label px-3 py-1.5 shadow-paper transition-colors", root ? "border-primary" : "border-relationship-line group-hover:border-primary")}>
        <span className="font-display text-base leading-none text-relationship-ink">{node.person.first_name} {node.person.last_name}</span>
        <span className={cn("mt-1 text-[9px] font-semibold uppercase tracking-[0.14em]", node.kind === "family" ? "text-family" : node.kind === "friend" ? "text-family-friend" : "text-community")}>{root ? "You · View full lineage" : `${node.label} · Accepted`}</span>
      </span>
    </Link>
  );
}

export function RelationshipTreeHome({ persons, relationships }: { persons: FamilyPerson[]; relationships: Relationship[] }) {
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const nodes = useMemo(() => createRadialNodes(persons, relationships), [persons, relationships]);

  const centerTree = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTo({ left: Math.max(0, (CANVAS_WIDTH * zoom - viewport.clientWidth) / 2), behavior: "smooth" });
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(centerTree);
    return () => window.cancelAnimationFrame(frame);
  }, [zoom]);

  return (
    <section aria-label="Your accepted relationship tree" className="relative overflow-hidden border border-relationship-line bg-relationship-canvas shadow-lift">
      <header className="relative z-20 flex flex-col items-center px-5 pb-3 pt-8 text-center sm:pt-10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Your living network</span>
        <h2 className="mt-2 font-display text-4xl text-relationship-ink sm:text-5xl">Our Family Tree</h2>
        <div className="mt-4 flex items-center gap-4 text-xs text-community">
          <span className="h-px w-14 bg-relationship-line" />
          <span>Rooted in history, growing through consent</span>
          <span className="h-px w-14 bg-relationship-line" />
        </div>
      </header>

      <div className="absolute right-4 top-4 z-30 sm:right-6 sm:top-6">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center gap-1 border border-relationship-line bg-relationship-label/90 p-1 shadow-paper backdrop-blur">
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Zoom in" className="text-relationship-ink hover:bg-secondary" onClick={() => setZoom((value) => Math.min(1.25, value + 0.1))}><Plus /></Button></TooltipTrigger><TooltipContent>Zoom in</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Zoom out" className="text-relationship-ink hover:bg-secondary" onClick={() => setZoom((value) => Math.max(0.7, value - 0.1))}><Minus /></Button></TooltipTrigger><TooltipContent>Zoom out</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Fit relationship tree" className="text-relationship-ink hover:bg-secondary" onClick={centerTree}><Maximize2 /></Button></TooltipTrigger><TooltipContent>Center tree</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <div ref={viewportRef} className="overflow-auto">
        <div className="relative origin-top-left transition-transform duration-300 motion-reduce:transition-none" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${zoom})`, marginRight: `${(zoom - 1) * CANVAS_WIDTH}px`, marginBottom: `${(zoom - 1) * CANVAS_HEIGHT}px` }}>
          <svg className="absolute inset-0 size-full" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} aria-hidden="true">
            <defs>
              <linearGradient id="trunk-tone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" className="text-tree-bark-deep" stopColor="currentColor" /><stop offset="0.5" className="text-tree-bark" stopColor="currentColor" /><stop offset="1" className="text-tree-bark-deep" stopColor="currentColor" /></linearGradient>
              <filter id="tree-soft"><feTurbulence baseFrequency="0.018" numOctaves="2" seed="5" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="8" /></filter>
            </defs>
            <g className="fill-tree-leaf/10 stroke-tree-leaf/15" strokeWidth="1">
              <ellipse cx="560" cy="300" rx="360" ry="220" />
              <ellipse cx="350" cy="310" rx="190" ry="155" />
              <ellipse cx="770" cy="310" rx="190" ry="155" />
            </g>
            <path d="M 500 730 C 530 640, 520 555, 560 475 C 595 402, 575 330, 560 245 C 588 330, 630 380, 700 314 M 555 445 C 493 392, 420 350, 300 247 M 570 390 C 625 330, 722 285, 820 246 M 543 410 C 500 324, 500 250, 560 174 M 535 510 C 450 476, 350 458, 250 440 M 585 510 C 670 476, 770 458, 870 440" fill="none" stroke="url(#trunk-tone)" strokeLinecap="round" strokeWidth="34" filter="url(#tree-soft)" />
            <path d="M 500 730 C 530 640, 520 555, 560 475 C 595 402, 575 330, 560 245 C 588 330, 630 380, 700 314 M 555 445 C 493 392, 420 350, 300 247 M 570 390 C 625 330, 722 285, 820 246 M 543 410 C 500 324, 500 250, 560 174 M 535 510 C 450 476, 350 458, 250 440 M 585 510 C 670 476, 770 458, 870 440" fill="none" className="stroke-relationship-line/35" strokeLinecap="round" strokeWidth="2" />
            {nodes.filter((node) => node.person.id !== ROOT_ID).map((node) => <path key={node.person.id} d={branchPath(node)} fill="none" className="stroke-family/55 animate-branch-draw" strokeLinecap="round" strokeWidth="2.5" />)}
            <path d="M 475 730 Q 560 700 645 730" fill="none" className="stroke-tree-ground/35" strokeLinecap="round" strokeWidth="3" />
          </svg>
          {nodes.map((node) => <PortraitNode key={node.person.id} node={node} root={node.person.id === ROOT_ID} />)}
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.18em] text-community">Select any portrait to open the full lineage</div>
        </div>
      </div>

      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-t border-relationship-line bg-relationship-label px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-relationship-ink">
          {(Object.keys(KIND_LABELS) as ConnectionKind[]).map((kind) => <span key={kind} className="flex items-center gap-2"><span className={cn("size-2.5 rounded-full", kind === "family" ? "bg-family" : kind === "friend" ? "bg-family-friend" : "bg-community")} />{KIND_LABELS[kind]}</span>)}
        </div>
        <div className="flex items-center gap-2 text-xs text-community"><ShieldCheck className="size-4 text-family" /> Only accepted connections appear here</div>
      </footer>
    </section>
  );
}
