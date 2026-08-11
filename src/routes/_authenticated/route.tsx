import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // A stored session whose refresh token expired (e.g. laptop was shut down
    // for a while) must be cleared, otherwise every request keeps failing and
    // the app looks frozen on a blank screen.
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
        throw redirect({ to: "/auth" });
      }
      return { user: data.session.user };
    } catch (e) {
      if (e && typeof e === "object" && "isRedirect" in e) throw e;
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      throw redirect({ to: "/auth" });
    }
  },
  component: AppShell,
});
