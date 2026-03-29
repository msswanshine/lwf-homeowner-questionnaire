"use client";

import { usePathname } from "next/navigation";
import { FW_OPEN_MY_PLAN_EVENT } from "@/lib/localStorage";
import { useMyListPlantIds } from "@/lib/useMyListPlantIds";

export function HeaderMyPlanNavButton() {
  const pathname = usePathname();
  const myListIds = useMyListPlantIds();

  if (pathname !== "/results") return null;

  const count = myListIds.length;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(FW_OPEN_MY_PLAN_EVENT))}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-[var(--accent-soft)]/80 px-3 text-sm font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
      aria-haspopup="dialog"
      aria-controls="fw-results-my-plan-dialog"
    >
      My Plan
      {count > 0 ? (
        <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-white/90 px-1.5 text-xs font-bold text-[var(--accent-strong)]">
          {count}
        </span>
      ) : null}
    </button>
  );
}
