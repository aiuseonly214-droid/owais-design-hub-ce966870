import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Revalidate the stored identity with Auth instead of trusting a cached
    // session that may have expired while the device was offline.
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        throw redirect({ to: "/auth" });
      }
      return { user: data.user };
    } catch (e) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      throw redirect({ to: "/auth" });
    }
  },
  component: AppShell,
});
