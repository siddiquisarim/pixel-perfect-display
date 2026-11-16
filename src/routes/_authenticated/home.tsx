import { Link, createFileRoute } from "@tanstack/react-router";
import { GitFork } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { RelationshipTreeHome } from "@/components/relationship-tree-home";
import { Button } from "@/components/ui/button";
import { useFamily } from "@/lib/family-store";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Your Relationship Tree — FamilyLink" },
      { name: "description", content: "See your accepted family and trusted connections growing around you in one living relationship tree." },
      { property: "og:title", content: "Your Relationship Tree — FamilyLink" },
      { property: "og:description", content: "A private, consent-led overview of the people connected to your family." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { persons, relationships } = useFamily();
  return (
    <AppShell
      title="Welcome back, Marcus"
      subtitle="Your accepted connections, gathered around the family line. Hover over a fruit to reveal the person, then select it to open the complete lineage."
      action={<Button asChild variant="outline"><Link to="/tree"><GitFork className="size-4" /> Open full family tree</Link></Button>}
    >
      <RelationshipTreeHome persons={persons} relationships={relationships} />
    </AppShell>
  );
}
