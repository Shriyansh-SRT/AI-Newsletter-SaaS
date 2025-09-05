"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    const getInitialSession = async () => {
      console.log("AuthProvider: Getting initial session...");
      try {
        // Try multiple times to get the session (in case of timing issues)
        let attempts = 0;
        const maxAttempts = 3;

        const checkSession = async () => {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();

          if (error) {
            console.error("AuthProvider: Error getting session:", error);
          }

          console.log(
            `AuthProvider: Attempt ${attempts + 1} - Initial session:`,
            session?.user?.email
          );

          if (session) {
            setAuth(session.user, session);
            console.log(
              "AuthProvider: Set auth with user:",
              session.user.email
            );
            setLoading(false);
            return true;
          }

          return false;
        };

        // Try immediately
        let sessionFound = await checkSession();

        // If no session found, try again after a short delay
        if (!sessionFound && attempts < maxAttempts - 1) {
          attempts++;
          setTimeout(async () => {
            sessionFound = await checkSession();
            if (!sessionFound) {
              console.log("AuthProvider: No session found after retries");
              setLoading(false);
            }
          }, 100);
        } else if (!sessionFound) {
          console.log("AuthProvider: No session found");
          setLoading(false);
        }
      } catch (error) {
        console.error("AuthProvider: Error in getInitialSession:", error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "AuthProvider: Auth state changed:",
        event,
        session?.user?.email
      );

      if (event === "SIGNED_IN" && session) {
        console.log("AuthProvider: SIGNED_IN event, setting auth");
        setAuth(session.user, session);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        console.log("AuthProvider: SIGNED_OUT event, clearing auth");
        setAuth(null, null);
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session) {
        console.log("AuthProvider: TOKEN_REFRESHED event, updating auth");
        setAuth(session.user, session);
        setLoading(false);
      } else if (event === "INITIAL_SESSION" && session) {
        console.log("AuthProvider: INITIAL_SESSION event, setting auth");
        setAuth(session.user, session);
        setLoading(false);
      } else if (event === "INITIAL_SESSION" && !session) {
        console.log("AuthProvider: INITIAL_SESSION event, no session");
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [setAuth, setLoading]);

  return <>{children}</>;
}
