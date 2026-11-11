"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import { useAuth } from "./AuthProvider";
import { ErrorBox, Loading, SuccessBox } from "./PageState";
import { friendlyAuthError } from "@/lib/authErrors";
import { roleHome } from "@/lib/roles";
import { inputClass, labelClass, primaryBtn } from "@/lib/ui";

const ACCOUNT_TYPES = [
  { value: "seeker", title: "I want a job", text: "Browse jobs, apply and upload your CV." },
  { value: "employer", title: "I am hiring", text: "Company or HR: post jobs and review applicants." },
];

export default function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, role: currentRole, loading } = useAuth();

  const [accountType, setAccountType] = useState(params.get("role") === "employer" ? "employer" : "seeker");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && currentRole) router.replace(roleHome(currentRole));
  }, [loading, user, currentRole, router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (accountType === "employer" && companyName.trim().length < 2) return setError("Enter your company name.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        // The database trigger copies these into the profiles table
        data: {
          role: accountType,
          full_name: fullName.trim(),
          company_name: accountType === "employer" ? companyName.trim() : null,
        },
      },
    });

    if (signUpError) {
      setError(friendlyAuthError(signUpError));
      setSubmitting(false);
      return;
    }

    // Supabase hides "email already exists" by returning a user with no identities
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("An account with this email already exists. Please log in instead.");
      setSubmitting(false);
      return;
    }

    if (!data.session) {
      setNotice("Account created. Check your email and click the confirmation link, then log in.");
      setSubmitting(false);
    }
    // If a session exists, the effect above redirects automatically.
  }

  if (loading) return <Loading />;
  if (user) return <Loading text="Redirecting..." />;

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Choose what you want to do on Stellenportal.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
        {ACCOUNT_TYPES.map((t) => {
          const active = accountType === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAccountType(t.value)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active ? "border-blue-700 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <span className="block font-semibold text-slate-900">{t.title}</span>
              <span className="mt-1 block text-sm text-slate-600">{t.text}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <ErrorBox>{error}</ErrorBox>
        <SuccessBox>{notice}</SuccessBox>

        <div>
          <label htmlFor="fullName" className={labelClass}>Full name</label>
          <input id="fullName" type="text" autoComplete="name" value={fullName}
            onChange={(e) => setFullName(e.target.value)} className={inputClass} />
        </div>

        {accountType === "employer" && (
          <div>
            <label htmlFor="companyName" className={labelClass}>Company name</label>
            <input id="companyName" type="text" autoComplete="organization" value={companyName}
              onChange={(e) => setCompanyName(e.target.value)} className={inputClass} />
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          <p className="mt-1.5 text-xs text-slate-500">At least 8 characters.</p>
        </div>

        <button type="submit" disabled={submitting || !email || !password} className={`${primaryBtn} w-full`}>
          {submitting ? "Creating account..." : accountType === "employer" ? "Create employer account" : "Create job seeker account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
