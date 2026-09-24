import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  Flag,
  Mail,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFamily } from "@/lib/family-store";
import type { MatchSuggestion } from "@/lib/family-types";

export const Route = createFileRoute("/discovery")({
  head: () => ({
    meta: [
      { title: "Discovery & Matches — FamilyLink" },
      {
        name: "description",
        content:
          "Review consent-based match suggestions with confidence scores and plain-language reasoning before requesting a family connection.",
      },
      { property: "og:title", content: "Discovery & Matches — FamilyLink" },
      {
        property: "og:description",
        content: "Possible family links with confidence scores, reasoning and a visual lineage path.",
      },
    ],
  }),
  component: DiscoveryPage,
});

function confidenceTone(score: number) {
  if (score >= 80) return "bg-verified text-verified-foreground hover:bg-verified";
  if (score >= 60) return "bg-primary text-primary-foreground hover:bg-primary";
  return "bg-secondary text-secondary-foreground hover:bg-secondary";
}

function DiscoveryPage() {
  const { user, matches, setMatchStatus } = useFamily();
  const [investigating, setInvestigating] = useState<MatchSuggestion | null>(null);
  const [connecting, setConnecting] = useState<MatchSuggestion | null>(null);
  const [reporting, setReporting] = useState<MatchSuggestion | null>(null);
  const [note, setNote] = useState("");

  const active = matches.filter((m) => m.status !== "dismissed");
  const dismissed = matches.filter((m) => m.status === "dismissed");

  return (
    <AppShell
      title="Discovery & Matches"
      subtitle="Possible relatives surfaced from shared nodes, ancestral locations and birth-year ranges. Nothing is shared without your consent."
    >
      {!user.discovery_consent ? (
        <div className="shell-panel flex flex-col items-center gap-3 px-6 py-20 text-center">
          <Sparkles className="size-7 text-primary" />
          <h2 className="font-display text-2xl">Enable Discovery to identify possible family links worldwide.</h2>
          <p className="max-w-md text-sm text-foreground/55">
            Use the “AI Discovery” switch in the header to opt in. Your records stay hidden from the
            discovery engine until you do.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {active.map((m) => (
            <article key={m.id} className="paper-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl">{m.matched_person_name}</h2>
                    {m.status === "connected" && (
                      <Badge className="bg-verified text-verified-foreground hover:bg-verified">
                        Connected
                      </Badge>
                    )}
                    {m.status === "investigating" && (
                      <Badge variant="outline" className="border-border-strong text-muted-foreground">
                        Investigating
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    b. {m.matched_person_birth_year} · {m.matched_person_location}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Contact:{" "}
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs tracking-wider">
                      {m.contact_hint}
                    </span>{" "}
                    <span className="text-xs">(protected until both sides accept)</span>
                  </p>
                </div>
                <Badge className={`${confidenceTone(m.confidence_score)} text-sm`}>
                  {m.confidence_score}% Confidence
                </Badge>
              </div>

              <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">
                {m.explanation}
              </p>

              <ul className="mt-3 flex flex-wrap gap-2">
                {m.reasoning_signals.map((s) => (
                  <li
                    key={s}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    {s}
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex items-start gap-2 text-xs italic text-muted-foreground">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                This is a possible relationship, not a confirmed relationship.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setInvestigating(m);
                    if (m.status === "pending") setMatchStatus(m.id, "investigating");
                  }}
                >
                  <Search className="size-4" /> Investigate
                </Button>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary-deep"
                  disabled={m.status === "connected"}
                  onClick={() => setConnecting(m)}
                >
                  <Mail className="size-4" /> Request family connection
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setMatchStatus(m.id, "dismissed");
                    toast("Match dismissed");
                  }}
                >
                  <X className="size-4" /> Dismiss
                </Button>
                <Button variant="ghost" onClick={() => setReporting(m)}>
                  <Flag className="size-4" /> Report false match
                </Button>
              </div>
            </article>
          ))}

          {dismissed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground/45">
                Dismissed
              </h2>
              <div className="space-y-2">
                {dismissed.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm"
                  >
                    <span>
                      {m.matched_person_name} · {m.confidence_score}% confidence
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => setMatchStatus(m.id, "pending")}>
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Visual path modal */}
      <Dialog open={Boolean(investigating)} onOpenChange={(o) => !o && setInvestigating(null)}>
        <DialogContent className="bg-paper text-paper-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Suggested lineage path</DialogTitle>
            <DialogDescription>
              How FamilyLink thinks you and {investigating?.matched_person_name} could be related.
            </DialogDescription>
          </DialogHeader>
          <ol className="flex flex-wrap items-center gap-2">
            {investigating?.lineage_path.map((step, i) => (
              <li key={`${step}-${i}`} className="flex items-center gap-2">
                <span
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    i === 0
                      ? "border-primary/50 bg-accent text-accent-foreground"
                      : "border-border bg-card"
                  }`}
                >
                  {step}
                </span>
                {i < (investigating?.lineage_path.length ?? 0) - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground" />
                )}
              </li>
            ))}
          </ol>
          <p className="text-xs italic text-muted-foreground">
            This is a possible relationship, not a confirmed relationship.
          </p>
        </DialogContent>
      </Dialog>

      {/* Connection request modal */}
      <Dialog open={Boolean(connecting)} onOpenChange={(o) => !o && setConnecting(null)}>
        <DialogContent className="bg-paper text-paper-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Request family connection</DialogTitle>
            <DialogDescription>
              We'll email {connecting?.matched_person_name} an in-app request. Contact details stay
              hidden until both sides accept.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Add a short message (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary-deep"
              onClick={() => {
                if (connecting) setMatchStatus(connecting.id, "connected");
                setConnecting(null);
                setNote("");
                toast.success("Connection accepted by both parties", {
                  description: "Shared relationships moved from claimed to connected.",
                });
              }}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report false match */}
      <Dialog open={Boolean(reporting)} onOpenChange={(o) => !o && setReporting(null)}>
        <DialogContent className="bg-paper text-paper-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Report false match</DialogTitle>
            <DialogDescription>
              Tell us what's wrong so the confidence engine can learn from it.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="e.g. Different Robert Johnson — wrong parish" />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (reporting) setMatchStatus(reporting.id, "dismissed");
                setReporting(null);
                toast.success("Report submitted");
              }}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
