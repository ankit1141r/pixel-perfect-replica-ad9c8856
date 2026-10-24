import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2, Trophy } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Confirm, ErrorBox, Loading, RegBadge } from "@/components/sporty/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { registrationsQuery, sportsQuery, teamsQuery } from "@/lib/data";
import { fieldErrors, sportSchema } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/app/sports")({
  head: () => ({ meta: [{ title: "Sports — SPORTY" }, { name: "description", content: "Every sport the club runs." }, { property: "og:title", content: "Sports — SPORTY" }, { property: "og:description", content: "Every sport the club runs." }] }),
  component: Sports,
});

type Sport = { id: string; name: string; description: string | null };

function Sports() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const sports = useQuery(sportsQuery);
  const teams = useQuery(teamsQuery);
  const regs = useQuery(registrationsQuery);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Sport | "new" | null>(null);

  const register = useMutation({
    mutationFn: async (sportId: string) => {
      const { error } = await supabase.from("player_registrations").insert({ player_id: me!.id, sport_id: sportId });
      if (error) throw new Error(error.code === "23505" ? "You've already registered for this sport" : error.message);
    },
    onSuccess: () => { toast.success("Registration sent for review"); qc.invalidateQueries({ queryKey: ["registrations"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function remove(id: string) {
    const { error } = await supabase.from("sports").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success("Sport deleted");
    qc.invalidateQueries();
  }

  const list = (sports.data ?? []).filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  const myReg = (sportId: string) => (me?.isAdmin ? undefined : regs.data?.find((r) => r.sport_id === sportId && r.player_id === me?.id));

  return (
    <>
      <PageHeader
        title="Sports"
        subtitle={me?.isAdmin ? "Create and manage the sports your club runs." : "Browse sports and register to play."}
        action={me?.isAdmin && <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> New sport</Button>}
      />
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search sports" placeholder="Search sports" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
      </div>
      {sports.isLoading ? <Loading /> : sports.error ? <ErrorBox error={sports.error} retry={() => sports.refetch()} /> : !list.length ? (
        <EmptyState icon={Trophy} title="No sports found" text={q ? "Try a different search." : "An admin can add the first sport."} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => {
            const teamCount = (teams.data ?? []).filter((t) => t.sport_id === s.id).length;
            const reg = myReg(s.id);
            return (
              <article key={s.id} className="flex flex-col rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-2xl font-bold uppercase">{s.name}</h2>
                  {me?.isAdmin && (
                    <div className="flex">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                      <Confirm
                        title={`Delete ${s.name}?`}
                        text="This also deletes its teams, matches and registrations. This can't be undone."
                        onConfirm={() => remove(s.id)}
                        trigger={<Button variant="ghost" size="icon" aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></Button>}
                      />
                    </div>
                  )}
                </div>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description || "No description."}</p>
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Link to="/app/teams" search={{ sport: s.id }} className="text-sm text-primary hover:underline">{teamCount} team{teamCount === 1 ? "" : "s"}</Link>
                  {!me?.isAdmin && (reg ? <RegBadge s={reg.status} /> : (
                    <Button size="sm" disabled={register.isPending} onClick={() => register.mutate(s.id)}>Register</Button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && <SportDialog sport={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function SportDialog({ sport, onClose }: { sport: Sport | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = sportSchema.safeParse({ name: fd.get("name"), description: fd.get("description") ?? "" });
    if (!parsed.success) { setErrors(fieldErrors(parsed.error)); return; }
    setBusy(true);
    const { error } = sport
      ? await supabase.from("sports").update(parsed.data).eq("id", sport.id)
      : await supabase.from("sports").insert(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "A sport with that name already exists" : error.message); return; }
    toast.success(sport ? "Sport updated" : "Sport created");
    qc.invalidateQueries();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{sport ? "Edit sport" : "New sport"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={sport?.name} aria-invalid={!!errors["name"]} />
            {errors["name"] && <p className="text-sm text-destructive">{errors["name"]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={sport?.description ?? ""} />
            {errors["description"] && <p className="text-sm text-destructive">{errors["description"]}</p>}
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
