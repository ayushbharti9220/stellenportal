import { supabaseBrowser as supabase } from "./supabaseBrowser";

export const CV_BUCKET = "cvs";
export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const CV_EXTENSIONS = ["pdf", "doc", "docx"];

// Returns an error message, or "" if the file is fine
export function checkCvFile(file) {
  if (!file) return "Please choose your CV file.";
  const ext = file.name.split(".").pop().toLowerCase();
  if (!CV_EXTENSIONS.includes(ext)) return "The CV must be a PDF, DOC or DOCX file.";
  if (file.size > CV_MAX_BYTES) return "The CV is too large. Maximum size is 5 MB.";
  if (file.size === 0) return "This file is empty.";
  return "";
}

export function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

// Creates a short-lived private link and downloads the CV. Returns an error message or "".
export async function downloadCv(path, filename) {
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(path, 120, { download: filename || true });
  if (error || !data?.signedUrl) return "Could not open the CV. You may not have permission, or the file is missing.";
  window.location.href = data.signedUrl;
  return "";
}
