"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";

// Gives every page access to: who is logged in (user), their profile and role,
// and a signOut function. Use it with:  const { user, role } = useAuth();
const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileFor, setProfileFor] = useState(null); // which user the profile belongs to

  // 1. Find out who is logged in, and listen for login / logout
  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setUser(data.session?.user ?? null);
        setSessionReady(true);
      })
      .catch(() => active && setSessionReady(true));

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setSessionReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? null;

  const loadProfile = useCallback(async (id) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
    setProfile(error ? null : data);
    setProfileFor(id);
  }, []);

  // 2. Load the profile (role, name, company) of the logged-in user
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProfile(error ? null : data);
        setProfileFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileFor(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  const loading = !sessionReady || (userId !== null && profileFor !== userId);
  // A profile only counts if it belongs to the user that is logged in right now
  const currentProfile = userId !== null && profileFor === userId ? profile : null;

  const value = useMemo(
    () => ({ user, profile: currentProfile, role: currentProfile?.role ?? null, loading, signOut, refreshProfile }),
    [user, currentProfile, loading, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
