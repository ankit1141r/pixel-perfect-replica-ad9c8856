import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { MatchStatus, RegStatus, SyncStatus } from "@/lib/data";

export function Confirm({ trigger, title, text, onConfirm, label = "Delete" }: {
  trigger: ReactNode; title: string; text: string; onConfirm: () => Promise<unknown> | void; label?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{text}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const matchVariant = { scheduled: "muted", live: "live", completed: "success", cancelled: "danger" } as const;
export const MatchBadge = ({ s }: { s: MatchStatus }) => <Badge variant={matchVariant[s]} className="capitalize">{s}</Badge>;

const regVariant = { pending: "warning", approved: "success", rejected: "danger" } as const;
export const RegBadge = ({ s }: { s: RegStatus }) => <Badge variant={regVariant[s]} className="capitalize">{s}</Badge>;

const syncLabel = { not_configured: "Not set up", pending: "Pending", synced: "Synced", failed: "Failed" } as const;
const syncVariant = { not_configured: "muted", pending: "warning", synced: "success", failed: "danger" } as const;
export const SyncBadge = ({ s }: { s: SyncStatus }) => <Badge variant={syncVariant[s]}>{syncLabel[s]}</Badge>;

export function Loading({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
}

export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
      Couldn't load this: {error instanceof Error ? error.message : "unknown error"}
      {retry && <Button variant="link" className="ml-2 h-auto p-0" onClick={retry}>Try again</Button>}
    </div>
  );
}

export function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold uppercase">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Pager({ page, pages, setPage }: { page: number; pages: number; setPage: (n: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
      Page {page} of {pages}
      <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
    </div>
  );
}

export const PAGE_SIZE = 10;
export function paginate<T>(list: T[], page: number) {
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const p = Math.min(page, pages);
  return { pages, page: p, items: list.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE) };
}
