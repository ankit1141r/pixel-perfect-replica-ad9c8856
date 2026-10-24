import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/sporty/PageShell";
import { Card, ErrorBox, Loading } from "@/components/sporty/bits";
import { requireAdmin } from "@/lib/guards";
import { activityQuery, fmtDate, matchesQuery, registrationsQuery, sportsQuery, teamsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/reports")({
  beforeLoad: requireAdmin,
  head: () => ({ meta: [{ title: "Reports — SPORTY" }, { name: "description", content: "Registration trends and club activity." }, { property: "og:title", content: "Reports — SPORTY" }, { property: "og:description", content: "Registration trends and club activity." }] }),
  component: Reports,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false } as const;
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }, cursor: { fill: "var(--muted)" } };

function Reports() {
  const regs = useQuery(registrationsQuery);
  const matches = useQuery(matchesQuery);
  const sports = useQuery(sportsQuery);
  const teams = useQuery(teamsQuery);
  const activity = useQuery(activityQuery);

  if (regs.isLoading || matches.isLoading || sports.isLoading) return <Loading />;
  if (regs.error) return <ErrorBox error={regs.error} />;

  // Registrations per week, last 8 weeks
  const now = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - 7 * (7 - i) - 6);
    const end = new Date(start); end.setDate(end.getDate() + 7);
    const count = (regs.data ?? []).filter((r) => { const d = new Date(r.created_at); return d >= start && d < end; }).length;
    return { week: start.toLocaleDateString(undefined, { day: "numeric", month: "short" }), count };
  });
  const bySport = (sports.data ?? []).map((s) => ({
    sport: s.name,
    teams: (teams.data ?? []).filter((t) => t.sport_id === s.id).length,
    matches: (matches.data ?? []).filter((m) => m.sport_id === s.id).length,
    registrations: (regs.data ?? []).filter((r) => r.sport_id === s.id).length,
  }));
  const regTotals = { pending: 0, approved: 0, rejected: 0 };
  for (const r of regs.data ?? []) regTotals[r.status]++;

  return (
    <>
      <PageHeader title="Reports" subtitle="Registration trends and club activity." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {(Object.entries(regTotals) as [keyof typeof regTotals, number][]).map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-card p-5">
            <div className="text-sm capitalize text-muted-foreground">{k} registrations</div>
            <div className="mt-2 font-display text-4xl font-bold">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Registrations per week">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={weeks}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" {...axis} /><YAxis allowDecimals={false} {...axis} width={28} />
                <Tooltip {...tip} />
                <Bar dataKey="count" name="Registrations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="By sport">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground"><tr><th className="pb-2 font-medium">Sport</th><th className="pb-2 text-right font-medium">Teams</th><th className="pb-2 text-right font-medium">Matches</th><th className="pb-2 text-right font-medium">Registrations</th></tr></thead>
            <tbody className="divide-y tabular-nums">
              {bySport.map((r) => (
                <tr key={r.sport}><td className="py-2 font-medium">{r.sport}</td><td className="py-2 text-right">{r.teams}</td><td className="py-2 text-right">{r.matches}</td><td className="py-2 text-right">{r.registrations}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="lg:col-span-2">
          <Card title="Recent activity">
            {activity.isLoading ? <Loading rows={3} /> : activity.data?.length ? (
              <ul className="divide-y text-sm">
                {activity.data.map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-2.5">
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex-1">{a.action}</div>
                    <div className="whitespace-nowrap text-xs text-muted-foreground">{a.actor?.full_name ?? "System"} · {fmtDate(a.created_at)}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
