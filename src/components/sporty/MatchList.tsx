import { MatchBadge } from "@/components/sporty/bits";
import { fmtDate, type MatchRow } from "@/lib/data";

export function MatchList({ matches, empty }: { matches: MatchRow[]; empty: string }) {
  if (!matches.length) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="divide-y">
      {matches.map((m) => (
        <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="min-w-0">
            <div className="font-medium">
              {m.home?.name} <span className="text-muted-foreground">vs</span> {m.away?.name}
            </div>
            <div className="text-xs text-muted-foreground">{m.sport?.name} · {fmtDate(m.scheduled_at)}{m.venue ? ` · ${m.venue}` : ""}</div>
          </div>
          <div className="flex items-center gap-3">
            {m.home_score != null && m.away_score != null && (
              <span className="font-display text-2xl font-bold tabular-nums">{m.home_score}–{m.away_score}</span>
            )}
            <MatchBadge s={m.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}

