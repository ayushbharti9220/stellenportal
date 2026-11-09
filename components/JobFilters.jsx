export default function JobFilters({ types, selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by job type">
      {types.map((type) => {
        const active = selected === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            aria-pressed={active}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              active
                ? "border-blue-700 bg-blue-700 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
