"use client";

import RequireRole from "@/components/RequireRole";
import JobForm from "@/components/JobForm";

export default function NewJobPage() {
  return (
    <RequireRole roles={["employer", "admin"]}>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Post a job</h1>
        <p className="mt-1 text-slate-600">Fill in the details. Your job goes live as soon as you publish.</p>
        <div className="mt-8">
          <JobForm mode="create" />
        </div>
      </div>
    </RequireRole>
  );
}
