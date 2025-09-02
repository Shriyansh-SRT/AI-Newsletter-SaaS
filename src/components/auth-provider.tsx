"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAuth(session.user, session);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);

      if (event === "SIGNED_IN" && session) {
        setAuth(session.user, session);
      } else if (event === "SIGNED_OUT") {
        setAuth(null, null);
      } else if (event === "TOKEN_REFRESHED" && session) {
        setAuth(session.user, session);
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [setAuth]);

  return <>{children}</>;
}
