// A small CSV reader. Handles quotes, commas and line breaks inside quotes.
// Returns an array of objects keyed by the (lower-case) header names.
export function parseCsv(text) {
  const input = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmpty.length === 0) return [];

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((h, idx) => {
      if (h) obj[h] = (cells[idx] ?? "").trim();
    });
    return obj;
  });
}

// Column order for the template. List columns (responsibilities, requirements, benefits)
// use " | " between items, so the file stays easy to edit in Excel or Google Sheets.
export const CSV_TEMPLATE =
  "job_title,company_name,location,employment_type,workplace_type,salary,experience,education,openings,application_deadline,description,responsibilities,requirements,skills,benefits,source_name,source_job_id,source_url,apply_url,posted_at\n" +
  '"Frontend Developer","Example Pvt Ltd","Bengaluru, Karnataka","Full-time","Hybrid","₹6–9 LPA","1-3 years","BCA / B.Tech","2","2026-12-31","Build user interfaces with React. Work with designers and backend developers on new features.","Build reusable components | Fix bugs | Write tests","1+ year of React | Good communication","React, JavaScript, Tailwind CSS","Health insurance | Flexible hours","Example Careers","EX-1001","https://example.com/jobs/1001","https://example.com/jobs/1001/apply","2026-11-01"\n';
