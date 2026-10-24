import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
};

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async (): Promise<Me | null> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const [profile, roles] = await Promise.all([
      supabase.from("profiles").select("full_name, email, created_at").eq("id", auth.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", auth.user.id),
    ]);
    if (profile.error) throw profile.error;
    if (roles.error) throw roles.error;
    return {
      id: auth.user.id,
      email: profile.data?.email ?? auth.user.email ?? "",
      fullName: profile.data?.full_name ?? "",
      createdAt: profile.data?.created_at ?? auth.user.created_at,
      isAdmin: (roles.data ?? []).some((r) => r.role === "admin"),
    };
  },
});

export const useMe = () => useQuery(meQuery);

/** Only allow same-origin relative paths as post-login destinations. */
export function safeRedirect(target: unknown): string {
  if (typeof target !== "string" || !target.startsWith("/") || target.startsWith("//")) return "/app";
  return target;
}
