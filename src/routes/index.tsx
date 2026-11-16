import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CalendarHeart, Check, GitFork, Images, LockKeyhole, ShieldCheck, Sparkles, UserPlus } from "lucide-react";

import portraitDavid from "@/assets/portrait-david.jpg";
import portraitMarcus from "@/assets/portrait-marcus.jpg";
import portraitRobert from "@/assets/portrait-robert.jpg";
import { FruitPortrait } from "@/components/fruit-portrait";
import { Button } from "@/components/ui/button";
import type { FamilyPerson } from "@/lib/family-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FamilyLink — Your family, connected with consent" },
      { name: "description", content: "Build a living family tree, preserve every life story, plan gatherings, and discover possible relatives with consent at every step." },
      { property: "og:title", content: "FamilyLink — Your family, connected with consent" },
      { property: "og:description", content: "A living family tree for lineages, life stories, private discovery, events, and family memories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const previewPeople: FamilyPerson[] = [
  { id: "landing-robert", created_by_user_id: "demo", linked_user_id: null, first_name: "Robert", last_name: "Johnson", maiden_name: null, birth_year: 1928, birth_place: "Kingston, Jamaica", is_living: false, avatar_url: portraitRobert, is_minor: false },
  { id: "landing-david", created_by_user_id: "demo", linked_user_id: null, first_name: "David", last_name: "Johnson", maiden_name: null, birth_year: 1956, birth_place: "Kingston, Jamaica", is_living: true, avatar_url: portraitDavid, is_minor: false },
  { id: "landing-marcus", created_by_user_id: "demo", linked_user_id: null, first_name: "Marcus", last_name: "Johnson", maiden_name: null, birth_year: 1985, birth_place: "London, United Kingdom", is_living: true, avatar_url: portraitMarcus, is_minor: false },
];

const features = [
  { icon: GitFork, title: "A tree that grows with you", text: "Add parents, partners, children, siblings, and grandparents. Branches and fruit expand automatically without losing each person’s place." },
  { icon: Sparkles, title: "Consent-led discovery", text: "Review possible family links, understand why they were suggested, and connect only when both sides choose to accept." },
  { icon: CalendarHeart, title: "Life stories and gatherings", text: "Turn births, marriages, migrations, and milestones into rich stories, then organize reunions with clear RSVP tracking." },
  { icon: Images, title: "One family memory vault", text: "Keep portraits and archival clips beside the moments they belong to, instead of losing them across chats and devices." },
];

function Brand() {
  return (
    <span className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-full border border-family/30 bg-family/10">
        <GitFork className="size-5 text-family" />
      </span>
      <span className="font-display text-3xl text-relationship-ink">FamilyLink</span>
    </span>
  );
}

