import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { meQuery } from "@/lib/auth";

/** Route-level UX guard for admin pages. Real enforcement is database RLS. */
export async function requireAdmin({ context }: { context: { queryClient: QueryClient } }) {
  const me = await context.queryClient.ensureQueryData(meQuery);
  if (!me?.isAdmin) throw redirect({ to: "/app" });
}
