import Link from "next/link";
import { HeaderMyPlanNavButton } from "./HeaderMyPlanNavButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/questionnaire", label: "Questionnaire" },
  { href: "/results", label: "Plant list" },
  { href: "/action-plan", label: "Action plan" },
] as const;

export function SiteHeader() {
  return (
    <header className="print:hidden border-b border-black/10 bg-[var(--surface)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 w-full items-center justify-between gap-3 sm:w-auto sm:max-w-none sm:justify-start sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg" aria-hidden>
              🔥
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[var(--foreground)]">FireWise Planner</p>
              <p className="text-xs text-[var(--muted)]">Pacific Northwest homeowner MVP</p>
            </div>
          </div>
          <a
            href="http://localhost:5173/"
            target="_blank"
            rel="noopener noreferrer"
            title="Open local admin (port 5173)"
            className="inline-flex shrink-0 min-h-10 items-center rounded-md border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent-strong)] shadow-sm hover:border-[var(--accent-strong)] hover:bg-[var(--surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          >
            Admin
          </a>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-2 sm:justify-end">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-10 items-center rounded-full border border-transparent px-3 text-sm font-medium text-[var(--foreground)] hover:border-black/10 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
            >
              {l.label}
            </Link>
          ))}
          <HeaderMyPlanNavButton />
        </nav>
      </div>
    </header>
  );
}
