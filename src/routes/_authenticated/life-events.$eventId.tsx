import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Pencil, UserRound } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { eventMedia } from "@/components/event-media";
import { LifeEventDialog } from "@/components/life-event-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFamily } from "@/lib/family-store";
import type { TimelineEventMedia } from "@/lib/family-types";

export const Route = createFileRoute("/_authenticated/life-events/$eventId")({
  head: () => ({
    meta: [
      { title: "Life Event Story — FamilyLink" },
      { name: "description", content: "The full story of a family life event, with notes, photographs and video." },
      { property: "og:title", content: "Life Event Story — FamilyLink" },
      { property: "og:description", content: "Read and relive a family moment with its photographs and video." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LifeEventPage,
});

const TYPE_LABEL = { birth: "Birth", marriage: "Marriage", migration: "Migration", death: "Passing", custom: "Milestone" };

function LifeEventPage() {
  const { eventId } = Route.useParams();
  const { timeline, persons, personName, updateTimelineEvent } = useFamily();
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState<TimelineEventMedia | null>(null);
  const event = timeline.find((e) => e.id === eventId);

  if (!event) {
    return (
      <AppShell title="Story not found" subtitle="This life event may have been removed.">
        <Button asChild variant="outline"><Link to="/timeline"><ArrowLeft className="size-4" /> Back to timeline</Link></Button>
      </AppShell>
    );
  }

  const person = persons.find((p) => p.id === event.person_id);
  const media = eventMedia(event);
  const hero = active ?? media[0] ?? null;
  const siblings = timeline.filter((e) => e.person_id === event.person_id).sort((a, b) => a.year - b.year);
  const index = siblings.findIndex((e) => e.id === event.id);
  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const age = person?.birth_year ? event.year - person.birth_year : null;

  return (
    <AppShell
      title={event.title}
      subtitle={`${TYPE_LABEL[event.event_type]} · ${event.year} · ${personName(event.person_id)}`}
      action={<Button onClick={() => setEditing(true)}><Pencil className="size-4" /> Edit story & media</Button>}
    >
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link to="/timeline"><ArrowLeft className="size-4" /> Family timeline</Link></Button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <div className="paper-panel overflow-hidden">
            {hero ? (
              hero.kind === "image" ? (
                <img src={hero.url} alt={hero.name} className="aspect-video w-full object-cover" />
              ) : (
                <video key={hero.id} src={hero.url} controls className="aspect-video w-full bg-foreground object-contain" />
              )
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-secondary text-center text-secondary-foreground">
                <CalendarDays className="size-8 text-primary" />
                <p className="font-display text-3xl">{event.year}</p>
                <p className="text-sm">No photographs or video yet.</p>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Add photos or video</Button>
              </div>
            )}
          </div>
          {media.length > 1 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {media.map((m) => (
                <li key={m.id}>
                  <button type="button" aria-label={`Show ${m.name}`} onClick={() => setActive(m)} className={`block aspect-video w-full overflow-hidden rounded-md border-2 ${hero?.id === m.id ? "border-primary" : "border-transparent"}`}>
                    {m.kind === "image" ? <img src={m.url} alt="" className="size-full object-cover" /> : <video src={m.url} preload="metadata" muted className="size-full object-cover" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="paper-panel space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span className="font-display text-5xl text-primary-deep">{event.year}</span>
              <Badge variant="secondary">{TYPE_LABEL[event.event_type]}</Badge>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /><dt className="sr-only">Person</dt><dd>{personName(event.person_id)}{age !== null && age >= 0 ? ` · age ${age}` : ""}</dd></div>
              {person?.birth_place && <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><dt className="sr-only">Family place</dt><dd>{person.birth_place}</dd></div>}
            </dl>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">The story</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{event.description || "No story written yet. Use Edit story & media to record what happened, who was there, and what the family remembers."}</p>
            </div>
            <p className="text-xs text-muted-foreground">{media.filter((m) => m.kind === "image").length} photos · {media.filter((m) => m.kind === "video").length} videos</p>
          </div>

          <div className="paper-panel p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{person?.first_name ?? "Their"}’s life events</h2>
            <ol className="mt-3 space-y-1">
              {siblings.map((e) => (
                <li key={e.id}>
                  <Link to="/life-events/$eventId" params={{ eventId: e.id }} onClick={() => setActive(null)} className={`flex gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent ${e.id === event.id ? "bg-accent font-semibold" : ""}`}>
                    <span className="w-10 font-display text-primary-deep">{e.year}</span><span className="flex-1">{e.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex justify-between gap-2">
              {prev ? <Button asChild variant="outline" size="sm"><Link to="/life-events/$eventId" params={{ eventId: prev.id }} onClick={() => setActive(null)}><ArrowLeft className="size-4" /> {prev.year}</Link></Button> : <span />}
              {next && <Button asChild variant="outline" size="sm"><Link to="/life-events/$eventId" params={{ eventId: next.id }} onClick={() => setActive(null)}>{next.year} <ArrowRight className="size-4" /></Link></Button>}
            </div>
          </div>
        </aside>
      </div>

      <LifeEventDialog
        event={editing ? event : null}
        personName={personName(event.person_id)}
        onOpenChange={(open) => !open && setEditing(false)}
        onSave={(input) => { updateTimelineEvent(event.id, input); setActive(null); }}
      />
    </AppShell>
  );
}
