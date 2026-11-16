import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { getBirthFamily, isMarriedIn } from "@/lib/birth-family";
import { CalendarPlus, GitFork, HeartHandshake, RotateCcw, Link2, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AddRelativeDialog } from "@/components/add-relative-dialog";
import { AppShell } from "@/components/app-shell";
import { FamilyTreeCanvas } from "@/components/family-tree-canvas";
import { LifeEventDialog } from "@/components/life-event-dialog";
import { initialsOf } from "@/components/person-node";
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

export const Route = createFileRoute("/_authenticated/tree")({
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FamilyTreePage,
});


function FamilyTreePage() {
  const { persons, relationships, addPerson, addTimelineEvent, updateTimelineEvent, timeline, privacy, personName } = useFamily();
  const [addOpen, setAddOpen] = useState(false);
  const [rootId, setRootId] = useState("p_marcus");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [birthFamilyOf, setBirthFamilyOf] = useState<string | null>(null);
  const navigate = useNavigate();
  const birthFamily = birthFamilyOf ? getBirthFamily(birthFamilyOf, persons, relationships) : null;
  const birthFamilyPerson = persons.find((p) => p.id === birthFamilyOf);
  // Married-in relatives' own birth families stay on their separate map, not in the main lineage.
  const hiddenIds = new Set<string>();
  for (const p of persons) {
    if (!p.maiden_name || hiddenIds.has(p.id)) continue;
    const side = getBirthFamily(p.id, persons, relationships);
    for (const m of side.persons) if (m.id !== p.id && !side.spouseIds.includes(m.id)) hiddenIds.add(m.id);
  }
  const mainPersons = persons.filter((p) => !hiddenIds.has(p.id));
  const mainRelationships = relationships.filter((r) => !hiddenIds.has(r.person_a_id) && !hiddenIds.has(r.person_b_id));

  const selected = persons.find((p) => p.id === profileId) ?? null;
  const selectedEvents = timeline.filter((t) => t.person_id === profileId);
  const selectedEvent = timeline.find((event) => event.id === eventId) ?? null;
  const rootPerson = persons.find((person) => person.id === rootId);

  const openEvent = (id: string) => {
    setProfileId(null);
    navigate({ to: "/life-events/$eventId", params: { eventId: id } });
  };
  const showBirthFamily = (id: string) => {
    setBirthFamilyOf(id);
    setRootId(id);
    setFocusedId(null);
    setProfileId(null);
  };

  return (
    <AppShell
      title={rootId === "p_marcus" ? "Family Tree" : `${rootPerson?.first_name ?? "Relative"}’s Family Tree`}
      subtitle="A living map of connected bloodlines. Select a portrait for life stories, add members, or explore the tree from another relative’s perspective."
      action={
        <AddRelativeDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          persons={persons}
          onSubmit={(input) => {
            addPerson(input);
            toast.success(`${input.first_name} ${input.last_name} added to the family tree`);
            setAddOpen(false);
          }}
        />
      }
    >
      {birthFamily && birthFamilyPerson && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
          <HeartHandshake className="size-5 text-primary" />
          <p className="min-w-0 flex-1 text-sm">
            <strong className="font-semibold">{birthFamilyPerson.first_name}’s birth family{birthFamilyPerson.maiden_name ? ` (${birthFamilyPerson.maiden_name})` : ""}.</strong>{" "}
            Linked to your tree through marriage to {birthFamily.spouseIds.map(personName).join(", ")}.
            {birthFamily.relativeCount === 0 && " No relatives from their side are recorded yet — use Add member to grow it."}
          </p>
          <Button variant="outline" size="sm" onClick={() => { setBirthFamilyOf(null); setRootId("p_marcus"); }}>
            <RotateCcw className="size-3.5" /> Back to your tree
          </Button>
        </div>
      )}
      <FamilyTreeCanvas
        persons={birthFamily?.persons ?? mainPersons}
        relationships={birthFamily?.relationships ?? mainRelationships}
        timeline={timeline}
        rootId={rootId}
        selectedId={focusedId}
        onSelect={setFocusedId}
        onClearSelection={() => setFocusedId(null)}
        onOpenProfile={setProfileId}
        onOpenEvent={openEvent}
        onRootChange={(id) => { setBirthFamilyOf(null); setRootId(id); }}
      />

      <LifeEventDialog
        event={selectedEvent}
        personName={selectedEvent ? personName(selectedEvent.person_id) : ""}
        onOpenChange={(open) => !open && setEventId(null)}
        onSave={(input) => {
          if (selectedEvent) updateTimelineEvent(selectedEvent.id, input);
        }}
      />

      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setProfileId(null)}>
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
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Life events</h3>
                  <ul className="mt-3 space-y-2">
                    {selectedEvents.length === 0 && <li className="text-sm text-muted-foreground">No events recorded yet.</li>}
                    {selectedEvents.sort((a, b) => a.year - b.year).map((event) => (
                      <li key={event.id}>
                        <button type="button" onClick={() => openEvent(event.id)} className="flex w-full gap-3 rounded-md border border-border bg-card p-2 text-left text-sm hover:border-primary">
                          <span className="font-display text-primary-deep">{event.year}</span>
                          <span className="flex-1">{event.title}</span>
                          <span className="text-xs text-muted-foreground">Open story</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selected.id !== rootId && <Button variant="outline" onClick={() => { setRootId(selected.id); setFocusedId(null); setProfileId(null); }}><GitFork className="size-4" /> View family map</Button>}
                  {isMarriedIn(selected.id, "p_marcus", relationships) && <Button variant="outline" onClick={() => showBirthFamily(selected.id)}><HeartHandshake className="size-4" /> View {selected.first_name}’s birth family</Button>}
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
                      {t.charAt(0).toUpperCase() + t.slice(1)}
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
