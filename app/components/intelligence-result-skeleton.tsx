export function IntelligenceResultSkeleton() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#050d18] p-5 shadow-2xl shadow-cyan-950/30 sm:p-7"
      aria-label="Structuring notice"
      aria-live="polite"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded-full bg-cyan-200/25" />
            <div className="h-8 w-64 animate-pulse rounded-xl bg-white/15 sm:w-96" />
          </div>

          <div className="h-7 w-28 animate-pulse rounded-full bg-cyan-200/10" />
        </div>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="h-3 w-20 animate-pulse rounded-full bg-cyan-200/25" />

          <div className="mt-4 space-y-3">
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-11/12 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[1, 2].map((card) => (
            <div
              key={card}
              className="rounded-2xl border border-cyan-100/10 bg-white/[0.04] p-4"
            >
              <div className="h-3 w-20 animate-pulse rounded-full bg-cyan-200/20" />
              <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-white/10" />
              <div className="mt-2 h-3 w-3/5 animate-pulse rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="h-3 w-36 animate-pulse rounded-full bg-cyan-200/20" />
          <div className="mt-3 h-6 w-64 animate-pulse rounded-lg bg-white/10" />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-[#102b42] via-[#0b1d31] to-[#081321] p-5"
              >
                <div className="flex gap-4">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-cyan-300/20" />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-5 w-2/3 animate-pulse rounded-full bg-white/15" />
                    <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
                    <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />

                    <div className="grid gap-3 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((field) => (
                        <div
                          key={field}
                          className="h-16 animate-pulse rounded-xl bg-black/20"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3 text-sm text-cyan-100/70">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/80" />
          <span>Reading the notice and organizing important details…</span>
        </div>
      </div>
    </section>
  );
}