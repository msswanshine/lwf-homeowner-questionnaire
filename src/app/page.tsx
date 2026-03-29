import Link from "next/link";
import { LandingActions } from "@/components/home/LandingActions";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid gap-8 lg:grid-cols-[3fr_2fr] lg:items-center">
        <div className="space-y-6">
          <p className="inline-flex items-center rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
            Open source · Client-side MVP
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
            Plan a fire-wise yard without a botany degree.
          </h1>
          <p className="text-lg text-[var(--muted)]">
            FireWise Landscape Planner walks Pacific Northwest homeowners through a friendly
            questionnaire, queries the public{" "}
            <a
              className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              href="https://lwf-api.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              Living with Fire plant API
            </a>
            , and returns ranked recommendations plus a phased action checklist you can print or hand
            to a landscaper.
          </p>
          <LandingActions />
          <p className="text-sm text-[var(--muted)]">
            No accounts, no server — your answers stay in this browser&apos;s local storage unless you
            clear them.
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-[var(--surface)] p-8 shadow-lg">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What you&apos;ll get</h2>
          <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
            <li>Seven short sections with clear validation and a final review screen.</li>
            <li>Plant cards grouped by defensible space zone with fire-performance badges.</li>
            <li>An accordion action plan with savable checkboxes and a print-to-PDF workflow.</li>
          </ul>
          <div className="mt-6 rounded-2xl bg-[var(--surface-2)] p-4 text-sm text-[var(--foreground)]">
            <p className="font-semibold">Before you begin</p>
            <p className="mt-2 text-[var(--muted)]">
              Have a rough sense of your USDA zone, which defensible-space rings you&apos;re working on,
              and how much maintenance time you can sustain seasonally. See this link for more information (opens in new tab): 
              <a className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline" href="https://wfca.com/wildfire-articles/firewise-defensible-space/" target="_blank" rel="noreferrer">https://wfca.com/wildfire-articles/firewise-defensible-space/</a>
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8 text-sm text-[var(--muted)]">
        <p>
          Fork-friendly MVP — read{" "}
          <Link
            className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
            href="/about"
          >
            About &amp; contribute
          </Link>{" "}
          for open source expectations and architecture.
        </p>
      </section>
    </div>
  );
}
