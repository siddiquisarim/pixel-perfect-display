import appleFruit from "@/assets/tree-fruit-apple.png";
import type { FamilyPerson } from "@/lib/family-types";
import { cn } from "@/lib/utils";

function delayFor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return `-${(h / 1000) * 4}s`;
}

export function FruitPortrait({ person, className }: { person: FamilyPerson; className?: string }) {
  const delay = delayFor(person.id);
  return (
    <span className={cn("relative inline-block shrink-0 animate-fruit-sway group-hover:[animation-play-state:paused]", className)} style={{ animationDelay: delay }}>
      <span className="relative block size-full transition duration-300 group-hover:scale-105 group-hover:opacity-20 group-focus-within:scale-105 group-focus-within:opacity-20 motion-reduce:transition-none">
        <img src={appleFruit} alt="" loading="lazy" width={1024} height={1024} className="size-full object-contain drop-shadow-lg" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{ maskImage: `url(${appleFruit})`, WebkitMaskImage: `url(${appleFruit})`, maskSize: "contain", WebkitMaskSize: "contain", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center" }}
        >
          <span className="absolute inset-y-0 left-0 w-1/3 animate-fruit-shine bg-gradient-to-r from-transparent via-relationship-label to-transparent" style={{ animationDelay: delay }} />
        </span>
      </span>
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
