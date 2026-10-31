export default function Loading() {
  return (
    <div className="container-page py-10" aria-busy="true" aria-live="polite">
      <div className="h-7 w-56 animate-pulse rounded-lg bg-navy-100" />
      <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-navy-100/70" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="h-40 animate-pulse rounded-2xl border border-navy-100 bg-white/70" />
        ))}
      </div>
      <span className="sr-only">लोड हो रहा है… / Loading…</span>
    </div>
  );
}
