"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "./AuthProvider";
import { ErrorBox, Loading } from "./PageState";
import { friendlyAuthError } from "@/lib/authErrors";
import { roleHome, safeNext } from "@/lib/roles";
import { inputClass, labelClass, primaryBtn, secondaryBtn } from "@/lib/ui";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, role, loading, signOut } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Once logged in (and the role is known), go to the right page
  useEffect(() => {
    if (!loading && user && role) router.replace(next || roleHome(role));
  }, [loading, user, role, next, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInError) {
      setError(friendlyAuthError(signInError));
      setSubmitting(false);
    }
    // On success the effect above redirects.
  }

  if (loading) return <Loading />;

  if (user && !role) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          You are logged in, but your profile is missing. Run database/phase5-migration.sql in Supabase, then log in again.
        </p>
        <button type="button" onClick={signOut} className={`${secondaryBtn} mt-6`}>Log out</button>
      </div>
    );
  }

  if (user) return <Loading text="Redirecting..." />;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-1 text-sm text-slate-600">Welcome back to Stellenportal.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <ErrorBox>{error}</ErrorBox>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <button type="submit" disabled={submitting || !email || !password} className={`${primaryBtn} w-full`}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/signup" className="font-medium text-blue-700 hover:underline">Create an account</Link>
      </p>
    </div>
  );
}
