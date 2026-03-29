import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-strong)]">About</p>
      <h1 className="text-3xl font-semibold text-[var(--foreground)]">Open source FireWise MVP</h1>
      <p className="text-[var(--muted)]">
        This project implements the FireWise Landscape Planner specification: a client-side Next.js
        experience that pulls from the{" "}
        <a
          className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
          href="https://lwf-api.vercel.app/"
          target="_blank"
          rel="noreferrer"
        >
          Living with Fire API
        </a>
        , keeps questionnaire state in <code className="rounded bg-black/5 px-1">localStorage</code>, and
        generates printable guidance for homeowners in Washington, Oregon, and Idaho climates.
      </p>
      <div className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Contributing</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Fork the repository you are working from and branch per feature.</li>
          <li>Keep API access inside <code className="rounded bg-black/5 px-1">src/lib/plantApi.ts</code>.</li>
          <li>Extend filtering logic in <code className="rounded bg-black/5 px-1">src/lib/filterPlants.ts</code>.</li>
          <li>Document any new environment variables in README.</li>
        </ol>
      </div>
      <p className="text-sm text-[var(--muted)]">
        {/* TODO: [Phase 2] Wire Supabase-backed saved plans once authentication exists. */}
        Future phases may add accounts, neighborhood dashboards, and satellite planning — structure UI
        state so those features can land without rewriting the questionnaire.
      </p>
      <Link
        href="/questionnaire"
        className="inline-flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white"
      >
        Start the questionnaire
      </Link>
    </div>
  );
}
