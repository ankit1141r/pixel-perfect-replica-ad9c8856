import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sportsQuery } from "@/lib/data";
import { fieldErrors, teamSchema } from "@/lib/validation";

export type TeamEdit = { id: string; name: string; sport_id: string; description: string | null };

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
