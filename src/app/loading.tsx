export default function Loading() {
  return (
    <div className="container-page pt-20 sm:pt-24" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-paper-2" />
      <div className="mt-2 h-4 w-32 animate-pulse rounded bg-paper-2" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] animate-pulse rounded-xl bg-white/[0.06]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-paper-2" />
            <div className="mt-1.5 h-2.5 w-2/5 animate-pulse rounded bg-white/4" />
          </div>
        ))}
      </div>
      <span className="sr-only">Memuat konten…</span>
    </div>
  );
}
