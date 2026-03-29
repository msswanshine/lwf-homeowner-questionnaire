import { NextResponse } from "next/server";
import type { PlantDetail, QuestionnaireAnswers } from "@/types";
import { buildListFiltersFromAnswers } from "@/lib/lwfAttributeRegistry";
import { loadPlantsForPlanning } from "@/lib/plantApi";

/** Keep in sync with {@link PLANNER_CATALOG_PATH} usage in plannerData.ts (invalidates CDN/cache when tuning). */
const PLANNER_CATALOG_OPTIONS = {
  /** Larger slice so Ashland-area filtering still leaves enough candidates after exclusions. */
  maxPlants: 400,
  /** LWF list `limit` max is 1000; larger pages reduce round-trips for unfiltered parallel load. */
  listPageSize: 400,
  /** /values/bulk plantIds=… chunk size (URL length vs. row limit per request). */
  bulkPlantChunkSize: 80,
  /** Per bulk request; must cover ~all values (some plants have 100+ rows). */
  bulkValueRowLimit: 50_000,
} as const;

const CACHE_TTL_MS = 3600 * 1000;

async function loadCatalogUncached(filterByValue?: string[]): Promise<PlantDetail[]> {
  return loadPlantsForPlanning({
    maxPlants: PLANNER_CATALOG_OPTIONS.maxPlants,
    listPageSize: PLANNER_CATALOG_OPTIONS.listPageSize,
    bulkPlantChunkSize: PLANNER_CATALOG_OPTIONS.bulkPlantChunkSize,
    bulkValueRowLimit: PLANNER_CATALOG_OPTIONS.bulkValueRowLimit,
    listIncludeImages: true,
    ...(filterByValue?.length ? { filterByValue } : {}),
  });
}

/**
 * In-memory cache only: Next.js `unstable_cache` persists to the data cache with a ~2MB limit;
 * this planner JSON is much larger, so we TTL-cache in the server process instead (same ~1h idea).
 */
let memoryCache: { data: PlantDetail[]; expiresAt: number } | null = null;
let memoryCacheInflight: Promise<PlantDetail[]> | null = null;

const filteredCache = new Map<string, { data: PlantDetail[]; expiresAt: number }>();
const filteredInflight = new Map<string, Promise<PlantDetail[]>>();

function filterCacheKey(filters: string[]): string {
  return [...filters].sort().join("|");
}

async function getFilteredPlannerCatalog(filters: string[]): Promise<PlantDetail[]> {
  const key = filterCacheKey(filters);
  const now = Date.now();
  const hit = filteredCache.get(key);
  if (hit !== undefined && hit.expiresAt > now) return hit.data;

  let inflight = filteredInflight.get(key);
  if (!inflight) {
    inflight = loadCatalogUncached(filters)
      .then((data) => {
        filteredCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
        filteredInflight.delete(key);
        return data;
      })
      .catch((e) => {
        filteredInflight.delete(key);
        throw e;
      });
    filteredInflight.set(key, inflight);
  }
  return inflight;
}

async function getPlannerCatalogMemoryCached(): Promise<PlantDetail[]> {
  const now = Date.now();
  if (memoryCache !== null && memoryCache.expiresAt > now) {
    return memoryCache.data;
  }
  if (memoryCacheInflight) return memoryCacheInflight;

  memoryCacheInflight = loadCatalogUncached()
    .then((data) => {
      memoryCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      memoryCacheInflight = null;
      return data;
    })
    .catch((e) => {
      memoryCacheInflight = null;
      throw e;
    });

  return memoryCacheInflight;
}

/**
 * Bundles the planner slice of the LWF catalog on the server.
 * Process memory TTL ~1h; HTTP Cache-Control still encourages CDN/browser caching.
 */
export async function GET() {
  try {
    const data = await getPlannerCatalogMemoryCached();
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

/**
 * Questionnaire-driven catalog: server-side `filterByValue` plus slim bulk hydration.
 * Cached in-process with the same TTL as GET (keyed by sorted filter tuple).
 */
export async function POST(req: Request) {
  try {
    const bodyUnknown: unknown = await req.json().catch(() => null);
    const body = bodyUnknown as { answers?: QuestionnaireAnswers } | null;
    const answers = body?.answers;
    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Request body must include answers" }, { status: 400 });
    }

    const filterByValue = await buildListFiltersFromAnswers(answers);
    const data =
      filterByValue.length > 0
        ? await getFilteredPlannerCatalog(filterByValue)
        : await getPlannerCatalogMemoryCached();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load planner catalog";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
