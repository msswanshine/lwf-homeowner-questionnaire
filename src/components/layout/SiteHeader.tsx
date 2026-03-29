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
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-lg" aria-hidden>
            🔥
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--foreground)]">FireWise Planner</p>
            <p className="text-xs text-[var(--muted)]">Pacific Northwest homeowner MVP</p>
          </div>
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
