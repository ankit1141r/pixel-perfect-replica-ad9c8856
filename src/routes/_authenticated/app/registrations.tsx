import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ClipboardCheck, RotateCw, X } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/sporty/PageShell";
import { ErrorBox, Loading, Pager, paginate, RegBadge, SyncBadge } from "@/components/sporty/bits";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { registrationsQuery, type RegStatus } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/app/registrations")({
  head: () => ({ meta: [{ title: "Registrations — SPORTY" }, { name: "description", content: "Sport registration requests." }, { property: "og:title", content: "Registrations — SPORTY" }, { property: "og:description", content: "Sport registration requests." }] }),
  component: Registrations,
});

function Registrations() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const regs = useQuery(registrationsQuery);
  const [status, setStatus] = useState(me?.isAdmin ? "pending" : "all");
  const [page, setPage] = useState(1);
  const list = (regs.data ?? []).filter((r) => status === "all" || r.status === status);
  const pg = paginate(list, page);

  async function decide(id: string, s: RegStatus) {
    const { error } = await supabase.from("player_registrations").update({ status: s, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success(s === "approved" ? "Registration approved" : "Registration rejected");
    qc.invalidateQueries();
  }
  async function retry(jobId: string) {
    const { error } = await supabase.from("sheets_sync_jobs").update({ status: "pending", last_error: null, updated_at: new Date().toISOString() }).eq("id", jobId);
    if (error) return void toast.error(error.message);
    toast.success("Queued for another sync attempt");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Registrations" subtitle={me?.isAdmin ? "Approve or reject players' sport registrations." : "Your sport registration requests."}
        action={!me?.isAdmin && <Button asChild><Link to="/app/sports">Register for a sport</Link></Button>} />
      <div className="mb-6">
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {regs.isLoading ? <Loading /> : regs.error ? <ErrorBox error={regs.error} retry={() => regs.refetch()} /> : !list.length ? (
        <EmptyState icon={ClipboardCheck} title="No registrations" text={me?.isAdmin ? "Nothing matches this filter." : "Register for a sport from the Sports page."} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  {me?.isAdmin && <th className="p-3 font-medium">Player</th>}
                  <th className="p-3 font-medium">Sport</th><th className="p-3 font-medium">Submitted</th><th className="p-3 font-medium">Status</th>
                  {me?.isAdmin && <th className="p-3 font-medium">Sheet sync</th>}
                  {me?.isAdmin && <th className="p-3" />}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pg.items.map((r) => (
                  <tr key={r.id}>
                    {me?.isAdmin && <td className="p-3"><div className="font-medium">{r.player?.full_name}</div><div className="text-xs text-muted-foreground">{r.player?.email}</div></td>}
                    <td className="p-3">{r.sport?.name}</td>
                    <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3"><RegBadge s={r.status} /></td>
                    {me?.isAdmin && (
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <SyncBadge s={r.job?.status ?? r.sheets_sync_status} />
                          {r.job?.status === "failed" && (
                            <Button variant="ghost" size="icon" aria-label="Retry sync" title={r.job.last_error ?? "Retry"} onClick={() => retry(r.job!.id)}><RotateCw className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </td>
                    )}
                    {me?.isAdmin && (
                      <td className="whitespace-nowrap p-3 text-right">
                        {r.status !== "approved" && <Button size="sm" variant="outline" onClick={() => decide(r.id, "approved")}><Check className="h-4 w-4" /> Approve</Button>}
                        {r.status !== "rejected" && <Button size="sm" variant="ghost" className="ml-1" onClick={() => decide(r.id, "rejected")}><X className="h-4 w-4" /> Reject</Button>}
                      </td>
                    )}
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
