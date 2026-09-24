import { Link } from "@tanstack/react-router";
import {
  CalendarHeart,
  GitFork,
  Images,
  ScrollText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useFamily } from "@/lib/family-store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Family Tree", icon: GitFork },
  { to: "/discovery", label: "Discovery & Matches", icon: Sparkles },
  { to: "/timeline", label: "Timeline", icon: ScrollText },
  { to: "/events", label: "Events & RSVP", icon: CalendarHeart },
  { to: "/media", label: "Media Vault", icon: Images },
  { to: "/settings", label: "Settings & Privacy", icon: ShieldCheck },
] as const;

function KnotLogo() {
  return (
    <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/40">
      <svg viewBox="0 0 24 24" className="size-5 text-primary" fill="none" strokeWidth="1.8" stroke="currentColor">
        <circle cx="8" cy="8" r="4.2" />
        <circle cx="16" cy="16" r="4.2" />
        <path d="M11 11c1.2 1.2 1.8 1.8 2 2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { user, setDiscoveryConsent, media, storageUsedMb } = useFamily();
  const storagePct = Math.min(100, Math.round((storageUsedMb / 100) * 100));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-3">
            <KnotLogo />
            <span className="font-display text-xl tracking-tight">FamilyLink</span>
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-5">
            <div className="hidden w-40 sm:block">
              <div className="flex items-center justify-between text-[11px] text-foreground/60">
                <span>Storage</span>
                <span>{storageUsedMb.toFixed(1)} / 100 MB</span>
              </div>
              <Progress value={storagePct} className="mt-1.5 h-1.5 bg-white/10" />
              <p className="mt-1 text-[11px] text-foreground/45">{media.length} items in vault</p>
            </div>

            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-surface px-3 py-1.5">
              <Sparkles
                className={cn("size-4", user.discovery_consent ? "text-primary" : "text-foreground/40")}
              />
              <span className="text-xs font-medium">
                AI Discovery:{" "}
                <span className={user.discovery_consent ? "text-primary" : "text-foreground/50"}>
                  {user.discovery_consent ? "Opted In" : "Opted Out"}
                </span>
              </span>
              <Switch
                checked={user.discovery_consent}
                onCheckedChange={setDiscoveryConsent}
                aria-label="Global AI discovery consent"
              />
            </label>

            <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-surface py-1 pl-1 pr-3">
              <img
                src={user_avatar}
                alt=""
                loading="lazy"
                width={64}
                height={64}
                className="size-8 rounded-full object-cover"
              />
              <div className="leading-tight">
                <p className="text-xs font-semibold">{user.full_name}</p>
                <p className="text-[11px] text-foreground/50">{user.birth_place}</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground/60 transition-colors hover:text-foreground data-[status=active]:bg-white/8 data-[status=active]:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-foreground/55">{subtitle}</p>
          </div>
          {action}
        </div>
        <div className="mt-3 h-px w-32 gold-rule" />
        <div className="mt-7">{children}</div>
      </main>
    </div>
  );
}

import user_avatar from "@/assets/portrait-marcus.jpg";
