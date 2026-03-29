"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ScoredPlant } from "@/types";
import { FW_OPEN_MY_PLAN_EVENT } from "@/lib/localStorage";
import { useMyListIds } from "./MyListProvider";
import { PlantCard } from "./PlantCard";

/** Past this scroll offset, show the floating My Plan control (header control covers the top of the page). */
const FLOATING_MY_PLAN_SCROLL_PX = 88;

export function ResultsMyPlan({ scoredPlants }: { scoredPlants: ScoredPlant[] }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const myListIds = useMyListIds();

  const byId = useMemo(() => {
    const m = new Map<string, ScoredPlant>();
    for (const p of scoredPlants) m.set(p.id, p);
    return m;
  }, [scoredPlants]);

  const myPlanPlants = useMemo(() => {
    const out: ScoredPlant[] = [];
    for (const id of myListIds) {
      const p = byId.get(id);
      if (p) out.push(p);
    }
    return out;
  }, [byId, myListIds]);

  const openDialog = useCallback(() => {
    const el = dialogRef.current;
    if (el && !el.open) {
      el.showModal();
      setDialogOpen(true);
    }
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onDialogClose = () => setDialogOpen(false);
    el.addEventListener("close", onDialogClose);
    return () => el.removeEventListener("close", onDialogClose);
  }, []);

  useEffect(() => {
    const onOpenRequest = () => openDialog();
    window.addEventListener(FW_OPEN_MY_PLAN_EVENT, onOpenRequest);
    return () => window.removeEventListener(FW_OPEN_MY_PLAN_EVENT, onOpenRequest);
  }, [openDialog]);

  useEffect(() => {
    const onScroll = () => setShowFloatingButton(window.scrollY > FLOATING_MY_PLAN_SCROLL_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = myListIds.length;

  return (
    <>
      {showFloatingButton ? (
        <button
          type="button"
          onClick={openDialog}
          className="fixed top-4 right-[24px] z-40 inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] shadow-md backdrop-blur-sm print:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          aria-haspopup="dialog"
          aria-controls="fw-results-my-plan-dialog"
          aria-expanded={dialogOpen}
        >
          My Plan
          {count > 0 ? (
            <span className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-[var(--accent-soft)] px-1.5 text-xs font-bold text-[var(--accent-strong)]">
              {count}
            </span>
          ) : null}
        </button>
      ) : null}

      <dialog
        id="fw-results-my-plan-dialog"
        ref={dialogRef}
        className="my-plan-dialog text-[var(--foreground)] print:hidden"
        aria-labelledby={titleId}
      >
        <div className="flex h-full max-h-[100dvh] flex-col bg-[var(--surface)] shadow-2xl">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/10 px-4 py-3 sm:px-6">
            <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">
              My Plan
            </h2>
            <button
              type="button"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
              onClick={closeDialog}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {myListIds.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-base text-[var(--muted)]">
                No plants added yet. Select some plants and start planting!
              </p>
            ) : myPlanPlants.length === 0 ? (
              <p className="mx-auto max-w-md text-center text-base text-[var(--muted)]">
                Your saved plants are not in the current recommendations. When results finish loading, reopen
                My Plan—or add plants from the cards below.
              </p>
            ) : (
              <div className="mx-auto grid w-full max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myPlanPlants.map((plant, idx) => (
                  <PlantCard key={`my-plan-${plant.id}-${idx}`} plant={plant} fromMyPlan />
                ))}
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
