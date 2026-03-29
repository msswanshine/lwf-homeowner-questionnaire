"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_PLANT_MATURE_SIZE_ORDERING,
  type DefensibleZoneId,
  type PlantMatureDimensionSort,
  type PlantMatureSizeOrdering,
  type PlantSortMode,
  type QuestionnaireAnswers,
  type ScoredPlant,
} from "@/types";
import { groupPlantsByZone, sortScoredPlants } from "@/lib/filterPlants";
import { loadAndScorePlants } from "@/lib/plannerData";
import { loadQuestionnaireAnswers } from "@/lib/localStorage";
import { useMyListPlantIds } from "@/lib/useMyListPlantIds";
import { PlantApiError } from "@/lib/plantApi";
import { MyListProvider } from "./MyListProvider";
import { PlantCard } from "./PlantCard";
import { PlantResultsPrintTables } from "./PlantResultsPrintTables";
import { ResultsMyPlan } from "./ResultsMyPlan";

const ZONE_LABEL: Record<string, string> = {
  zone0: "Zone 0 — 0 to 5 ft",
  zone1: "Zone 1 — 5 to 30 ft",
  zone2: "Zone 2 — 30 to 100 ft",
};

const INITIAL_ZONE_EXPANDED: Record<DefensibleZoneId, boolean> = {
  zone0: false,
  zone1: false,
  zone2: false,
};

