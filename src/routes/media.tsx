import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ImageIcon, Play, UploadCloud, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFamily } from "@/lib/family-store";
import { MEDIA_LIMITS, type MediaItem } from "@/lib/family-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Vault — FamilyLink" },
      {
        name: "description",
        content:
          "Store family photographs and short archival videos with clear free-tier limits and a simple upload flow.",
      },
      { property: "og:title", content: "Media Vault — FamilyLink" },
      {
        property: "og:description",
        content: "Family photos and archival video in one vault, with free-tier quota monitoring.",
      },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { media, imageCount, videoCount, addMedia } = useFamily();
  const [dragging, setDragging] = useState(false);
  const [capNotice, setCapNotice] = useState(false);
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast.error("Unsupported file type", { description: "Upload an image or a short video." });
      return;
    }
    if (isVideo && file.size > MEDIA_LIMITS.maxVideoMb * 1024 * 1024) {
      toast.error(`Video is over ${MEDIA_LIMITS.maxVideoMb}MB`);
      return;
    }

    // Simulates a direct-to-cloud upload (S3/GCS presigned pattern).
    setUploading(true);
    window.setTimeout(() => {
      const ok = addMedia({
        kind: isImage ? "image" : "video",
        title: file.name,
        url: URL.createObjectURL(file),
        poster_url: null,
        year: new Date().getFullYear(),
        size_label: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
      setUploading(false);
      if (ok) {
        setCapNotice(false);
        toast.success("Upload complete");
      } else {
        setCapNotice(true);
      }
    }, 900);
  };

  return (
    <AppShell
      title="Media Vault"
      subtitle="Photographs and short archival clips attached to your family's history. Free-tier limits are shown below."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="shell-panel p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ImageIcon className="size-4 text-primary" /> Images
            </span>
            <span className="text-foreground/60">
              {imageCount} / {MEDIA_LIMITS.images} used
            </span>
          </div>
          <Progress
            value={(imageCount / MEDIA_LIMITS.images) * 100}
            className="mt-3 h-1.5 bg-white/10"
          />
        </div>
        <div className="shell-panel p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Video className="size-4 text-primary" /> Videos
            </span>
            <span className="text-foreground/60">
              {videoCount} / {MEDIA_LIMITS.videos} used
            </span>
          </div>
          <Progress
            value={(videoCount / MEDIA_LIMITS.videos) * 100}
            className="mt-3 h-1.5 bg-white/10"
          />
          <p className="mt-2 text-[11px] text-foreground/45">
            Max {MEDIA_LIMITS.maxVideoSeconds}s / {MEDIA_LIMITS.maxVideoMb}MB per video
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-4 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-primary bg-primary/10" : "border-white/15 hover:border-primary/50",
        )}
      >
        <UploadCloud className="mx-auto size-6 text-primary" />
        <p className="mt-2 text-sm font-medium">
          {uploading ? "Uploading to secure storage…" : "Drop a photo or short video here"}
        </p>
        <p className="mt-1 text-xs text-foreground/45">
          JPG, PNG or MP4 · uploads go straight to cloud storage
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {capNotice && (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 text-primary" />
          Free tier cap reached. Additional storage unlocks in future tiers.
        </p>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {media.map((m) => (
          <figure key={m.id} className="paper-panel overflow-hidden">
            <div className="relative aspect-4/3 bg-secondary">
              <img
                src={m.kind === "video" ? (m.poster_url ?? m.url) : m.url}
                alt={m.title}
                loading="lazy"
                className="size-full object-cover"
              />
              {m.kind === "video" && (
                <button
                  type="button"
                  onClick={() => setPlaying(m)}
                  className="absolute inset-0 flex items-center justify-center bg-paper-foreground/35 transition-colors hover:bg-paper-foreground/50"
                  aria-label={`Play ${m.title}`}
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-primary">
                    <Play className="size-5 text-primary-foreground" />
                  </span>
                </button>
              )}
            </div>
            <figcaption className="p-3">
              <p className="truncate text-sm font-medium">{m.title}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {m.year ?? "—"} · {m.size_label}
                </span>
                <Badge variant="outline" className="border-border-strong text-xs text-muted-foreground">
                  {m.kind}
                </Badge>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <Dialog open={Boolean(playing)} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="bg-paper text-paper-foreground sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{playing?.title}</DialogTitle>
          </DialogHeader>
          {playing && (
            <video
              src={playing.url}
              poster={playing.poster_url ?? undefined}
              controls
              autoPlay
              className="w-full rounded-lg bg-black"
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
