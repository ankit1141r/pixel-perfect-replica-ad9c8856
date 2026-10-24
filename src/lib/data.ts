import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MatchStatus = Database["public"]["Enums"]["match_status"];
export type RegStatus = Database["public"]["Enums"]["registration_status"];
export type SyncStatus = Database["public"]["Enums"]["sync_status"];

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const sportsQuery = queryOptions({
  queryKey: ["sports"],
  queryFn: async () => must(await supabase.from("sports").select("*").order("name")),
});

export const teamsQuery = queryOptions({
  queryKey: ["teams"],
  queryFn: async () =>
    must(await supabase.from("teams").select("*, sport:sports(id, name), team_members(count)").order("name")),
});

export const teamQuery = (id: string) =>
  queryOptions({
    queryKey: ["teams", id],
    queryFn: async () => must(await supabase.from("teams").select("*, sport:sports(id, name)").eq("id", id).maybeSingle()),
  });

export const rosterQuery = (teamId: string) =>
  queryOptions({
    queryKey: ["roster", teamId],
    queryFn: async () => must(await supabase.rpc("team_roster", { _team_id: teamId })),
  });

export const MATCH_SELECT =
  "*, sport:sports(id, name), home:teams!matches_home_team_id_fkey(id, name), away:teams!matches_away_team_id_fkey(id, name)";

export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async () => must(await supabase.from("matches").select(MATCH_SELECT).order("scheduled_at")),
});
export type MatchRow = Awaited<ReturnType<typeof matchesQuery.queryFn & {}>>[number];

export const registrationsQuery = queryOptions({
  queryKey: ["registrations"],
  queryFn: async () =>
    must(
      await supabase
        .from("player_registrations")
        .select("*, sport:sports(id, name), player:profiles(id, full_name, email), job:sheets_sync_jobs(id, status, attempts, last_error)")
        .order("created_at", { ascending: false }),
    ),
});

export const playersQuery = queryOptions({
  queryKey: ["players"],
  queryFn: async () => {
    const [profiles, roles] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const list = must(profiles);
    const r = must(roles);
    return list.map((p) => ({ ...p, isAdmin: r.some((x) => x.user_id === p.id && x.role === "admin") }));
  },
});

export const myTeamsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["my-teams", userId],
    queryFn: async () =>
      must(await supabase.from("team_members").select("team:teams(id, name, sport:sports(name))").eq("player_id", userId)),
  });

export const activityQuery = queryOptions({
  queryKey: ["activity"],
  queryFn: async () =>
    must(
      await supabase
        .from("activity_logs")
        .select("*, actor:profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50),
    ),
});

export const countsQuery = queryOptions({
  queryKey: ["counts"],
  queryFn: async () => {
    const c = async (t: "profiles" | "sports" | "teams" | "matches") => {
      const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return count ?? 0;
    };
    const [players, sports, teams, matches] = await Promise.all([c("profiles"), c("sports"), c("teams"), c("matches")]);
    return { players, sports, teams, matches };
  },
});

export const fmtDate = (s: string) =>
  new Date(s).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export const toLocalInput = (s: string) => {
  const d = new Date(s);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Points table from completed matches: win 3, draw 1, loss 0. */
export function standings(matches: Pick<MatchRow, "status" | "home_team_id" | "away_team_id" | "home_score" | "away_score">[], teamNames: Record<string, string>) {
  const t: Record<string, { team: string; p: number; w: number; d: number; l: number; pts: number }> = {};
  const row = (id: string) => (t[id] ??= { team: teamNames[id] ?? "—", p: 0, w: 0, d: 0, l: 0, pts: 0 });
  for (const m of matches) {
    if (m.status !== "completed" || m.home_score == null || m.away_score == null) continue;
    const h = row(m.home_team_id), a = row(m.away_team_id);
    h.p++; a.p++;
    if (m.home_score > m.away_score) { h.w++; a.l++; h.pts += 3; }
    else if (m.home_score < m.away_score) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  return Object.values(t).sort((x, y) => y.pts - x.pts || y.w - x.w || x.team.localeCompare(y.team));
}
