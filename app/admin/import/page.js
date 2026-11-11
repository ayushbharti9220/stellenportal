"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser as supabase } from "@/lib/supabaseBrowser";
import RequireRole from "@/components/RequireRole";
import { ErrorBox, SuccessBox } from "@/components/PageState";
import { friendlyDbError } from "@/lib/authErrors";
import { CSV_TEMPLATE, parseCsv } from "@/lib/csv";
import { prepareJobRows } from "@/lib/csvJobs";
import { cardClass, primaryBtn, secondaryBtn } from "@/lib/ui";

const BATCH_SIZE = 100;
const MAX_ROWS = 2000;

function ImportCsv() {
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null); // { valid, invalid }
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stellenportal-jobs-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(e) {
    setError("");
    setMessage("");
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) return setError("Please choose a .csv file.");
    if (file.size > 5 * 1024 * 1024) return setError("The file is larger than 5 MB.");

    const records = parseCsv(await file.text());
    if (records.length === 0) return setError("No rows found. Check that the first line contains the column names.");
    if (records.length > MAX_ROWS) return setError(`Too many rows. Import at most ${MAX_ROWS} jobs at a time.`);
    if (!("job_title" in records[0]) || !("company_name" in records[0])) {
      return setError("The file needs at least the columns job_title and company_name. Download the template to see all columns.");
    }
    setResult(prepareJobRows(records));
  }

  async function runImport() {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    setError("");
    setMessage("");

    let inserted = 0;
    for (let i = 0; i < result.valid.length; i += BATCH_SIZE) {
      const batch = result.valid.slice(i, i + BATCH_SIZE);
      // ignoreDuplicates: a job with the same source_name + source_job_id is skipped, not duplicated
      const { data, error: importError } = await supabase
        .from("jobs")
        .upsert(batch, { onConflict: "source_name,source_job_id", ignoreDuplicates: true })
        .select("id");
      if (importError) {
        setError(`${friendlyDbError(importError)} (${inserted} jobs were added before the error.)`);
        setImporting(false);
        return;
      }
      inserted += data?.length ?? 0;
    }

    const skipped = result.valid.length - inserted;
    setMessage(`Done. ${inserted} new ${inserted === 1 ? "job" : "jobs"} added. ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped.`);
    setResult(null);
    setFileName("");
    setImporting(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href="/admin" className="text-sm text-slate-600 hover:text-blue-700">Back to admin dashboard</Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">Import jobs from CSV</h1>
      <p className="mt-1 text-slate-600">
        Use this only for jobs you are allowed to publish: your own data, approved feeds, or sources that permit reuse.
      </p>

      <div className={`${cardClass} mt-8 space-y-5 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={downloadTemplate} className={secondaryBtn}>Download template</button>
          <span className="text-sm text-slate-500">Required: job_title, company_name, and apply_url or source_url.</span>
        </div>

        <div>
          <label htmlFor="csv" className="mb-1.5 block text-sm font-medium">Choose your CSV file</label>
          <input
            id="csv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            disabled={importing}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
          />
        </div>

        <ErrorBox>{error}</ErrorBox>
        <SuccessBox>{message}</SuccessBox>

        {result && (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              <strong>{fileName}</strong>: {result.valid.length} ready to import, {result.invalid.length} with problems.
            </p>

            {result.invalid.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-medium">These rows will be skipped:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {result.invalid.slice(0, 10).map((row) => (
                    <li key={row.line}>Line {row.line}: {row.reason}</li>
                  ))}
                </ul>
                {result.invalid.length > 10 && <p className="mt-2">...and {result.invalid.length - 10} more.</p>}
              </div>
            )}

            {result.valid.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Company</th>
                      <th className="px-3 py-2 font-medium">Location</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.valid.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{row.job_title}</td>
                        <td className="px-3 py-2">{row.company_name}</td>
                        <td className="px-3 py-2">{row.location || "-"}</td>
                        <td className="px-3 py-2">{row.employment_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.valid.length > 5 && (
                  <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">Preview of the first 5 rows.</p>
                )}
              </div>
            )}

            <button type="button" onClick={runImport} disabled={importing || result.valid.length === 0} className={primaryBtn}>
              {importing ? "Importing..." : `Import ${result.valid.length} ${result.valid.length === 1 ? "job" : "jobs"}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <RequireRole roles={["admin"]}>
      <ImportCsv />
    </RequireRole>
  );
}
