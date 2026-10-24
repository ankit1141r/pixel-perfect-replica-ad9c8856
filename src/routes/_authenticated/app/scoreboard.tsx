import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Gauge } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Card, ErrorBox, Loading } from "@/components/sporty/bits";
import { MatchList } from "@/components/sporty/MatchList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { matchesQuery, sportsQuery, standings, teamsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/scoreboard")({
  head: () => ({ meta: [{ title: "Scoreboard — SPORTY" }, { name: "description", content: "Live scores, results and standings." }, { property: "og:title", content: "Scoreboard — SPORTY" }, { property: "og:description", content: "Live scores, results and standings." }] }),
  component: Scoreboard,
});

function Scoreboard() {
  const matches = useQuery(matchesQuery);
  const sports = useQuery(sportsQuery);
  const teams = useQuery(teamsQuery);
  const [sport, setSport] = useState<string>("");
  const sportId = sport || sports.data?.[0]?.id || "";

  if (matches.isLoading || sports.isLoading) return <Loading />;
  if (matches.error) return <ErrorBox error={matches.error} />;

  const ms = (matches.data ?? []).filter((m) => m.sport_id === sportId);
  const names = Object.fromEntries((teams.data ?? []).map((t) => [t.id, t.name]));
  const table = standings(ms, names);
  const live = ms.filter((m) => m.status === "live");
  const results = ms.filter((m) => m.status === "completed").reverse();

  return (
    <>
      <PageHeader title="Scoreboard" subtitle="Live scores, results and standings."
        action={
          <Select value={sportId} onValueChange={setSport}>
            <SelectTrigger className="w-44" aria-label="Choose sport"><SelectValue placeholder="Sport" /></SelectTrigger>
            <SelectContent>{sports.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        } />
      {!ms.length ? <EmptyState icon={Gauge} title="No matches yet" text="Scores show up here once matches are played." /> : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Standings">
            {table.length ? (
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="pb-2 font-medium">#</th><th className="pb-2 font-medium">Team</th>{["P", "W", "D", "L", "Pts"].map((h) => <th key={h} className="pb-2 text-right font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y tabular-nums">
                  {table.map((r, i) => (
                    <tr key={r.team}>
                      <td className="py-2 text-muted-foreground">{i + 1}</td><td className="py-2 font-medium">{r.team}</td>
                      <td className="py-2 text-right">{r.p}</td><td className="py-2 text-right">{r.w}</td><td className="py-2 text-right">{r.d}</td><td className="py-2 text-right">{r.l}</td>
                      <td className="py-2 text-right font-bold text-primary">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="py-6 text-center text-sm text-muted-foreground">No completed matches yet.</p>}
            <p className="mt-3 text-xs text-muted-foreground">Win 3 points, draw 1, loss 0.</p>
          </Card>
          <div className="space-y-6">
            {live.length > 0 && <Card title="Live now"><MatchList matches={live} empty="" /></Card>}
            <Card title="Results"><MatchList matches={results} empty="No results yet." /></Card>
          </div>
        </div>
      )}
    </>
  );
}
