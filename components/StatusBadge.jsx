const styles = {
  submitted: "bg-slate-100 text-slate-700",
  reviewing: "bg-blue-50 text-blue-800",
  shortlisted: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
  hired: "bg-violet-50 text-violet-800",
  active: "bg-emerald-50 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status] || styles.submitted}`}>
      {status}
    </span>
  );
}
