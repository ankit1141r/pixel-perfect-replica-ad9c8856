import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, UserMinus, UserPlus, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Card, Confirm, ErrorBox, Loading } from "@/components/sporty/bits";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { matchesQuery, playersQuery, rosterQuery, teamQuery } from "@/lib/data";
import { MatchList } from "./index";
import { TeamDialog } from "./teams.index";

export const Route = createFileRoute("/_authenticated/app/teams/$teamId")({
  head: () => ({ meta: [{ title: "Team — SPORTY" }, { name: "description", content: "Team roster and fixtures." }, { property: "og:title", content: "Team — SPORTY" }, { property: "og:description", content: "Team roster and fixtures." }] }),
  component: TeamPage,
});

function TeamPage() {
  const { teamId } = Route.useParams();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const team = useQuery(teamQuery(teamId));
  const roster = useQuery(rosterQuery(teamId));
  const matches = useQuery(matchesQuery);
  const players = useQuery({ ...playersQuery, enabled: !!me?.isAdmin });
  const [pick, setPick] = useState("");
  const [editing, setEditing] = useState(false);

  if (team.isLoading) return <Loading />;
  if (team.error) return <ErrorBox error={team.error} />;
  if (!team.data) return <EmptyState icon={Users} title="Team not found" text="It may have been deleted." />;
  const t = team.data;

  const memberIds = new Set((roster.data ?? []).map((r) => r.player_id));
  const candidates = (players.data ?? []).filter((p) => !memberIds.has(p.id));
  const teamMatches = (matches.data ?? []).filter((m) => m.home_team_id === teamId || m.away_team_id === teamId);

  async function add() {
    if (!pick) return;
    const { error } = await supabase.from("team_members").insert({ team_id: teamId, player_id: pick });
    if (error) return void toast.error(error.message);
    toast.success("Player added");
    setPick("");
    qc.invalidateQueries();
  }
  async function removeMember(playerId: string) {
    const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("player_id", playerId);
    if (error) return void toast.error(error.message);
    toast.success("Player removed");
    qc.invalidateQueries();
  }

  return (
    <>
      <Button asChild variant="link" className="mb-2 h-auto p-0 text-muted-foreground"><Link to="/app/teams"><ArrowLeft className="h-4 w-4" /> All teams</Link></Button>
      <PageHeader
        title={t.name}
        subtitle={`${t.sport?.name ?? ""}${t.description ? ` · ${t.description}` : ""}`}
        action={me?.isAdmin && <Button variant="outline" onClick={() => setEditing(true)}><Pencil className="h-4 w-4" /> Edit team</Button>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={`Roster (${roster.data?.length ?? 0})`}>
          {me?.isAdmin && (
            <div className="mb-4 flex gap-2">
              <Select value={pick} onValueChange={setPick}>
                <SelectTrigger aria-label="Choose a player to add"><SelectValue placeholder={candidates.length ? "Choose a player" : "No more players to add"} /></SelectTrigger>
                <SelectContent>{candidates.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name} · {p.email}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={add} disabled={!pick}><UserPlus className="h-4 w-4" /> Add</Button>
            </div>
          )}
          {roster.isLoading ? <Loading rows={3} /> : roster.data?.length ? (
            <ul className="divide-y">
              {roster.data.map((r) => (
                <li key={r.player_id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground">Joined {new Date(r.joined_at).toLocaleDateString()}</div>
                  </div>
                  {me?.isAdmin && (
                    <Confirm title={`Remove ${r.full_name}?`} text="They'll no longer be part of this team." label="Remove" onConfirm={() => removeMember(r.player_id)}
                      trigger={<Button variant="ghost" size="icon" aria-label={`Remove ${r.full_name}`}><UserMinus className="h-4 w-4" /></Button>} />
                  )}
                </li>
              ))}
            </ul>
          ) : <p className="py-6 text-center text-sm text-muted-foreground">No players on this team yet.</p>}
        </Card>
        <Card title="Fixtures & results">
          {matches.isLoading ? <Loading rows={3} /> : <MatchList matches={teamMatches} empty="No matches for this team yet." />}
        </Card>
      </div>
      {editing && <TeamDialog team={t} onClose={() => setEditing(false)} />}
    </>
  );
}
