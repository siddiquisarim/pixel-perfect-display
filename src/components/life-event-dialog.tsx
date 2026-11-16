import { FileImage, Film, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MEDIA_LIMITS, type TimelineEvent, type TimelineEventMedia } from "@/lib/family-types";

function initialAttachments(event: TimelineEvent | null): TimelineEventMedia[] {
  if (!event) return [];
  if (event.attachments) return event.attachments;
  if (event.media_url) {
    return [{ id: `legacy-${event.id}`, kind: "image", url: event.media_url, name: "Event photograph" }];
  }
  return [];
}

export function LifeEventDialog({
  event,
  personName,
  onOpenChange,
  onSave,
}: {
  event: TimelineEvent | null;
  personName: string;
  onOpenChange: (open: boolean) => void;
  onSave: (input: { title: string; description: string; attachments: TimelineEventMedia[] }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TimelineEventMedia[]>([]);

  useEffect(() => {
    setTitle(event?.title ?? "");
    setDescription(event?.description ?? "");
    setAttachments(initialAttachments(event));
  }, [event]);

  const addFiles = (files: FileList | null, kind: "image" | "video") => {
    if (!files) return;
    const additions: TimelineEventMedia[] = [];
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith(`${kind}/`)) {
        toast.error(`${file.name} is not a ${kind === "image" ? "photo" : "video"}`);
        return;
      }
      if (kind === "video" && file.size > MEDIA_LIMITS.maxVideoMb * 1024 * 1024) {
        toast.error(`${file.name} is over ${MEDIA_LIMITS.maxVideoMb}MB`);
        return;
      }
      additions.push({
        id: `event-media-${Date.now()}-${index}`,
        kind,
        url: URL.createObjectURL(file),
        name: file.name,
      });
    });
    setAttachments((current) => [...current, ...additions]);
  };

  return (
    <Dialog open={Boolean(event)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-paper text-paper-foreground sm:max-w-2xl">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{event.year} · {event.title}</DialogTitle>
              <DialogDescription>Add to {personName}’s story with words, photographs, and video.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="life-event-title">Event title</Label>
                <Input id="life-event-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="life-event-notes">Story and notes</Label>
                <Textarea
                  id="life-event-notes"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write the details, memories, people present, or anything your family should remember."
                  className="min-h-32"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-card p-4 text-sm font-medium hover:border-primary">
                  <FileImage className="size-4 text-primary-deep" /> Add photographs
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files, "image")} />
                </Label>
                <Label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-card p-4 text-sm font-medium hover:border-primary">
                  <Film className="size-4 text-primary-deep" /> Add videos
                  <input type="file" accept="video/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files, "video")} />
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">Videos up to {MEDIA_LIMITS.maxVideoMb}MB. New files remain in this demo session.</p>

              {attachments.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {attachments.map((attachment) => (
                    <li key={attachment.id} className="overflow-hidden rounded-lg border border-border bg-card">
                      <div className="aspect-video bg-secondary">
                        {attachment.kind === "image" ? (
                          <img src={attachment.url} alt={attachment.name} className="size-full object-cover" />
                        ) : (
                          <video src={attachment.url} controls preload="metadata" className="size-full object-contain" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <span className="min-w-0 flex-1 truncate text-xs">{attachment.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${attachment.name}`}
                          onClick={() => setAttachments((current) => current.filter((item) => item.id !== attachment.id))}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <DialogFooter>
              <Button
                disabled={!title.trim()}
                onClick={() => {
                  onSave({ title: title.trim(), description: description.trim(), attachments });
                  onOpenChange(false);
                  toast.success("Life event updated");
                }}
              >
                <Plus className="size-4" /> Save event story
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
