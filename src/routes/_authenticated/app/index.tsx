import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, Shield, CalendarDays, Activity } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/sporty/PageShell";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SPORTY" },
      { name: "description", content: "Club overview: players, sports, teams and fixtures." },
      { property: "og:title", content: "Dashboard — SPORTY" },
      { property: "og:description", content: "Club overview: players, sports, teams and fixtures." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your club at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Players" value="—" icon={Users} />
        <StatCard label="Sports" value="—" icon={Trophy} />
        <StatCard label="Teams" value="—" icon={Shield} />
        <StatCard label="Matches" value="—" icon={CalendarDays} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <EmptyState icon={CalendarDays} title="Upcoming fixtures" text="Fixtures appear once matches are scheduled." />
        <EmptyState icon={Activity} title="Recent activity" text="Approvals, results and changes will be logged here." />
      </div>
    </>
  );
}
