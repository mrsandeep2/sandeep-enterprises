import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "user";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  roles: AppRole[];
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAdmin: false,
    roles: [],
  });

  const fetchUserRoles = useCallback(async (userId: string): Promise<AppRole[]> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching roles:", error);
        return [];
      }

      return (data?.map((r) => r.role) as AppRole[]) || [];
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error fetching roles:", error);
      return [];
    }
  }, []);

  const updateAuthState = useCallback(
    async (session: Session | null) => {
      if (!session?.user) {
        setAuthState({
          user: null,
          session: null,
          isLoading: false,
          isAdmin: false,
          roles: [],
        });
        return;
      }

      // Fetch roles asynchronously to avoid auth deadlock
      const roles = await fetchUserRoles(session.user.id);
      const isAdmin = roles.includes("admin");

      setAuthState({
        user: session.user,
        session,
        isLoading: false,
        isAdmin,
        roles,
      });
    },
    [fetchUserRoles]
  );

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only update synchronous state immediately
        setAuthState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
        }));

        // Defer role fetching with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            updateAuthState(session);
          }, 0);
        } else {
          setAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAdmin: false,
            roles: [],
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    return () => subscription.unsubscribe();
  }, [updateAuthState]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: AppRole): boolean => {
    return authState.roles.includes(role);
  };

  return {
    ...authState,
    signOut,
    hasRole,
  };
};
