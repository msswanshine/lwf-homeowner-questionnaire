import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import type { PlantDetail } from "@/types";
import { loadPlantsForPlanning } from "@/lib/plantApi";

/** Keep in sync with {@link PLANNER_CATALOG_PATH} usage in plannerData.ts (invalidates CDN/cache when tuning). */
const PLANNER_CATALOG_OPTIONS = {
  /** Larger slice so Ashland-area filtering still leaves enough candidates after exclusions. */
  maxPlants: 400,
  listPageSize: 40,
  /** /values/bulk plantIds=… chunk size (URL length vs. row limit per request). */
  bulkPlantChunkSize: 80,
  /** Per bulk request; must cover ~all values (some plants have 100+ rows). */
  bulkValueRowLimit: 50_000,
} as const;

const CACHE_TAG = "planner-catalog-v4-400-plants";

async function loadCatalogUncached(): Promise<PlantDetail[]> {
  return loadPlantsForPlanning({
    maxPlants: PLANNER_CATALOG_OPTIONS.maxPlants,
    listPageSize: PLANNER_CATALOG_OPTIONS.listPageSize,
    bulkPlantChunkSize: PLANNER_CATALOG_OPTIONS.bulkPlantChunkSize,
    bulkValueRowLimit: PLANNER_CATALOG_OPTIONS.bulkValueRowLimit,
    listIncludeImages: true,
  });
}

const getCachedPlannerCatalog = unstable_cache(
  loadCatalogUncached,
  [CACHE_TAG],
  { revalidate: 3600, tags: [CACHE_TAG] },
);

/**
 * Bundles the planner slice of the LWF catalog on the server.
 * Cached ~1h so repeat /results loads are one hop to this app, not dozens to lwf-api.
 */
export async function GET() {
  try {
    const data = await getCachedPlannerCatalog();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load planner catalog";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
