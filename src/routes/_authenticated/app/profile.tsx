import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/sporty/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useMe, type Me } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";

export const Route = createFileRoute("/_authenticated/app/profile")({
  head: () => ({ meta: [{ title: "Profile — SPORTY" }, { name: "description", content: "Your account details." }, { property: "og:title", content: "Profile — SPORTY" }, { property: "og:description", content: "Your account details." }] }),
  component: Profile,
});

function Profile() {
  const { data: me, isLoading, error } = useMe();
  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />
      {isLoading && <Skeleton className="h-64 max-w-lg" />}
      {error && <p className="text-destructive">Couldn't load your profile.</p>}
      {me && <ProfileForm me={me} />}
    </>
  );
}

function ProfileForm({ me }: { me: Me }) {
  const qc = useQueryClient();
  const [name, setName] = useState(me.fullName);
  const [err, setErr] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (fullName: string) => {
      const { error } = await supabase.from("profiles").update({ full_name: fullName, updated_at: new Date().toISOString() }).eq("id", me.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      className="max-w-lg space-y-5 rounded-xl border bg-card p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const p = profileSchema.safeParse({ fullName: name });
        if (!p.success) { setErr(p.error.issues[0]?.message ?? "Invalid name"); return; }
        setErr(null);
        save.mutate(p.data.fullName);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!err} />
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={me.email} disabled />
      </div>
      <div className="text-sm text-muted-foreground">
        Role: <span className="font-semibold text-primary">{me.isAdmin ? "Administrator" : "Player"}</span>
      </div>
      <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
    </form>
  );
}
