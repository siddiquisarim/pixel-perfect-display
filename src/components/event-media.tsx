import { Play } from "lucide-react";

import type { TimelineEvent, TimelineEventMedia } from "@/lib/family-types";

export function eventMedia(event: TimelineEvent): TimelineEventMedia[] {
  if (event.attachments) return event.attachments;
  if (event.media_url) return [{ id: `legacy-${event.id}`, kind: "image", url: event.media_url, name: "Event photograph" }];
  return [];
}

export function MediaThumb({ item, className = "" }: { item: TimelineEventMedia; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md bg-secondary ${className}`}>
      {item.kind === "image" ? (
        <img src={item.url} alt={item.name} loading="lazy" className="size-full object-cover" />
      ) : (
        <>
          <video src={item.url} preload="metadata" muted className="size-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-foreground/25">
            <Play className="size-6 fill-background text-background" />
          </span>
        </>
      )}
    </div>
  );
}