export function PlantResultsView() {
  const router = useRouter();
  const myListIds = useMyListPlantIds();
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  /** Filtered/scored list from the API; sorting is applied in a memo (no re-fetch on sort change). */
  const [scoredPlants, setScoredPlants] = useState<ScoredPlant[]>([]);
  const [sort, setSort] = useState<PlantSortMode>("fireThenAesthetic");
  const [sizeOrdering, setSizeOrdering] = useState<PlantMatureSizeOrdering>(
    () => ({ ...DEFAULT_PLANT_MATURE_SIZE_ORDERING }),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [zoneExpanded, setZoneExpanded] =
    useState<Record<DefensibleZoneId, boolean>>(INITIAL_ZONE_EXPANDED);

  useEffect(() => {
    const saved = loadQuestionnaireAnswers();
    if (!saved) {
      router.replace("/questionnaire");
      return;
    }
    setAnswers(saved);
  }, [router]);

  useEffect(() => {
    if (!answers) return;
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const next = await loadAndScorePlants(answers);
        if (!cancelled) {
          setScoredPlants(next);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof PlantApiError
              ? `${e.message} (${e.status})`
              : "Something went wrong loading plants.";
          setError(message);
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [answers, retryToken]);

  const sortedPlants = useMemo(
    () => sortScoredPlants(scoredPlants, sort, sizeOrdering),
    [scoredPlants, sort, sizeOrdering],
  );

  const grouped = useMemo(() => groupPlantsByZone(sortedPlants), [sortedPlants]);

  const myPlanPlantsForPrint = useMemo(() => {
    const byId = new Map(scoredPlants.map((p) => [p.id, p]));
    const out: ScoredPlant[] = [];
    for (const id of myListIds) {
      const p = byId.get(id);
      if (p) out.push(p);
    }
    return out;
  }, [myListIds, scoredPlants]);

  if (!answers) {
    return (
      <div className="px-4 py-16 text-center text-sm text-[var(--muted)]">Loading your answers…</div>
    );
  }

  return (
    <MyListProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 print:max-w-none print:px-2 print:py-3">
        <ResultsMyPlan scoredPlants={scoredPlants} />
        <header className="space-y-3 print:hidden">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
          Plant list
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Recommended plants</h1>
        <p className="max-w-3xl text-base text-[var(--muted)]">
          Filtered from the Living with Fire catalog for your zones, water posture, and maintenance
          capacity. Fire performance stays primary—tweak sort order to explore tradeoffs.
        </p>
        {answers.ashlandAreaResident ? (
          <p className="max-w-3xl rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-[var(--foreground)]">
            <span className="font-semibold text-amber-900">Ashland-area filter is on.</span>{" "}
            You indicated you live in the Ashland area, so we apply City of Ashland program rules from the
            catalog (a much smaller eligible set than the wider Rogue Valley or region). Counts also reflect
            our planner sample and your other answers—not the entire database.
          </p>
        ) : null}
        <div className="max-w-3xl rounded-2xl border border-black/10 bg-[var(--accent-soft)]/50 px-4 py-3 text-sm text-[var(--foreground)]">
          <p className="font-semibold text-[var(--accent-strong)]">How to use the plant cards</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-[var(--muted)]">
            <li>
              <span className="text-[var(--foreground)]">Hover a card</span> to flip it and see water, care,
              wildlife, and deer notes. With the card focused, you can also press{" "}
              <span className="text-[var(--foreground)]">Enter</span> or{" "}
              <span className="text-[var(--foreground)]">Space</span> to toggle the flip.
            </li>
            <li>
              On the back, use <span className="text-[var(--foreground)]">Learn more</span> for the full
              Living with Fire attribute list in a popup.
            </li>
            <li>
              Move the pointer off the card (or toggle with the keyboard) to return to the photo. Use{" "}
              <span className="text-[var(--foreground)]">Print / save as PDF</span> below for a compact
              table—if you have plants in <span className="text-[var(--foreground)]">My Plan</span>, the
              printout lists those selections (otherwise all recommendations).
            </li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {status === "ready"
              ? `${sortedPlants.length} plants recommended for your property`
              : status === "loading"
                ? "Loading plants from the open catalog…"
                : status === "error"
                  ? "We could not load recommendations."
                  : "Preparing recommendations…"}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:min-w-[11rem]">
              Sort by
              <select
                className="mt-1 min-h-11 rounded-full border border-black/15 bg-white px-4 text-sm font-medium text-[var(--foreground)] shadow-sm"
                value={sort}
                onChange={(e) => setSort(e.target.value as PlantSortMode)}
                disabled={status === "loading"}
              >
                <option value="fireThenAesthetic">Fire performance</option>
                <option value="water">Water use</option>
                <option value="maintenance">Care score</option>
                <option value="deerResistance">Deer resistance</option>
                <option value="pollinatorFriendly">Pollinator friendly</option>
                <option value="birdFriendly">Bird friendly</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:min-w-[12rem]">
              Mature height (catalog ft)
              <select
                className="mt-1 min-h-11 rounded-full border border-black/15 bg-white px-4 text-sm font-medium text-[var(--foreground)] shadow-sm"
                value={sizeOrdering.height}
                onChange={(e) =>
                  setSizeOrdering((prev) => ({
                    ...prev,
                    height: e.target.value as PlantMatureDimensionSort,
                  }))
                }
                disabled={status === "loading"}
              >
                <option value="none">Don’t order by height</option>
                <option value="minAsc">Min height — shortest first</option>
                <option value="maxDesc">Max height — tallest first</option>
              </select>
            </label>
            <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:min-w-[12rem]">
              Mature width (catalog ft)
              <select
                className="mt-1 min-h-11 rounded-full border border-black/15 bg-white px-4 text-sm font-medium text-[var(--foreground)] shadow-sm"
                value={sizeOrdering.width}
                onChange={(e) =>
                  setSizeOrdering((prev) => ({
                    ...prev,
                    width: e.target.value as PlantMatureDimensionSort,
                  }))
                }
                disabled={status === "loading"}
              >
                <option value="none">Don’t order by width</option>
                <option value="minAsc">Min width — narrowest first</option>
                <option value="maxDesc">Max width — widest first</option>
              </select>
            </label>
          </div>
        </div>
        <p className="text-xs text-[var(--muted)] print:hidden">
          With both height and width set, ordering uses height first, then width. &quot;Sort by&quot; breaks
          any remaining ties.
        </p>
      </header>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-900 print:hidden"
          role="alert"
        >
          <p className="font-semibold">Plant API unavailable</p>
          <p className="mt-2">{error}</p>
          <button
            type="button"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-red-700 px-5 text-sm font-semibold text-white"
            onClick={() => setRetryToken((t) => t + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-40 animate-pulse rounded-xl bg-[var(--surface-2)]"
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {status === "ready" ? (
        <>
          <div className="space-y-8 print:hidden">
            {(["zone0", "zone1", "zone2"] as const).map((zone) => {
              const list = grouped[zone];
              if (!list.length) return null;
              return (
                <section key={zone} className="space-y-3">
                  <div className="rounded-2xl border border-black/10 bg-[var(--surface)] p-4">
                    <button
                      type="button"
                      id={`results-zone-heading-${zone}`}
                      aria-expanded={zoneExpanded[zone]}
                      aria-controls={`results-zone-panel-${zone}`}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg text-left text-lg font-semibold text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
                      onClick={() =>
                        setZoneExpanded((prev) => ({ ...prev, [zone]: !prev[zone] }))
                      }
                    >
                      <span>
                        {ZONE_LABEL[zone]} ({list.length})
                      </span>
                      <span
                        className={`inline-flex shrink-0 text-[var(--muted)] transition-transform duration-300 ease-out ${
                          zoneExpanded[zone] ? "rotate-0" : "rotate-180"
                        }`}
                        aria-hidden
                      >
                        <svg
                          width={22}
                          height={22}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.25}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="block"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>
                    <div
                      id={`results-zone-panel-${zone}`}
                      role="region"
                      aria-labelledby={`results-zone-heading-${zone}`}
                      className="results-zone-panel"
                      data-expanded={zoneExpanded[zone] ? "true" : "false"}
                    >
                      <div
                        className="results-zone-panel-inner"
                        {...(!zoneExpanded[zone] ? { inert: true } : {})}
                      >
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {list.map((plant, plantIdx) => (
                            <PlantCard key={`${zone}-${plant.id ?? "na"}-${plantIdx}`} plant={plant} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
          <PlantResultsPrintTables grouped={grouped} myPlanPlants={myPlanPlantsForPrint} />
        </>
      ) : null}

      <div className="flex flex-wrap gap-3 print:hidden">
        <a
          className="inline-flex min-h-11 min-w-44 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          href="/action-plan"
        >
          Continue to action plan
        </a>
        <button
          type="button"
          className="inline-flex min-h-11 min-w-44 items-center justify-center rounded-full border border-black/15 bg-white px-6 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          onClick={() => window.print()}
        >
          Print / save as PDF
        </button>
      </div>
      </div>
    </MyListProvider>
  );
}
