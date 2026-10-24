import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sportsQuery, teamsQuery, toLocalInput, type MatchRow, type MatchStatus } from "@/lib/data";
import { fieldErrors, matchSchema } from "@/lib/validation";

const STATUSES: MatchStatus[] = ["scheduled", "live", "completed", "cancelled"];

function Err({ m }: { m?: string }) {
  return m ? <p className="text-sm text-destructive">{m}</p> : null;
}

export function MatchDialog({ match, onClose }: { match: MatchRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const sports = useQuery(sportsQuery);
  const teams = useQuery(teamsQuery);
  const [f, setF] = useState({
    sport_id: match?.sport_id ?? "",
    home_team_id: match?.home_team_id ?? "",
    away_team_id: match?.away_team_id ?? "",
    scheduled_at: match ? toLocalInput(match.scheduled_at) : "",
    venue: match?.venue ?? "",
    status: (match?.status ?? "scheduled") as MatchStatus,
    home_score: match?.home_score?.toString() ?? "",
    away_score: match?.away_score?.toString() ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const sportTeams = (teams.data ?? []).filter((t) => t.sport_id === f.sport_id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = matchSchema.safeParse(f);
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setErrors({});
    const row = { ...parsed.data, scheduled_at: new Date(parsed.data.scheduled_at).toISOString() };
    setBusy(true);
    const { error } = match
      ? await supabase.from("matches").update(row).eq("id", match.id)
      : await supabase.from("matches").insert(row);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(match ? "Match updated" : "Match scheduled");
    qc.invalidateQueries();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{match ? "Edit match" : "Schedule a match"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="m-sport">Sport</Label>
            <Select value={f.sport_id} onValueChange={(v) => setF((p) => ({ ...p, sport_id: v, home_team_id: "", away_team_id: "" }))}>
              <SelectTrigger id="m-sport"><SelectValue placeholder="Pick a sport" /></SelectTrigger>
              <SelectContent>{sports.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
            <Err m={errors["sport_id"]} />
          </div>
          {(["home_team_id", "away_team_id"] as const).map((k) => (
            <div key={k} className="space-y-2">
              <Label htmlFor={k}>{k === "home_team_id" ? "Home team" : "Away team"}</Label>
              <Select value={f[k]} onValueChange={set(k)} disabled={!f.sport_id}>
                <SelectTrigger id={k}><SelectValue placeholder={sportTeams.length || !f.sport_id ? "Pick a team" : "No teams in this sport"} /></SelectTrigger>
                <SelectContent>{sportTeams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
              <Err m={errors[k]} />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="when">Date & time</Label>
            <Input id="when" type="datetime-local" value={f.scheduled_at} onChange={(e) => set("scheduled_at")(e.target.value)} />
            <Err m={errors["scheduled_at"]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" value={f.venue} onChange={(e) => set("venue")(e.target.value)} />
            <Err m={errors["venue"]} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="status">Status</Label>
            <Select value={f.status} onValueChange={set("status")}>
              <SelectTrigger id="status"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hs">Home score</Label>
            <Input id="hs" inputMode="numeric" value={f.home_score} onChange={(e) => set("home_score")(e.target.value)} />
            <Err m={errors["home_score"]} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="as">Away score</Label>
            <Input id="as" inputMode="numeric" value={f.away_score} onChange={(e) => set("away_score")(e.target.value)} />
            <Err m={errors["away_score"]} />
          </div>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