function TreePreview() {
  return (
    <div className="relative min-h-[470px] overflow-hidden rounded-[2rem] border border-relationship-line bg-relationship-label shadow-lift" aria-label="Example family tree with fruit-shaped relatives">
      <svg viewBox="0 0 620 500" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <linearGradient id="landing-bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" className="text-tree-bark-deep" stopColor="currentColor" /><stop offset=".5" className="text-tree-bark" stopColor="currentColor" /><stop offset="1" className="text-tree-bark-deep" stopColor="currentColor" /></linearGradient>
        </defs>
        <g className="fill-tree-leaf/15">
          <ellipse cx="160" cy="135" rx="140" ry="110" /><ellipse cx="310" cy="90" rx="170" ry="115" /><ellipse cx="470" cy="145" rx="135" ry="110" />
        </g>
        <path d="M285 495 C300 390 275 330 315 245 C340 190 325 145 310 105 M300 340 C240 280 185 250 130 195 M320 285 C390 240 440 220 500 170" fill="none" stroke="url(#landing-bark)" strokeWidth="28" strokeLinecap="round" />
        <path d="M315 250 C260 205 220 180 165 155 M320 215 C385 170 420 155 465 140" fill="none" className="stroke-tree-line" strokeWidth="4" strokeLinecap="round" />
        <path d="M280 470 C230 480 205 490 155 495 M330 470 C385 480 430 490 475 495" fill="none" className="stroke-tree-ground/50" strokeWidth="8" strokeLinecap="round" />
      </svg>
      <div className="group absolute left-[12%] top-[12%] w-28 text-center"><FruitPortrait person={previewPeople[0]} className="size-28" /><p className="rounded-full border border-relationship-line bg-relationship-label px-2 py-1 font-display text-sm text-relationship-ink shadow-paper">Robert</p></div>
      <div className="group absolute right-[8%] top-[14%] w-28 text-center"><FruitPortrait person={previewPeople[1]} className="size-28" /><p className="rounded-full border border-relationship-line bg-relationship-label px-2 py-1 font-display text-sm text-relationship-ink shadow-paper">David</p></div>
      <div className="group absolute bottom-[9%] left-1/2 w-32 -translate-x-1/2 text-center"><FruitPortrait person={previewPeople[2]} className="size-32" /><p className="rounded-full border border-family bg-relationship-label px-3 py-1 font-display text-base text-relationship-ink shadow-paper">You</p></div>
      <p className="absolute bottom-4 left-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-community">Hover a fruit to reveal the person</p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-relationship-canvas text-relationship-ink">
      <header className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link to="/" aria-label="FamilyLink home"><Brand /></Link>
        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Landing page sections">
          <a href="#how-it-works" className="hover:text-family">How it works</a>
          <a href="#features" className="hover:text-family">Features</a>
          <a href="#privacy" className="hover:text-family">Privacy</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="text-relationship-ink hover:bg-family/10"><Link to="/auth" search={{ mode: "login" }}>Log in</Link></Button>
          <Button asChild className="bg-family text-relationship-label hover:bg-family/90"><Link to="/auth" search={{ mode: "signup" }}>Sign up <ArrowRight className="size-4" /></Link></Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-family"><ShieldCheck className="size-4" /> Family history, shared on your terms</p>
            <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[0.98] sm:text-7xl">Every branch has a story. Keep yours growing.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-relationship-ink/70">FamilyLink brings your lineage, life events, photographs, videos, gatherings, and possible relatives into one consent-driven family tree.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-family text-relationship-label hover:bg-family/90"><Link to="/auth" search={{ mode: "signup" }}>Start your family tree <ArrowRight className="size-4" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="border-relationship-line bg-relationship-label text-relationship-ink hover:bg-family/10"><a href="#how-it-works">See how it works</a></Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-relationship-ink/65">
              {['Private by choice', 'Protected minor records', 'Rich life-event stories'].map((item) => <li key={item} className="flex items-center gap-1.5"><Check className="size-4 text-family" />{item}</li>)}
            </ul>
          </div>
          <TreePreview />
        </section>

        <section id="how-it-works" className="border-y border-relationship-line bg-relationship-label px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-family">From roots to living connections</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">Your family journey, in four simple steps</h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                ["01", "Create your tree", "Begin with yourself, then add relatives and the relationships that connect you."],
                ["02", "Grow through acceptance", "Invite relatives and show accepted connections in your personal relationship tree."],
                ["03", "Tell every life story", "Select a fruit to explore a person’s lineage and chronological life-event tree."],
                ["04", "Discover with consent", "Review possible matches and their reasoning without exposing private contact details."],
              ].map(([number, title, text]) => <li key={number} className="border-t border-relationship-line pt-5"><span className="font-display text-3xl text-family">{number}</span><h3 className="mt-4 font-display text-2xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-relationship-ink/65">{text}</p></li>)}
            </ol>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-family">Everything belongs together</p><h2 className="mt-3 font-display text-4xl sm:text-5xl">More than names on a diagram</h2></div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-relationship-line bg-relationship-label p-6 shadow-paper"><Icon className="size-6 text-family" /><h3 className="mt-5 font-display text-2xl">{title}</h3><p className="mt-2 leading-relaxed text-relationship-ink/65">{text}</p></article>)}
          </div>
        </section>

        <section id="privacy" className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <div className="grid items-center gap-8 rounded-[2rem] bg-relationship-ink p-8 text-relationship-canvas sm:p-12 lg:grid-cols-[1fr_auto]">
            <div><LockKeyhole className="size-8 text-primary" /><h2 className="mt-5 font-display text-4xl">Your family is not a public database.</h2><p className="mt-4 max-w-2xl leading-relaxed text-relationship-canvas/70">Discovery starts only with your consent. Living-record visibility and location precision stay under your control, while under-13 records remain non-discoverable and cannot receive invite links.</p></div>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary-deep"><Link to="/auth" search={{ mode: "signup" }}><UserPlus className="size-4" /> Create your private tree</Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-relationship-line px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><Brand /><p className="text-sm text-relationship-ink/55">Rooted in history. Growing through consent.</p></div></footer>
    </div>
  );
}
