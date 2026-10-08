import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Route guard: only admins may open financial / payroll pages. */
export async function requireAdmin() {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw redirect({ to: "/auth" });
  const { data: row } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (!row) throw redirect({ to: "/dashboard", search: { denied: 1 } as never });
}
