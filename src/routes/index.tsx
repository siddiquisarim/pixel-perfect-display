import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Link2, Plus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PersonNode, initialsOf } from "@/components/person-node";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/lib/family-store";
import type {
  FamilyPerson,
  RelationshipType,
  TimelineEventType,
} from "@/lib/family-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Tree — FamilyLink" },
      {
        name: "description",
        content:
          "Build and explore your interactive family tree with protected records for living relatives and minors.",
      },
      { property: "og:title", content: "Family Tree — FamilyLink" },
      {
        property: "og:description",
        content: "An interactive tree of biological relatives and spouses, with consent-aware protections.",
      },
    ],
  }),
  component: FamilyTreePage,
});

const RELATION_LABELS: Record<RelationshipType, string> = {
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  grandparent: "Grandparent",
  spouse: "Spouse",
};

const GEN_LABELS: Record<number, string> = {
  [-2]: "Grandparents",
  [-1]: "Parents",
  0: "Your generation",
  1: "Children",
  2: "Grandchildren",
};

function FamilyTreePage() {
  const { persons, relationships, addPerson, addTimelineEvent, timeline, privacy } = useFamily();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const generations = useMemo(() => {
    const gen = new Map<string, number>();
    gen.set("p_marcus", 0);
    for (let pass = 0; pass < 6; pass += 1) {
      for (const r of relationships) {
        const a = gen.get(r.person_a_id);
        const b = gen.get(r.person_b_id);
        const offset =
          r.relationship_type === "parent" ? 1 : r.relationship_type === "grandparent" ? 2 : 0;
        if (a !== undefined && b === undefined) gen.set(r.person_b_id, a + offset);
        if (b !== undefined && a === undefined) gen.set(r.person_a_id, b - offset);
      }
    }
    const rows = new Map<number, FamilyPerson[]>();
    for (const p of persons) {
      const g = gen.get(p.id) ?? 0;
      rows.set(g, [...(rows.get(g) ?? []), p]);
    }
    return [...rows.entries()].sort((x, y) => x[0] - y[0]);
  }, [persons, relationships]);

  const isVerified = (personId: string) =>
    relationships.some(
      (r) =>
        (r.person_a_id === personId || r.person_b_id === personId) &&
        r.verification_status === "connected",
    );

  const selected = persons.find((p) => p.id === selectedId) ?? null;
  const selectedEvents = timeline.filter((t) => t.person_id === selectedId);

  return (
    <AppShell
      title="Family Tree"
      subtitle="Biological relatives and spouses across your known generations. Select any node to open its profile, add a life event, or generate an invite link."
      action={
        <AddRelativeDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          persons={persons}
          onSubmit={(input) => {
            addPerson(input);
            toast.success(`${input.first_name} ${input.last_name} added to your tree`);
            setAddOpen(false);
          }}
        />
      }
    >
      <div className="space-y-8">
        {generations.map(([g, people], rowIndex) => (
          <section key={g}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                {GEN_LABELS[g] ?? `Generation ${g}`}
              </h2>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-foreground/40">{people.length} records</span>
            </div>
            <div className="flex flex-wrap gap-4">
              {people.map((p) => (
                <PersonNode
                  key={p.id}
                  person={p}
                  verified={isVerified(p.id)}
                  isSelf={p.id === "p_marcus"}
                  onClick={() => setSelectedId(p.id)}
                />
              ))}
            </div>
            {rowIndex < generations.length - 1 && (
              <div className="ml-6 mt-6 h-6 w-px bg-white/15" aria-hidden />
            )}
          </section>
        ))}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto bg-paper text-paper-foreground sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">
                  {selected.first_name} {selected.last_name}
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-8">
                <div className="flex items-center gap-4">
                  {selected.avatar_url ? (
                    <img
                      src={selected.avatar_url}
                      alt=""
                      loading="lazy"
                      width={160}
                      height={160}
                      className="size-20 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex size-20 items-center justify-center rounded-xl bg-secondary font-display text-2xl text-secondary-foreground">
                      {initialsOf(selected)}
                    </span>
                  )}
                  <dl className="text-sm">
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Born</dt>
                      <dd>{selected.birth_year ?? "Unknown"}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Place</dt>
                      <dd>
                        {privacy.geo_precision === "hidden"
                          ? "Hidden"
                          : privacy.geo_precision === "country_only"
                            ? (selected.birth_place?.split(",").pop()?.trim() ?? "Unknown")
                            : (selected.birth_place ?? "Unknown")}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd>{selected.is_living ? "Living" : "Deceased"}</dd>
                    </div>
                  </dl>
                </div>

                {selected.is_minor && (
                  <div className="rounded-lg border border-border bg-secondary p-3 text-xs text-secondary-foreground">
                    <strong className="font-semibold">Protected Minor Node.</strong> This record is
                    non-discoverable. Invite links and AI discovery are permanently disabled for
                    under-13 records.
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Life events
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {selectedEvents.length === 0 && (
                      <li className="text-sm text-muted-foreground">No events recorded yet.</li>
                    )}
                    {selectedEvents
                      .sort((a, b) => a.year - b.year)
                      .map((e) => (
                        <li key={e.id} className="flex gap-3 text-sm">
                          <span className="font-display text-primary-deep">{e.year}</span>
                          <span>{e.title}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AddLifeEventDialog
                    personName={`${selected.first_name} ${selected.last_name}`}
                    onSubmit={(input) => {
                      addTimelineEvent({ ...input, person_id: selected.id });
                      toast.success("Life event added to the timeline");
                    }}
                  />
                  <Button
                    variant="outline"
                    disabled={selected.is_minor || !privacy.allow_invite_links}
                    onClick={() => {
                      toast.success("Invite link copied", {
                        description: `familylink.app/join/${selected.id}`,
                      });
                    }}
                  >
                    <Link2 className="size-4" /> Generate invite link
                  </Button>
                </div>
                {selected.is_minor && (
                  <p className="text-xs text-muted-foreground">
                    Invite links are unavailable for protected minor records.
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function AddRelativeDialog({
  open,
  onOpenChange,
  persons,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  persons: FamilyPerson[];
  onSubmit: (input: {
    first_name: string;
    last_name: string;
    maiden_name: string;
    birth_year: string;
    birth_place: string;
    is_living: boolean;
    relationship_type: RelationshipType;
    anchor_person_id: string;
  }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("Johnson");
  const [maidenName, setMaidenName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [isLiving, setIsLiving] = useState(true);
  const [relation, setRelation] = useState<RelationshipType>("parent");
  const [anchor, setAnchor] = useState("p_marcus");

  const willBeMinor = isLiving && birthYear !== "" && 2026 - Number(birthYear) < 13;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-deep">
          <UserPlus className="size-4" /> Quick add relative
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-paper-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add a relative</DialogTitle>
          <DialogDescription>
            New records start as <em>claimed</em> until the other person confirms the link.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Relationship</Label>
              <Select value={relation} onValueChange={(v) => setRelation(v as RelationshipType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RELATION_LABELS) as RelationshipType[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {RELATION_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Related to</Label>
              <Select value={anchor} onValueChange={setAnchor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {persons.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                      {p.id === "p_marcus" ? " (you)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="fn">First name</Label>
              <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ln">Last name</Label>
              <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="mn">Maiden name (optional)</Label>
              <Input id="mn" value={maidenName} onChange={(e) => setMaidenName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="by">Birth year</Label>
              <Input
                id="by"
                inputMode="numeric"
                placeholder="1956"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="bp">Birth country / city</Label>
            <Input
              id="bp"
              placeholder="Kingston, Jamaica"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium">Living</p>
              <p className="text-xs text-muted-foreground">
                Living records get stronger privacy defaults.
              </p>
            </div>
            <Switch checked={isLiving} onCheckedChange={setIsLiving} />
          </div>

          {willBeMinor && (
            <div className="rounded-lg border border-border bg-secondary p-3 text-xs text-secondary-foreground">
              <Badge className="mb-2 bg-secondary-foreground text-secondary">Under 13</Badge>
              <p>
                This record will be saved as a <strong>Protected Minor Node</strong> — no invite
                links and no AI discovery.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-deep"
            disabled={!firstName.trim() || !lastName.trim()}
            onClick={() =>
              onSubmit({
                first_name: firstName,
                last_name: lastName,
                maiden_name: maidenName,
                birth_year: birthYear,
                birth_place: birthPlace,
                is_living: isLiving,
                relationship_type: relation,
                anchor_person_id: anchor,
              })
            }
          >
            <Plus className="size-4" /> Add to tree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddLifeEventDialog({
  personName,
  onSubmit,
}: {
  personName: string;
  onSubmit: (input: {
    event_type: TimelineEventType;
    year: string;
    title: string;
    description: string;
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TimelineEventType>("custom");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-deep">
          <CalendarPlus className="size-4" /> Add life event
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-paper text-paper-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add life event</DialogTitle>
          <DialogDescription>For {personName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Event type</Label>
              <Select value={type} onValueChange={(v) => setType(v as TimelineEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["birth", "marriage", "migration", "death", "custom"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t[0].toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ey">Year</Label>
              <Input
                id="ey"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="et">Title</Label>
            <Input id="et" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed">Notes</Label>
            <Textarea id="ed" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-deep"
            disabled={!title.trim() || year.length !== 4}
            onClick={() => {
              onSubmit({ event_type: type, year, title, description });
              setOpen(false);
              setTitle("");
              setYear("");
              setDescription("");
            }}
          >
            Save event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
