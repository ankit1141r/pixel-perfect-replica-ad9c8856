import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Confirm, ErrorBox, Loading, MatchBadge, Pager, paginate } from "@/components/sporty/bits";
import { MatchDialog } from "@/components/sporty/MatchDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { fmtDate, matchesQuery, sportsQuery, type MatchRow } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/matches")({
  head: () => ({ meta: [{ title: "Fixtures — SPORTY" }, { name: "description", content: "Scheduled, live and completed matches." }, { property: "og:title", content: "Fixtures — SPORTY" }, { property: "og:description", content: "Scheduled, live and completed matches." }] }),
  component: Matches,
});

function Matches() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const matches = useQuery(matchesQuery);
  const sports = useQuery(sportsQuery);
  const [sport, setSport] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MatchRow | "new" | null>(null);

  const list = (matches.data ?? []).filter((m) => (sport === "all" || m.sport_id === sport) && (status === "all" || m.status === status));
  const pg = paginate(list, page);

  async function remove(id: string) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Match deleted");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Fixtures" subtitle="Scheduled, live and completed matches."
        action={me?.isAdmin && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Schedule match</Button>} />
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={sport} onValueChange={(v) => { setSport(v); setPage(1); }}>
          <SelectTrigger className="w-44" aria-label="Filter by sport"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {sports.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any status</SelectItem>
            {["scheduled", "live", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {matches.isLoading ? <Loading /> : matches.error ? <ErrorBox error={matches.error} retry={() => matches.refetch()} /> : !list.length ? (
        <EmptyState icon={CalendarDays} title="No matches" text={me?.isAdmin ? "Schedule a match between two teams of the same sport." : "Fixtures appear once matches are scheduled."} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Match</th><th className="p-3 font-medium">Sport</th><th className="p-3 font-medium">Score</th><th className="p-3 font-medium">Status</th><th className="p-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {pg.items.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap p-3 text-muted-foreground">{fmtDate(m.scheduled_at)}{m.venue && <div className="text-xs">{m.venue}</div>}</td>
                    <td className="p-3 font-medium">{m.home?.name} <span className="text-muted-foreground">vs</span> {m.away?.name}</td>
                    <td className="p-3 text-muted-foreground">{m.sport?.name}</td>
                    <td className="p-3 font-display text-lg font-bold tabular-nums">{m.home_score != null && m.away_score != null ? `${m.home_score}–${m.away_score}` : "—"}</td>
                    <td className="p-3"><MatchBadge s={m.status} /></td>
                    <td className="whitespace-nowrap p-3 text-right">
                      {me?.isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" aria-label="Edit match or record score" onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></Button>
                          <Confirm title="Delete this match?" text="This can't be undone." onConfirm={() => remove(m.id)}
                            trigger={<Button variant="ghost" size="icon" aria-label="Delete match"><Trash2 className="h-4 w-4" /></Button>} />
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={pg.page} pages={pg.pages} setPage={setPage} />
        </>
      )}
      {editing && <MatchDialog match={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
