import { createFileRoute } from "@tanstack/react-router";
import { CalendarPlus, Check, MapPin, Plus, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/lib/family-store";
import type { FamilyEvent, FamilyEventType, RsvpStatus } from "@/lib/family-types";

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & RSVP — FamilyLink" },
      {
        name: "description",
        content:
          "Plan reunions, birthdays and weddings, invite relatives from your tree or outside it, and track RSVPs in one place.",
      },
      { property: "og:title", content: "Events & RSVP — FamilyLink" },
      {
        property: "og:description",
        content: "Create family gatherings, invite guests and track yes, no and maybe responses.",
      },
    ],
  }),
  component: EventsPage,
});

const EVENT_TYPES: FamilyEventType[] = ["reunion", "birthday", "anniversary", "wedding"];

function EventsPage() {
  const { events, rsvps, setRsvpStatus } = useFamily();
  const [guestEvent, setGuestEvent] = useState<FamilyEvent | null>(null);

  return (
    <AppShell
      title="Events & RSVP"
      subtitle="Gatherings across the family, with invitees drawn from your tree plus guests who aren't on it yet."
      action={<CreateEventDialog />}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {events.map((e) => {
          const list = rsvps.filter((r) => r.event_id === e.id);
          const count = (s: RsvpStatus) => list.filter((r) => r.status === s).length;
          return (
            <article key={e.id} className="paper-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                    {e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)}
                  </Badge>
                  <h2 className="mt-2 font-display text-xl">{e.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {e.location}
                  </p>
                </div>
                <p className="font-display text-lg text-primary-deep">
                  {new Date(e.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {(["yes", "maybe", "no"] as RsvpStatus[]).map((s) => (
                  <div key={s} className="rounded-lg border border-border bg-card p-2.5">
                    <p className="font-display text-2xl">{count(s)}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{s}</p>
                  </div>
                ))}
              </div>

              <ul className="mt-4 space-y-1.5">
                {list.map((r) => (
                  <li key={r.id} className="flex items-center justify-between text-sm">
                    <span>{r.invitee_name}</span>
                    <Badge
                      variant="outline"
                      className="border-border-strong text-xs capitalize text-muted-foreground"
                    >
                      {r.status}
                    </Badge>
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="mt-4" onClick={() => setGuestEvent(e)}>
                <Users className="size-4" /> Open guest RSVP view
              </Button>
            </article>
          );
        })}
      </div>

      <Dialog open={Boolean(guestEvent)} onOpenChange={(o) => !o && setGuestEvent(null)}>
        <DialogContent className="bg-paper text-paper-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{guestEvent?.title}</DialogTitle>
            <DialogDescription>
              Guest view — tap a response to update an invitee's RSVP.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {rsvps
              .filter((r) => r.event_id === guestEvent?.id)
              .map((r) => (
                <li key={r.id} className="rounded-lg border border-border bg-card p-3">
                  <p className="text-sm font-medium">{r.invitee_name}</p>
                  <p className="text-xs text-muted-foreground">{r.invitee_email}</p>
                  <div className="mt-2 flex gap-2">
                    {(["yes", "maybe", "no"] as RsvpStatus[]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={r.status === s ? "default" : "outline"}
                        className={
                          r.status === s
                            ? "bg-primary text-primary-foreground hover:bg-primary-deep"
                            : ""
                        }
                        onClick={() => {
                          setRsvpStatus(r.id, s);
                          toast.success(`${r.invitee_name} marked “${s}”`);
                        }}
                      >
                        {r.status === s && <Check className="size-3.5" />}
                        <span className="capitalize">{s}</span>
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function CreateEventDialog() {
  const { persons, addEvent } = useFamily();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FamilyEventType>("reunion");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [treeInvitees, setTreeInvitees] = useState<string[]>([]);
  const [guests, setGuests] = useState<{ name: string; email: string }[]>([]);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const toggleInvitee = (id: string) =>
    setTreeInvitees((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary-deep">
          <CalendarPlus className="size-4" /> Create event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-paper-foreground sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Create family event</DialogTitle>
          <DialogDescription>Invite relatives from your tree, or guests outside it.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="evt">Event name</Label>
            <Input id="evt" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as FamilyEventType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="evd">Date</Label>
              <Input id="evd" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="evl">Location</Label>
            <Input id="evl" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="evdesc">Description</Label>
            <Textarea
              id="evdesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium">Invite from your tree</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {persons
                .filter((p) => p.is_living)
                .map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={treeInvitees.includes(p.id)}
                      onCheckedChange={() => toggleInvitee(p.id)}
                    />
                    {p.first_name} {p.last_name}
                  </label>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm font-medium">Guests not on the tree</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Input
                placeholder="Name"
                className="flex-1"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <Input
                placeholder="Email"
                type="email"
                className="flex-1"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!guestName.trim() || !guestEmail.trim()}
                onClick={() => {
                  setGuests((prev) => [...prev, { name: guestName, email: guestEmail }]);
                  setGuestName("");
                  setGuestEmail("");
                }}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {guests.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {guests.map((g) => (
                  <li
                    key={g.email}
                    className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                  >
                    {g.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary-deep"
            disabled={!title.trim() || !date}
            onClick={() => {
              const treeGuests = treeInvitees.map((id) => {
                const p = persons.find((x) => x.id === id)!;
                return {
                  name: `${p.first_name} ${p.last_name}`,
                  email: `${p.first_name.toLowerCase()}@example.com`,
                };
              });
              addEvent({ title, event_type: type, date, location, description }, [
                ...treeGuests,
                ...guests,
              ]);
              setOpen(false);
              setTitle("");
              setDate("");
              setLocation("");
              setDescription("");
              setTreeInvitees([]);
              setGuests([]);
              toast.success("Event created and invitations sent");
            }}
          >
            Create event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
