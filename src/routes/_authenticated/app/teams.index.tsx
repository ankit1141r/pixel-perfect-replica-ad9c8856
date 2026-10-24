import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Plus, Search, Shield, Trash2 } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Confirm, ErrorBox, Loading, Pager, paginate } from "@/components/sporty/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { sportsQuery, teamsQuery } from "@/lib/data";
import { fieldErrors, teamSchema } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/app/teams/")({
  validateSearch: z.object({ sport: z.string().optional() }),
  head: () => ({ meta: [{ title: "Teams — SPORTY" }, { name: "description", content: "Squads across every sport." }, { property: "og:title", content: "Teams — SPORTY" }, { property: "og:description", content: "Squads across every sport." }] }),
  component: Teams,
});

export type TeamEdit = { id: string; name: string; sport_id: string; description: string | null };

function Teams() {
  const { data: me } = useMe();
  const { sport = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const teams = useQuery(teamsQuery);
  const sports = useQuery(sportsQuery);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<TeamEdit | "new" | null>(null);

  const filtered = (teams.data ?? []).filter(
    (t) => (sport === "all" || t.sport_id === sport) && t.name.toLowerCase().includes(q.toLowerCase()),
  );
  const pg = paginate(filtered, page);

  async function remove(id: string) {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Team deleted");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        title="Teams"
        subtitle="Squads across every sport."
        action={me?.isAdmin && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New team</Button>}
      />
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search teams" placeholder="Search teams" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={sport} onValueChange={(v) => { setPage(1); navigate({ search: v === "all" ? {} : { sport: v } }); }}>
          <SelectTrigger className="w-48" aria-label="Filter by sport"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {sports.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {teams.isLoading ? <Loading /> : teams.error ? <ErrorBox error={teams.error} retry={() => teams.refetch()} /> : !filtered.length ? (
        <EmptyState icon={Shield} title="No teams found" text={me?.isAdmin ? "Create a team for one of your sports." : "No teams match yet."} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="p-3 font-medium">Team</th><th className="p-3 font-medium">Sport</th><th className="p-3 font-medium">Players</th><th className="p-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {pg.items.map((t) => (
                  <tr key={t.id}>
                    <td className="p-3"><Link to="/app/teams/$teamId" params={{ teamId: t.id }} className="font-medium hover:text-primary">{t.name}</Link></td>
                    <td className="p-3 text-muted-foreground">{t.sport?.name}</td>
                    <td className="p-3 tabular-nums">{t.team_members[0]?.count ?? 0}</td>
                    <td className="p-3 text-right">
                      {me?.isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" aria-label={`Edit ${t.name}`} onClick={() => setEditing(t)}><Pencil className="h-4 w-4" /></Button>
                          <Confirm title={`Delete ${t.name}?`} text="Its members and matches are removed too." onConfirm={() => remove(t.id)}
                            trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${t.name}`}><Trash2 className="h-4 w-4" /></Button>} />
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
      {editing && <TeamDialog team={editing === "new" ? null : editing} defaultSport={sport === "all" ? undefined : sport} onClose={() => setEditing(null)} />}
    </>
  );
}

export function TeamDialog({ team, defaultSport, onClose }: { team: TeamEdit | null; defaultSport?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const sports = useQuery(sportsQuery);
  const [sportId, setSportId] = useState(team?.sport_id ?? defaultSport ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = teamSchema.safeParse({ name: fd.get("name"), sport_id: sportId, description: fd.get("description") ?? "" });
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setBusy(true);
    const { error } = team
      ? await supabase.from("teams").update(parsed.data).eq("id", team.id)
      : await supabase.from("teams").insert(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "That sport already has a team with this name" : error.message); return; }
    toast.success(team ? "Team updated" : "Team created");
    qc.invalidateQueries();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{team ? "Edit team" : "New team"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={team?.name} aria-invalid={!!errors["name"]} />
            {errors["name"] && <p className="text-sm text-destructive">{errors["name"]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sport">Sport</Label>
            <Select value={sportId} onValueChange={setSportId}>
              <SelectTrigger id="sport"><SelectValue placeholder="Pick a sport" /></SelectTrigger>
              <SelectContent>{sports.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            {errors["sport_id"] && <p className="text-sm text-destructive">{errors["sport_id"]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={team?.description ?? ""} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
