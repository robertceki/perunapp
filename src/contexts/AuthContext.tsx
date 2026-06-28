import type { Session } from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { AuthContext } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/Profile";

export type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single<Profile>();

    if (error) {
      throw error;
    }

    setProfile(data);
  }, []);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setLoading(false);
        return;
      }

      setSession(data.session);
      setProfile(null);

      if (data.session) {
        void fetchProfile(data.session.user.id);
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;

        setSession(nextSession);
        setProfile(null);

        if (nextSession) {
          void fetchProfile(nextSession.user.id);
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName },
        },
      });

      if (error) throw error;
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
  }, []);

  const changePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);

      if (error) throw error;

      await fetchProfile(session.user.id);
    },
    [fetchProfile, session],
  );

  const value = useMemo(
    () => ({
      session,
      loading,
      profile,
      login,
      logout,
      register,
      changePassword,
      resetPassword,
      updateProfile,
    }),
    [
      session,
      loading,
      profile,
      login,
      logout,
      register,
      changePassword,
      resetPassword,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
