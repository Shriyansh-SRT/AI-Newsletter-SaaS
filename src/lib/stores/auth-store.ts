import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setAuth: (user: User | null, session: Session | null) => void;
  signOut: () => Promise<void>;
  getSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });
  },

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user || null,
      isAuthenticated: !!session?.user,
    });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // Helper to update both user and session
  setAuth: (user: User | null, session: Session | null) => {
    set({
      user,
      session,
      isAuthenticated: !!user,
    });
  },

  signOut: async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();

      // Clear Zustand state immediately
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        loading: false,
      });

      // Redirect to signin page
      window.location.href = "/signin";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },

  getSession: async () => {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      set({ session, user: session.user, isAuthenticated: !!session.user });
    }
  },
}));
