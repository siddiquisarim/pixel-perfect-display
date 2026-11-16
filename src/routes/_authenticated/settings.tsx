import { createFileRoute } from "@tanstack/react-router";
import { Globe2, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useFamily } from "@/lib/family-store";
import type { GeoPrecision } from "@/lib/family-types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Privacy — FamilyLink" },
      {
        name: "description",
        content:
          "Control discovery consent, geographic precision and visibility of living relatives. Exact street addresses are never stored or shared.",
      },
      { property: "og:title", content: "Settings & Privacy — FamilyLink" },
      {
        property: "og:description",
        content: "Granular consent and visibility controls for your family records.",
      },
    ],
  }),
  component: SettingsPage,
});

const GEO_OPTIONS: { value: GeoPrecision; label: string; hint: string }[] = [
  { value: "country_city", label: "Country & City", hint: "Best match quality for discovery." },
  { value: "country_only", label: "Country Only", hint: "Balanced privacy and discoverability." },
  { value: "hidden", label: "Hidden", hint: "Locations are never shared with other users." },
];

function SettingsPage() {
  const { user, privacy, setPrivacy, setDiscoveryConsent, persons } = useFamily();
  const minors = persons.filter((p) => p.is_minor);

  return (
    <AppShell
      title="Settings & Privacy"
      subtitle="You decide what the discovery engine can see. Changes take effect immediately."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="paper-panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="size-4 text-primary-deep" /> Master discovery toggle
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Controls whether your records are exposed to the discovery engine at all.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-sm font-medium">
                AI Discovery: {user.discovery_consent ? "Opted In" : "Opted Out"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.discovery_consent
                  ? "Your tree can be compared against other consenting trees."
                  : "Your tree is excluded from all matching."}
              </p>
            </div>
            <Switch checked={user.discovery_consent} onCheckedChange={setDiscoveryConsent} />
          </div>
        </section>

        <section className="paper-panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Globe2 className="size-4 text-primary-deep" /> Geographic precision
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            How precisely your ancestral locations are shared with possible relatives.
          </p>
          <RadioGroup
            value={privacy.geo_precision}
            onValueChange={(v) => setPrivacy({ geo_precision: v as GeoPrecision })}
            className="mt-4 gap-2"
          >
            {GEO_OPTIONS.map((o) => (
              <Label
                key={o.value}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 font-normal"
              >
                <RadioGroupItem value={o.value} className="mt-0.5" />
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          <p className="mt-3 flex items-start gap-2 text-xs italic text-muted-foreground">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Exact street addresses are never stored or shared.
          </p>
        </section>

        <section className="paper-panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <ShieldCheck className="size-4 text-primary-deep" /> Visibility controls
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">Show living relatives to matches</p>
                <p className="text-xs text-muted-foreground">
                  Deceased ancestors remain visible either way.
                </p>
              </div>
              <Switch
                checked={privacy.show_living_relatives}
                onCheckedChange={(v) => setPrivacy({ show_living_relatives: v })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
              <div>
                <p className="text-sm font-medium">Allow invite links</p>
                <p className="text-xs text-muted-foreground">
                  Never available for protected minor records.
                </p>
              </div>
              <Switch
                checked={privacy.allow_invite_links}
                onCheckedChange={(v) => setPrivacy({ allow_invite_links: v })}
              />
            </div>
          </div>
        </section>

        <section className="paper-panel p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <Lock className="size-4 text-primary-deep" /> Protected minor records
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Records for living children under 13 are permanently excluded from discovery and invites.
          </p>
          <ul className="mt-4 space-y-2">
            {minors.length === 0 && (
              <li className="text-sm text-muted-foreground">No minor records in your tree.</li>
            )}
            {minors.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
              >
                <span>
                  {p.first_name} {p.last_name} · b. {p.birth_year}
                </span>
                <Badge className="bg-secondary text-secondary-foreground hover:bg-secondary">
                  Non-discoverable
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
