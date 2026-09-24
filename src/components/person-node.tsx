import { Lock, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { FamilyPerson } from "@/lib/family-types";
import { cn } from "@/lib/utils";

export function initialsOf(person: FamilyPerson) {
  return `${person.first_name[0] ?? ""}${person.last_name[0] ?? ""}`.toUpperCase();
}

export function PersonNode({
  person,
  verified,
  isSelf,
  onClick,
}: {
  person: FamilyPerson;
  verified: boolean;
  isSelf?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-56 shrink-0 rounded-xl border bg-card p-3.5 text-left text-card-foreground shadow-paper transition-all hover:-translate-y-0.5 hover:shadow-lift",
        isSelf ? "border-primary/60 ring-2 ring-primary/25" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        {person.avatar_url ? (
          <img
            src={person.avatar_url}
            alt=""
            loading="lazy"
            width={96}
            height={96}
            className="size-11 rounded-lg object-cover"
          />
        ) : (
          <span className="flex size-11 items-center justify-center rounded-lg bg-secondary font-display text-base text-secondary-foreground">
            {initialsOf(person)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {person.first_name} {person.last_name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {person.maiden_name ? `née ${person.maiden_name} · ` : ""}
            {person.birth_year ? `b. ${person.birth_year}` : "year unknown"}
          </p>
        </div>
      </div>

      <p className="mt-2.5 truncate text-xs text-muted-foreground">
        {person.birth_place ?? "Place unknown"}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {isSelf && <Badge className="bg-primary text-primary-foreground hover:bg-primary">You</Badge>}
        {verified ? (
          <Badge className="gap-1 bg-verified text-verified-foreground hover:bg-verified">
            <ShieldCheck className="size-3" /> Connected
          </Badge>
        ) : (
          <Badge variant="outline" className="border-border-strong text-muted-foreground">
            Claimed
          </Badge>
        )}
        {!person.is_living && (
          <Badge variant="outline" className="border-border-strong text-muted-foreground">
            Deceased
          </Badge>
        )}
        {person.is_minor && (
          <Badge className="gap-1 bg-secondary text-secondary-foreground hover:bg-secondary">
            <Lock className="size-3" /> Protected Minor Node
          </Badge>
        )}
      </div>
      {person.is_minor && (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Non-discoverable. Invite links and AI discovery are disabled for under-13 records.
        </p>
      )}
    </button>
  );
}
