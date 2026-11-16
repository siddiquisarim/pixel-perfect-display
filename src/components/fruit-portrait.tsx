import appleFruit from "@/assets/tree-fruit-apple.png";
import type { FamilyPerson } from "@/lib/family-types";
import { cn } from "@/lib/utils";

export function FruitPortrait({ person, className }: { person: FamilyPerson; className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <img
        src={appleFruit}
        alt=""
        loading="lazy"
        width={1024}
        height={1024}
        className="size-full object-contain drop-shadow-lg transition duration-300 group-hover:scale-105 group-hover:opacity-20 group-focus-within:scale-105 group-focus-within:opacity-20 motion-reduce:transition-none"
      />
      <span className="absolute left-1/2 top-[54%] flex size-[58%] -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center overflow-hidden rounded-full border-[3px] border-relationship-label bg-secondary opacity-0 shadow-portrait-hover transition duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100 motion-reduce:transition-none">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="font-display text-[clamp(0.8rem,2vw,1.5rem)] text-secondary-foreground">
            {person.first_name.charAt(0)}{person.last_name.charAt(0)}
          </span>
        )}
      </span>
    </span>
  );
}
