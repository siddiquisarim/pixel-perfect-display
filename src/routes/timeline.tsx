import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/lib/family-store";
import type { TimelineEventType } from "@/lib/family-types";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Family Timeline — FamilyLink" },
      {
        name: "description",
        content:
          "A chronological timeline of births, marriages, migrations and milestones across every branch of your family.",
      },
      { property: "og:title", content: "Family Timeline — FamilyLink" },
      {
        property: "og:description",
        content: "Births, marriages, migrations and milestones, filterable by family member.",
      },
    ],
  }),
  component: TimelinePage,
});

const TYPE_TONE: Record<TimelineEventType, string> = {
  birth: "bg-verified text-verified-foreground hover:bg-verified",
  marriage: "bg-primary text-primary-foreground hover:bg-primary",
  migration: "bg-accent text-accent-foreground hover:bg-accent",
  death: "bg-secondary text-secondary-foreground hover:bg-secondary",
  custom: "bg-secondary text-secondary-foreground hover:bg-secondary",
};

function TimelinePage() {
  const { timeline, persons, personName } = useFamily();
  const [filter, setFilter] = useState("all");

  const rows = useMemo(
    () =>
      timeline
        .filter((t) => filter === "all" || t.person_id === filter)
        .sort((a, b) => a.year - b.year),
    [timeline, filter],
  );

  return (
    <AppShell
      title="Family Timeline"
      subtitle="Every recorded milestone in chronological order. Filter by a single relative or view all branches together."
      action={<AddEventDrawer onAdded={() => toast.success("Timeline event added")} />}
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Label className="text-xs uppercase tracking-[0.16em] text-foreground/45">Filter</Label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-64 border-white/15 bg-surface text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {persons.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-foreground/40">{rows.length} events</span>
      </div>

      <div className="relative pl-6">
        <span className="absolute left-1.5 top-2 bottom-2 w-px bg-white/15" aria-hidden />
        <ul className="space-y-5">
          {rows.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[1.125rem] top-6 size-2.5 rounded-full bg-primary ring-4 ring-background" />
              <article className="paper-panel flex flex-wrap gap-4 p-4">
                {e.media_url && (
                  <img
                    src={e.media_url}
                    alt=""
                    loading="lazy"
                    width={320}
                    height={320}
                    className="size-24 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-56 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-display text-2xl text-primary-deep">{e.year}</span>
                    <Badge className={TYPE_TONE[e.event_type]}>
                      {e.event_type[0].toUpperCase() + e.event_type.slice(1)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{personName(e.person_id)}</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold">{e.title}</h3>
                  {e.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}

function AddEventDrawer({ onAdded }: { onAdded: () => void }) {
  const { persons, addTimelineEvent } = useFamily();
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("p_marcus");
  const [type, setType] = useState<TimelineEventType>("custom");
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-deep">
          <CalendarPlus className="size-4" /> Quick add event
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-paper text-paper-foreground sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Quick add event</SheetTitle>
        </SheetHeader>
        <div className="grid gap-4 px-4">
          <div className="grid gap-1.5">
            <Label>Family member</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {persons.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.first_name} {p.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <Label htmlFor="ty">Year</Label>
              <Input
                id="ty"
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="tt">Title</Label>
            <Input id="tt" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="td">Notes</Label>
            <Textarea id="td" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-deep"
            disabled={!title.trim() || year.length !== 4}
            onClick={() => {
              addTimelineEvent({ person_id: personId, event_type: type, year, title, description });
              setOpen(false);
              setTitle("");
              setYear("");
              setDescription("");
              onAdded();
            }}
          >
            Save event
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
