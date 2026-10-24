import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Search, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { Confirm, ErrorBox, Loading, Pager, paginate } from "@/components/sporty/bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { requireAdmin } from "@/lib/guards";
import { playersQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/players")({
  beforeLoad: requireAdmin,
  head: () => ({ meta: [{ title: "Players — SPORTY" }, { name: "description", content: "Everyone registered with the club." }, { property: "og:title", content: "Players — SPORTY" }, { property: "og:description", content: "Everyone registered with the club." }] }),
  component: Players,
});

function Players() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const players = useQuery(playersQuery);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = (players.data ?? []).filter((p) => `${p.full_name} ${p.email}`.toLowerCase().includes(q.toLowerCase()));
  const pg = paginate(list, page);

  async function setAdmin(userId: string, grant: boolean) {
    const { error } = await supabase.rpc("set_user_role", { _user_id: userId, _role: "admin", _grant: grant });
    if (error) return void toast.error(error.message);
    toast.success(grant ? "Admin access granted" : "Admin access removed");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Players" subtitle="Everyone registered with the club." />
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search players" placeholder="Search by name or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" />
      </div>
      {players.isLoading ? <Loading /> : players.error ? <ErrorBox error={players.error} retry={() => players.refetch()} /> : !list.length ? (
        <EmptyState icon={Users} title="No players found" text="Players appear here after they sign up." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Email</th><th className="p-3 font-medium">Role</th><th className="p-3 font-medium">Joined</th><th className="p-3" /></tr>
              </thead>
              <tbody className="divide-y">
                {pg.items.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-medium">{p.full_name}</td>
                    <td className="p-3 text-muted-foreground">{p.email}</td>
                    <td className="p-3"><Badge variant={p.isAdmin ? "default" : "muted"}>{p.isAdmin ? "Admin" : "Player"}</Badge></td>
                    <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      {p.id !== me?.id && (
                        <Confirm
                          title={p.isAdmin ? `Remove admin access from ${p.full_name}?` : `Make ${p.full_name} an admin?`}
                          text={p.isAdmin ? "They'll keep their player account." : "Admins can manage every sport, team, match and registration."}
                          label={p.isAdmin ? "Remove admin" : "Make admin"}
                          onConfirm={() => setAdmin(p.id, !p.isAdmin)}
                          trigger={<Button variant="outline" size="sm">{p.isAdmin ? "Remove admin" : "Make admin"}</Button>}
                        />
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
    </>
  );
}
