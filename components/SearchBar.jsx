export default function SearchBar({
  query,
  onQueryChange,
  location,
  onLocationChange,
  locations,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">Search jobs</span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Job title, company or skill"
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <label className="sm:w-56">
        <span className="sr-only">Location</span>
        <select
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
