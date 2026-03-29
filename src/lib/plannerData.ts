/**
 * Composes API loading with filtering for results / action plan / print flows.
 */

import {
  DEFAULT_PLANT_MATURE_SIZE_ORDERING,
  type PlantDetail,
  type QuestionnaireAnswers,
  type PlantSortMode,
  type ScoredPlant,
} from "@/types";
import { filterAndScorePlants, sortScoredPlants } from "@/lib/filterPlants";
import { PlantApiError } from "@/lib/plantApi";

/** Planner payload size matches `PLANNER_CATALOG_OPTIONS` in `app/api/planner-catalog/route.ts`. */
const PLANNER_CATALOG_PATH = "/api/planner-catalog";

async function fetchPlannerCatalogDetails(answers: QuestionnaireAnswers): Promise<PlantDetail[]> {
  const res = await fetch(PLANNER_CATALOG_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (typeof body.error === "string") message = body.error;
    } catch {
      /* ignore */
    }
    throw new PlantApiError(message || "Planner catalog request failed", res.status, PLANNER_CATALOG_PATH);
  }
  return (await res.json()) as PlantDetail[];
}

/**
 * Fetches a bounded slice of the catalog and scores against the questionnaire (no sort).
 * Call {@link sortScoredPlants} in the UI so changing sort does not re-hit the network.
 */
export async function loadAndScorePlants(
  answers: QuestionnaireAnswers,
): Promise<ScoredPlant[]> {
  const details = await fetchPlannerCatalogDetails(answers);
  return filterAndScorePlants(details, answers);
}

/**
 * Fetches a bounded slice of the catalog, filters to questionnaire inputs, and sorts.
 */
export async function buildRecommendations(
  answers: QuestionnaireAnswers,
  sort: PlantSortMode = "fireThenAesthetic",
): Promise<ScoredPlant[]> {
  const scored = await loadAndScorePlants(answers);
  return sortScoredPlants(scored, sort, DEFAULT_PLANT_MATURE_SIZE_ORDERING);
}
