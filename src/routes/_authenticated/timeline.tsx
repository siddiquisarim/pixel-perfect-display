import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Film, ImageIcon } from "lucide-react";

import { MediaThumb, eventMedia } from "@/components/event-media";
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

export const Route = createFileRoute("/_authenticated/timeline")({
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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

      <div className="relative">
        <span className="absolute left-4 top-0 bottom-0 w-px bg-border-strong md:left-1/2" aria-hidden />
        <ol className="space-y-8">
          {rows.map((e, i) => {
            const media = eventMedia(e);
            const showDecade = i === 0 || Math.floor((rows[i - 1]?.year ?? 0) / 10) !== Math.floor(e.year / 10);
            const left = i % 2 === 0;
            return (
              <li key={e.id} className="relative">
                {showDecade && (
                  <p className="relative z-10 mb-6 ml-10 w-fit rounded-full border border-border bg-background px-3 py-1 font-display text-lg md:mx-auto">
                    {Math.floor(e.year / 10) * 10}s
                  </p>
                )}
                <span className="absolute left-4 top-8 z-10 size-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background md:left-1/2" aria-hidden />
                <div className={`pl-10 md:w-1/2 md:pl-0 ${left ? "md:pr-10" : "md:ml-auto md:pl-10"}`}>
                  <Link to="/life-events/$eventId" params={{ eventId: e.id }} className="paper-panel block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-paper">
                    {media.length > 0 && (
                      <div className={`grid gap-1 ${media.length > 1 ? "grid-cols-[2fr_1fr]" : ""}`}>
                        <MediaThumb item={media[0]} className="aspect-video rounded-none" />
                        {media.length > 1 && (
                          <div className="grid gap-1">
                            {media.slice(1, 3).map((m) => <MediaThumb key={m.id} item={m} className="h-full min-h-16 rounded-none" />)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-display text-3xl text-primary-deep">{e.year}</span>
                        <Badge className={TYPE_TONE[e.event_type]}>{e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)}</Badge>
                        <span className="text-xs text-muted-foreground">{personName(e.person_id)}</span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold">{e.title}</h3>
                      {e.description && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{e.description}</p>}
                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><ImageIcon className="size-3.5" />{media.filter((m) => m.kind === "image").length}</span>
                          <span className="flex items-center gap-1"><Film className="size-3.5" />{media.filter((m) => m.kind === "video").length}</span>
                        </span>
                        <span className="font-medium text-primary-deep">Read the story →</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No events recorded for this relative yet.</p>}
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
                      {t.charAt(0).toUpperCase() + t.slice(1)}
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
