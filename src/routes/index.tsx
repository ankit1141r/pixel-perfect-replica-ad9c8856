import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, CalendarDays, ClipboardCheck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/sporty/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPORTY — Multi-sport club management" },
      { name: "description", content: "Run cricket, football, basketball and more: teams, fixtures, scores and registrations in one place." },
      { property: "og:title", content: "SPORTY — Multi-sport club management" },
      { property: "og:description", content: "Teams, fixtures, scores and registrations for every sport." },
    ],
  }),
  component: Landing,
});

const sports = ["Cricket", "Football", "Basketball", "Badminton", "Volleyball"];
const features = [
  { icon: Trophy, title: "Every sport", text: "Run any number of sports side by side." },
  { icon: Shield, title: "Teams & squads", text: "Build teams and assign players." },
  { icon: CalendarDays, title: "Fixtures & scores", text: "Schedule matches and record results." },
  { icon: ClipboardCheck, title: "Registrations", text: "Review and approve player sign-ups." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <div className="flex gap-2">
          <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Join</Link></Button>
        </div>
      </header>

      <section className="grid-lines border-y">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Multi-sport management</p>
          <h1 className="mt-4 max-w-3xl text-6xl font-bold uppercase leading-[0.9] sm:text-8xl">
            One club.<br /><span className="text-primary">Every game.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Teams, fixtures, live scores and player registrations — managed in one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button size="lg" asChild className="shadow-glow"><Link to="/signup">Register as a player</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/app">Open dashboard</Link></Button>
          </div>
          <div className="mt-14 flex flex-wrap gap-2">
            {sports.map((s) => (
              <span key={s} className="rounded-full border px-4 py-1.5 text-sm text-muted-foreground">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-6">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl font-bold uppercase">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} SPORTY</footer>
    </div>
  );
}
