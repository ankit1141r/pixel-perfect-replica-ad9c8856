import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Trophy, Shield, CalendarDays, Activity, ClipboardCheck } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/sporty/PageShell";
import { Card, ErrorBox, Loading, RegBadge } from "@/components/sporty/bits";
import { MatchList } from "@/components/sporty/MatchList";
import { Button } from "@/components/ui/button";
import { useMe, type Me } from "@/lib/auth";
import { activityQuery, countsQuery, matchesQuery, myTeamsQuery, registrationsQuery, type MatchRow } from "@/lib/data";

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
  const { data: me, isLoading, error } = useMe();
  if (isLoading) return <Loading />;
  if (error || !me) return <ErrorBox error={error} />;
  return me.isAdmin ? <AdminDashboard /> : <PlayerDashboard me={me} />;
}

const upcoming = (ms: MatchRow[]) => ms.filter((m) => m.status === "scheduled" || m.status === "live").slice(0, 5);
const recent = (ms: MatchRow[]) => ms.filter((m) => m.status === "completed").reverse().slice(0, 5);

function AdminDashboard() {
  const counts = useQuery(countsQuery);
  const matches = useQuery(matchesQuery);
  const regs = useQuery(registrationsQuery);
  const activity = useQuery(activityQuery);
  const pending = (regs.data ?? []).filter((r) => r.status === "pending");
  const v = (n?: number) => (n == null ? "—" : String(n));
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your club at a glance." />
      {counts.error && <ErrorBox error={counts.error} retry={() => counts.refetch()} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Players" value={v(counts.data?.players)} icon={Users} />
        <StatCard label="Sports" value={v(counts.data?.sports)} icon={Trophy} />
        <StatCard label="Teams" value={v(counts.data?.teams)} icon={Shield} />
        <StatCard label="Matches" value={v(counts.data?.matches)} icon={CalendarDays} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming fixtures" action={<Button asChild variant="link" size="sm"><Link to="/app/matches">All fixtures</Link></Button>}>
          {matches.isLoading ? <Loading rows={3} /> : matches.error ? <ErrorBox error={matches.error} /> : <MatchList matches={upcoming(matches.data ?? [])} empty="No upcoming fixtures." />}
        </Card>
        <Card title="Completed matches" action={<Button asChild variant="link" size="sm"><Link to="/app/scoreboard">Scoreboard</Link></Button>}>
          {matches.isLoading ? <Loading rows={3} /> : <MatchList matches={recent(matches.data ?? [])} empty="No results yet." />}
        </Card>
        <Card title={`Pending registrations (${pending.length})`} action={<Button asChild variant="link" size="sm"><Link to="/app/registrations">Review</Link></Button>}>
          {regs.isLoading ? <Loading rows={3} /> : pending.length ? (
            <ul className="divide-y">
              {pending.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <span>{r.player?.full_name} <span className="text-muted-foreground">· {r.sport?.name}</span></span>
                  <RegBadge s={r.status} />
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>}
        </Card>
        <Card title="Recent activity">
          {activity.isLoading ? <Loading rows={3} /> : activity.data?.length ? (
            <ul className="space-y-3 text-sm">
              {activity.data.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div>{a.action}</div>
                    <div className="text-xs text-muted-foreground">{a.actor?.full_name ?? "System"} · {fmtDate(a.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>}
        </Card>
      </div>
    </>
  );
}

function PlayerDashboard({ me }: { me: Me }) {
  const teams = useQuery(myTeamsQuery(me.id));
  const matches = useQuery(matchesQuery);
  const regs = useQuery(registrationsQuery);
  const myTeamIds = new Set((teams.data ?? []).map((t) => t.team?.id));
  const mine = (matches.data ?? []).filter((m) => myTeamIds.has(m.home_team_id) || myTeamIds.has(m.away_team_id));
  return (
    <>
      <PageHeader title={`Welcome, ${me.fullName.split(" ")[0] || "player"}`} subtitle="Your teams, fixtures and registrations." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="My teams" value={teams.data ? String(teams.data.length) : "—"} icon={Shield} />
        <StatCard label="Upcoming matches" value={matches.data ? String(upcoming(mine).length) : "—"} icon={CalendarDays} />
        <StatCard label="Registrations" value={regs.data ? String(regs.data.length) : "—"} icon={ClipboardCheck} />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Name</dt><dd>{me.fullName}</dd>
            <dt className="text-muted-foreground">Email</dt><dd className="truncate">{me.email}</dd>
            <dt className="text-muted-foreground">Member since</dt><dd>{new Date(me.createdAt).toLocaleDateString()}</dd>
          </dl>
          <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/app/profile">Edit profile</Link></Button>
        </Card>
        <Card title="My teams">
          {teams.isLoading ? <Loading rows={2} /> : teams.data?.length ? (
            <ul className="divide-y">
              {teams.data.map((t) => t.team && (
                <li key={t.team.id} className="py-3">
                  <Link to="/app/teams/$teamId" params={{ teamId: t.team.id }} className="font-medium hover:text-primary">{t.team.name}</Link>
                  <div className="text-xs text-muted-foreground">{t.team.sport?.name}</div>
                </li>
              ))}
            </ul>
          ) : <EmptyState icon={Shield} title="No team yet" text="Register for a sport and an admin will place you in a team." />}
        </Card>
        <Card title="Upcoming matches">
          {matches.isLoading ? <Loading rows={3} /> : <MatchList matches={upcoming(mine)} empty="No upcoming matches for your teams." />}
        </Card>
        <Card title="Recent results">
          {matches.isLoading ? <Loading rows={3} /> : <MatchList matches={recent(mine)} empty="No results yet." />}
        </Card>
        <Card title="Registration status" action={<Button asChild variant="link" size="sm"><Link to="/app/sports">Register for a sport</Link></Button>}>
          {regs.isLoading ? <Loading rows={2} /> : regs.data?.length ? (
            <ul className="divide-y">
              {regs.data.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  {r.sport?.name}<RegBadge s={r.status} />
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">You haven't registered for any sport yet.</p>}
        </Card>
      </div>
    </>
  );
}
