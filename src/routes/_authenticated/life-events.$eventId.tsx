import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, FileImage, Film, Heart, Mail, MapPin, MessageSquareQuote,
  NotebookPen, Pencil, Plus, Smile, Tag, Trash2, UserRound, Users, X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { eventMedia } from "@/components/event-media";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/lib/family-store";
import { MEDIA_LIMITS, type DiaryEntry, type DiaryEntryKind, type TimelineEvent, type TimelineEventMedia } from "@/lib/family-types";

export const Route = createFileRoute("/_authenticated/life-events/$eventId")({
  head: () => ({
    meta: [
      { title: "Life Event Diary — FamilyLink" },
      { name: "description", content: "A family diary page for one life event: story, memories, quotes, people, places, photographs and video." },
      { property: "og:title", content: "Life Event Diary — FamilyLink" },
      { property: "og:description", content: "Read and add to a family moment like a shared diary." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LifeEventPage,
});

const TYPE_LABEL = { birth: "Birth", marriage: "Marriage", migration: "Migration", death: "Passing", custom: "Milestone" };
const MOODS = ["Joyful", "Hopeful", "Proud", "Bittersweet", "Peaceful", "Difficult", "Celebratory"];
const ENTRY_KINDS: Record<DiaryEntryKind, { label: string; icon: typeof Heart; hint: string }> = {
  memory: { label: "Memory", icon: Heart, hint: "What do you remember about this moment?" },
  note: { label: "Note", icon: NotebookPen, hint: "Facts, dates, sources or research notes." },
  quote: { label: "Quote", icon: MessageSquareQuote, hint: "Something someone said, word for word." },
  letter: { label: "Letter", icon: Mail, hint: "Write to the person, or to future generations." },
};

function LifeEventPage() {
  const { eventId } = Route.useParams();
  const { timeline, persons, personName, updateTimelineEvent } = useFamily();
  const [lightbox, setLightbox] = useState<TimelineEventMedia | null>(null);
  const [editingStory, setEditingStory] = useState(false);
  const event = timeline.find((e) => e.id === eventId);

  if (!event) {
    return (
      <AppShell title="Story not found" subtitle="This life event may have been removed.">
        <Button asChild variant="outline"><Link to="/timeline"><ArrowLeft className="size-4" /> Back to timeline</Link></Button>
      </AppShell>
    );
  }

  const patch = (input: Partial<TimelineEvent>) => updateTimelineEvent(event.id, input);
  const person = persons.find((p) => p.id === event.person_id);
  const media = eventMedia(event);
  const entries = event.entries ?? [];
  const chapters = timeline.filter((e) => e.person_id === event.person_id).sort((a, b) => a.year - b.year);
  const index = chapters.findIndex((e) => e.id === event.id);
  const prev = chapters[index - 1];
  const next = chapters[index + 1];
  const age = person?.birth_year ? event.year - person.birth_year : null;

  return (
    <AppShell
      title={event.title}
      subtitle={`${TYPE_LABEL[event.event_type]} · ${event.date_label ?? event.year} · ${personName(event.person_id)}`}
      action={<Button asChild variant="outline"><Link to="/timeline"><ArrowLeft className="size-4" /> Family timeline</Link></Button>}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {/* Diary cover */}
          <article className="paper-panel relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-2 bg-primary/70" aria-hidden />
            <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="space-y-3 p-6 pl-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary-deep">Chapter {index + 1} of {chapters.length} · {person?.first_name}’s diary</p>
                <p className="font-display text-6xl leading-none text-primary-deep">{event.year}</p>
                <h2 className="font-display text-3xl leading-tight">{event.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{TYPE_LABEL[event.event_type]}</Badge>
                  {event.mood && <Badge variant="outline"><Smile className="size-3" /> {event.mood}</Badge>}
                  {age !== null && age >= 0 && <Badge variant="outline"><UserRound className="size-3" /> Age {age}</Badge>}
                </div>
                {event.location && <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" /> {event.location}</p>}
              </div>
              <div className="min-h-56 bg-secondary">
                {media[0] ? (
                  <button type="button" className="block size-full" onClick={() => setLightbox(media[0]!)} aria-label="Open cover photo">
                    {media[0].kind === "image" ? <img src={media[0].url} alt={media[0].name} className="size-full max-h-80 object-cover" /> : <video src={media[0].url} muted preload="metadata" className="size-full max-h-80 object-cover" />}
                  </button>
                ) : (
                  <div className="flex size-full min-h-56 flex-col items-center justify-center gap-2 text-secondary-foreground"><CalendarDays className="size-8 text-primary" /><p className="text-sm">Add a photograph to make this the cover.</p></div>
                )}
              </div>
            </div>
          </article>

          {/* The story */}
          <section className="paper-panel p-6 pl-8">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 font-display text-2xl"><BookOpen className="size-5 text-primary" /> The story</h3>
              {!editingStory && <Button variant="ghost" size="sm" onClick={() => setEditingStory(true)}><Pencil className="size-4" /> Write</Button>}
            </div>
            {editingStory ? (
              <StoryEditor event={event} onCancel={() => setEditingStory(false)} onSave={(v) => { patch(v); setEditingStory(false); toast.success("Story saved"); }} />
            ) : (
              <p className="diary-lines whitespace-pre-line font-display text-xl text-foreground">{event.description || "This page is still blank. Write what happened, who was there and why it mattered."}</p>
            )}
          </section>

          {/* Gallery */}
          <section className="paper-panel p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-2xl">Photographs & film <span className="text-base text-muted-foreground">· {media.filter((m) => m.kind === "image").length} photos · {media.filter((m) => m.kind === "video").length} videos</span></h3>
              <MediaUpload onAdd={(items) => patch({ attachments: [...media, ...items] })} />
            </div>
            {media.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-muted-foreground">No photographs or video yet. Add scans of old prints, letters, certificates or short clips.</p>
            ) : (
              <ul className="columns-2 gap-3 sm:columns-3">
                {media.map((m, i) => (
                  <li key={m.id} className={`mb-3 break-inside-avoid bg-card p-2 pb-3 shadow-paper ${i % 2 ? "rotate-1" : "-rotate-1"} transition-transform hover:rotate-0`}>
                    <button type="button" className="block w-full" onClick={() => setLightbox(m)} aria-label={`Open ${m.name}`}>
                      {m.kind === "image" ? <img src={m.url} alt={m.name} loading="lazy" className="w-full object-cover" /> : <video src={m.url} muted preload="metadata" className="w-full object-cover" />}
                    </button>
                    <p className="mt-2 px-1 font-display text-sm leading-snug">{event.captions?.[m.id] ?? m.name}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Diary entries */}
          <section className="space-y-4">
            <h3 className="font-display text-2xl">Family diary <span className="text-base text-muted-foreground">· {entries.length} {entries.length === 1 ? "entry" : "entries"}</span></h3>
            {entries.map((entry) => <EntryCard key={entry.id} entry={entry} onDelete={() => patch({ entries: entries.filter((e) => e.id !== entry.id) })} />)}
            <EntryComposer names={persons.map((p) => `${p.first_name} ${p.last_name}`)} onAdd={(entry) => { patch({ entries: [...entries, entry] }); toast.success(`${ENTRY_KINDS[entry.kind].label} added to the diary`); }} />
          </section>
        </div>

        <aside className="space-y-4">
          <DetailsCard event={event} onSave={(v) => { patch(v); toast.success("Details updated"); }} />

          <section className="paper-panel p-5">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Users className="size-4" /> People in this moment</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(event.people_ids ?? [event.person_id]).map((id) => (
                <li key={id} className="flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-sm">
                  {personName(id)}
                  <button type="button" aria-label={`Remove ${personName(id)}`} className="rounded-full p-0.5 hover:bg-accent" onClick={() => patch({ people_ids: (event.people_ids ?? [event.person_id]).filter((x) => x !== id) })}><X className="size-3" /></button>
                </li>
              ))}
            </ul>
            <Select value="" onValueChange={(id) => patch({ people_ids: [...new Set([...(event.people_ids ?? [event.person_id]), id])] })}>
              <SelectTrigger className="mt-3" aria-label="Add a person"><SelectValue placeholder="Add someone who was there" /></SelectTrigger>
              <SelectContent>{persons.filter((p) => !(event.people_ids ?? [event.person_id]).includes(p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent>
            </Select>
          </section>

          <TagsCard tags={event.tags ?? []} onChange={(tags) => patch({ tags })} />

          <section className="paper-panel p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{person?.first_name ?? "Their"}’s life chapters</h3>
            <ol className="relative mt-3 space-y-1 border-l border-border-strong pl-4">
              {chapters.map((e) => (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-[21px] top-3 size-2.5 rounded-full ${e.id === event.id ? "bg-primary" : "bg-border-strong"}`} />
                  <Link to="/life-events/$eventId" params={{ eventId: e.id }} className={`flex gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent ${e.id === event.id ? "bg-accent font-semibold" : ""}`}>
                    <span className="w-10 font-display text-primary-deep">{e.year}</span><span className="flex-1">{e.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex justify-between gap-2">
              {prev ? <Button asChild variant="outline" size="sm"><Link to="/life-events/$eventId" params={{ eventId: prev.id }}><ArrowLeft className="size-4" /> {prev.year}</Link></Button> : <span />}
              {next && <Button asChild variant="outline" size="sm"><Link to="/life-events/$eventId" params={{ eventId: next.id }}>{next.year} <ArrowRight className="size-4" /></Link></Button>}
            </div>
          </section>
        </aside>
      </div>

      <Dialog open={Boolean(lightbox)} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="bg-paper text-paper-foreground sm:max-w-4xl">
          {lightbox && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{event.captions?.[lightbox.id] ?? lightbox.name}</DialogTitle>
                <DialogDescription>{event.title} · {event.year}</DialogDescription>
              </DialogHeader>
              {lightbox.kind === "image" ? <img src={lightbox.url} alt={lightbox.name} className="max-h-[60vh] w-full object-contain" /> : <video src={lightbox.url} controls autoPlay className="max-h-[60vh] w-full bg-foreground object-contain" />}
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="caption">Caption</Label>
                  <Input id="caption" key={lightbox.id} defaultValue={event.captions?.[lightbox.id] ?? ""} placeholder="Who, where, when?" onBlur={(e) => patch({ captions: { ...event.captions, [lightbox.id]: e.target.value } })} />
                </div>
                <Button variant="outline" onClick={() => { patch({ attachments: media.filter((m) => m.id !== lightbox.id) }); setLightbox(null); toast.success("Removed from this event"); }}><Trash2 className="size-4" /> Remove</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function StoryEditor({ event, onSave, onCancel }: { event: TimelineEvent; onSave: (v: { title: string; description: string }) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5"><Label htmlFor="story-title">Title</Label><Input id="story-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="grid gap-1.5"><Label htmlFor="story-text">Story</Label><Textarea id="story-text" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-48 font-display text-lg" /></div>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), description: description.trim() })}>Save story</Button></div>
    </div>
  );
}

function MediaUpload({ onAdd }: { onAdd: (items: TimelineEventMedia[]) => void }) {
  const handle = (files: FileList | null, kind: "image" | "video") => {
    if (!files) return;
    const items: TimelineEventMedia[] = [];
    Array.from(files).forEach((file, i) => {
      if (!file.type.startsWith(`${kind}/`)) return void toast.error(`${file.name} is not a ${kind === "image" ? "photo" : "video"}`);
      if (kind === "video" && file.size > MEDIA_LIMITS.maxVideoMb * 1024 * 1024) return void toast.error(`${file.name} is over ${MEDIA_LIMITS.maxVideoMb}MB`);
      items.push({ id: `event-media-${Date.now()}-${i}`, kind, url: URL.createObjectURL(file), name: file.name });
    });
    if (items.length) { onAdd(items); toast.success(`${items.length} added to this event`); }
  };
  return (
    <div className="flex gap-2">
      <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:border-primary">
        <FileImage className="size-4 text-primary-deep" /> Add photos
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => handle(e.target.files, "image")} />
      </Label>
      <Label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium hover:border-primary">
        <Film className="size-4 text-primary-deep" /> Add video
        <input type="file" accept="video/*" multiple className="sr-only" onChange={(e) => handle(e.target.files, "video")} />
      </Label>
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: DiaryEntry; onDelete: () => void }) {
  const kind = ENTRY_KINDS[entry.kind];
  const Icon = kind.icon;
  return (
    <article className="paper-panel relative p-5 pl-8">
      <div className="absolute inset-y-4 left-4 w-px bg-primary/40" aria-hidden />
      <header className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-4 text-primary" />
        <span className="font-semibold uppercase tracking-[0.14em] text-primary-deep">{kind.label}</span>
        <span>· {entry.author} · {new Date(entry.written_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        <button type="button" aria-label="Delete entry" onClick={onDelete} className="ml-auto rounded p-1 hover:bg-accent"><Trash2 className="size-3.5" /></button>
      </header>
      {entry.kind === "quote" ? (
        <blockquote className="font-display text-2xl leading-snug">“{entry.text}”</blockquote>
      ) : (
        <p className={`diary-lines whitespace-pre-line font-display text-lg ${entry.kind === "letter" ? "italic" : ""}`}>{entry.text}</p>
      )}
    </article>
  );
}

function EntryComposer({ names, onAdd }: { names: string[]; onAdd: (entry: DiaryEntry) => void }) {
  const [kind, setKind] = useState<DiaryEntryKind>("memory");
  const [author, setAuthor] = useState("Marcus Johnson");
  const [text, setText] = useState("");
  return (
    <div className="paper-panel space-y-3 border-dashed p-5">
      <p className="font-display text-xl">Add to the diary</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Entry type">
        {(Object.keys(ENTRY_KINDS) as DiaryEntryKind[]).map((k) => {
          const Icon = ENTRY_KINDS[k].icon;
          return (
            <Button key={k} type="button" size="sm" role="radio" aria-checked={kind === k} variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>
              <Icon className="size-4" /> {ENTRY_KINDS[k].label}
            </Button>
          );
        })}
      </div>
      <Textarea aria-label="Diary entry" value={text} onChange={(e) => setText(e.target.value)} placeholder={ENTRY_KINDS[kind].hint} className="min-h-28 font-display text-lg" />
      <div className="flex flex-wrap items-center gap-2">
        <Select value={author} onValueChange={setAuthor}>
          <SelectTrigger className="w-56" aria-label="Written by"><SelectValue /></SelectTrigger>
          <SelectContent>{names.map((n) => <SelectItem key={n} value={n}>Written by {n}</SelectItem>)}</SelectContent>
        </Select>
        <Button className="ml-auto" disabled={!text.trim()} onClick={() => { onAdd({ id: `de_${Date.now()}`, kind, author, text: text.trim(), written_at: new Date().toISOString().slice(0, 10) }); setText(""); }}>
          <Plus className="size-4" /> Add {ENTRY_KINDS[kind].label.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}

function DetailsCard({ event, onSave }: { event: TimelineEvent; onSave: (v: Partial<TimelineEvent>) => void }) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(event.date_label ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [mood, setMood] = useState(event.mood ?? "");
  return (
    <section className="paper-panel space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Details</h3>
        {!editing && <Button variant="ghost" size="sm" onClick={() => { setDate(event.date_label ?? ""); setLocation(event.location ?? ""); setMood(event.mood ?? ""); setEditing(true); }}><Pencil className="size-3.5" /> Edit</Button>}
      </div>
      {editing ? (
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label htmlFor="d-date">When</Label><Input id="d-date" value={date} onChange={(e) => setDate(e.target.value)} placeholder={`e.g. Summer ${event.year}`} /></div>
          <div className="grid gap-1.5"><Label htmlFor="d-loc">Where</Label><Input id="d-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Town, country" /></div>
          <div className="grid gap-1.5">
            <Label>Feeling</Label>
            <div className="flex flex-wrap gap-1.5">{MOODS.map((m) => <Button key={m} type="button" size="sm" variant={mood === m ? "default" : "outline"} onClick={() => setMood(mood === m ? "" : m)}>{m}</Button>)}</div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button><Button onClick={() => { onSave({ date_label: date.trim() || undefined, location: location.trim() || undefined, mood: mood || undefined }); setEditing(false); }}>Save details</Button></div>
        </div>
      ) : (
        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" /><dt className="sr-only">When</dt><dd>{event.date_label ?? event.year}</dd></div>
          <div className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" /><dt className="sr-only">Where</dt><dd>{event.location ?? <span className="text-muted-foreground">Place not recorded</span>}</dd></div>
          <div className="flex items-center gap-2"><Smile className="size-4 text-muted-foreground" /><dt className="sr-only">Feeling</dt><dd>{event.mood ?? <span className="text-muted-foreground">No feeling chosen</span>}</dd></div>
        </dl>
      )}
    </section>
  );
}

function TagsCard({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => { const t = value.trim(); if (t && !tags.includes(t)) onChange([...tags, t]); setValue(""); };
  return (
    <section className="paper-panel p-5">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Tag className="size-4" /> Tags</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => <li key={t}><Badge variant="secondary" className="gap-1">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(tags.filter((x) => x !== t))}><X className="size-3" /></button></Badge></li>)}
        {tags.length === 0 && <li className="text-sm text-muted-foreground">No tags yet.</li>}
      </ul>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <Input aria-label="New tag" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. Harbour, Wedding" />
        <Button type="submit" variant="outline" size="icon" aria-label="Add tag"><Plus className="size-4" /></Button>
      </form>
    </section>
  );
}
