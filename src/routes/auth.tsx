import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, GitFork } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setDemoAuthenticated } from "@/lib/demo-auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: "login" | "signup"; redirect?: string } => ({
    mode: search.mode === "signup" ? "signup" : "login",
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create an account — FamilyLink" },
      { name: "description", content: "Log in to FamilyLink or create an account to start building your family tree." },
      { property: "og:title", content: "Sign in — FamilyLink" },
      { property: "og:description", content: "Log in or sign up to FamilyLink, the consent-driven family discovery platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleButton({ label }: { label: string }) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={() => toast.info("Google sign-in will connect once real accounts are enabled.")}>
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.4-5.35 4.4-3.2 0-5.8-2.65-5.8-5.9s2.6-5.9 5.8-5.9c1.8 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4.1 14.55 3.1 12 3.1 6.95 3.1 2.9 7.15 2.9 12.2S6.95 21.3 12 21.3c5.25 0 8.7-3.7 8.7-8.9 0-.6-.05-1.05-.15-1.3z" />
      </svg>
      {label}
    </Button>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState(search.mode);
  const [photo, setPhoto] = useState<string | null>(null);

  const done = (msg: string) => (e: FormEvent) => {
    e.preventDefault();
    setDemoAuthenticated(true);
    toast.success(msg);
    navigate({ to: search.redirect ?? "/home" });
  };

  return (
    <div className="min-h-screen bg-relationship-canvas px-4 py-6 text-relationship-ink">
      <div className="mx-auto max-w-md">
        <Button asChild variant="ghost" className="mb-6 text-relationship-ink hover:bg-family/10"><Link to="/"><ArrowLeft className="size-4" /> Back to FamilyLink</Link></Button>
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-family/30 bg-family/10"><GitFork className="size-6 text-family" /></span>
          <h1 className="mt-3 font-display text-4xl">Welcome to FamilyLink</h1>
          <p className="mt-2 text-sm text-relationship-ink/60">Find your family, with consent at every step.</p>
        </div>
        <div className="rounded-xl border border-relationship-line bg-relationship-label p-6 shadow-lift">
          <Tabs value={tab} onValueChange={(value) => setTab(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={done("Welcome back, Marcus")} className="mt-4 space-y-4">
                <div className="space-y-1.5"><Label htmlFor="l-email">Email</Label><Input id="l-email" type="email" required defaultValue="marcus.johnson@example.com" /></div>
                <div className="space-y-1.5"><Label htmlFor="l-pass">Password</Label><Input id="l-pass" type="password" required minLength={6} /></div>
                <Button type="submit" className="w-full bg-family text-relationship-label hover:bg-family/90">Log in and open my tree</Button>
                <GoogleButton label="Continue with Google" />
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={done("Account created — welcome to FamilyLink")} className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="size-16 overflow-hidden rounded-full border border-border-strong bg-muted">{photo && <img src={photo} alt="" className="size-full object-cover" />}</div>
                  <div className="space-y-1.5"><Label htmlFor="s-photo">Profile photo</Label><Input id="s-photo" type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPhoto(URL.createObjectURL(file)); }} /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="s-name">Full name</Label><Input id="s-name" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label htmlFor="s-year">Birth year</Label><Input id="s-year" type="number" min={1900} max={2026} required /></div>
                  <div className="space-y-1.5"><Label htmlFor="s-place">Birth place</Label><Input id="s-place" placeholder="City, Country" required /></div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="s-email">Email</Label><Input id="s-email" type="email" required /></div>
                <div className="space-y-1.5"><Label htmlFor="s-pass">Password</Label><Input id="s-pass" type="password" required minLength={6} /></div>
                <Button type="submit" className="w-full bg-family text-relationship-label hover:bg-family/90">Create account and open my tree</Button>
                <GoogleButton label="Sign up with Google" />
              </form>
            </TabsContent>
          </Tabs>
          <p className="mt-5 text-center text-xs text-muted-foreground">Demo access: any valid-looking email and a 6-character password will work. No account is created yet.</p>
        </div>
      </div>
    </div>
  );
}
