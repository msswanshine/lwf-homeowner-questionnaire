/**
 * Gateway for Living with Fire plant API. All HTTP access to the remote API
 * should go through this module (not directly from React components).
 *
 * Base URL per public docs: https://lwf-api.vercel.app/api/v2
 */

import type {
  PlantDetail,
  PlantDetailResponse,
  PlantListItem,
  PlantValue,
  PlantsListResponse,
} from "@/types";

export const PLANT_API_BASE =
  process.env.NEXT_PUBLIC_PLANT_API_BASE ?? "https://lwf-api.vercel.app/api/v2";

export class PlantApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, status: number, url: string) {
    super(message);
    this.name = "PlantApiError";
    this.status = status;
    this.url = url;
  }
}

const plantDetailCache = new Map<string, PlantDetail>();
/** One entry per list query (offset/limit etc.) so parallel list pages don’t clobber each other. */
const listResponseCache = new Map<string, PlantsListResponse>();

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path.startsWith("http") ? path : `${PLANT_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/**
 * Performs a GET request and parses JSON, throwing {@link PlantApiError} on failure.
 */
async function getJson<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = buildUrl(path, query);
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new PlantApiError("Network error: could not reach plant API", 0, url);
  }
  if (!response.ok) {
    throw new PlantApiError(`Plant API error: ${response.statusText}`, response.status, url);
  }
  return (await response.json()) as T;
}

/**
 * Lightweight reachability check — requests the API root HTML (not `/api/v2`).
 * Returns true if any HTTP 2xx/3xx response is observed.
 */
export async function checkPlantSiteReachable(): Promise<boolean> {
  const root = new URL(PLANT_API_BASE).origin;
  try {
    const res = await fetch(root, { method: "HEAD", cache: "no-store" });
    return res.ok || res.status === 304;
  } catch {
    try {
      const res = await fetch(root, { cache: "no-store" });
      return res.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Paginated plant list (summary fields only). Responses are cached per query key for the session.
 */
export async function listPlants(options: {
  limit?: number;
  offset?: number;
  includeImages?: boolean;
  search?: string;
}): Promise<PlantsListResponse> {
  const cacheKey = JSON.stringify(options);
  const hit = listResponseCache.get(cacheKey);
  if (hit) return hit;

  const data = await getJson<PlantsListResponse>("/plants", {
    limit: options.limit ?? 40,
    offset: options.offset ?? 0,
    includeImages: options.includeImages ?? true,
    search: options.search,
  });
  listResponseCache.set(cacheKey, data);
  return data;
}

/**
 * Full plant payload including resolved attribute values (one request per plant).
 * Cached in-memory for the browser session to avoid duplicate calls.
 */
export async function getPlantById(id: string): Promise<PlantDetail> {
  const hit = plantDetailCache.get(id);
  if (hit) return hit;
  const { data } = await getJson<PlantDetailResponse>(`/plants/${id}`);
  plantDetailCache.set(id, data);
  return data;
}

/** One row from GET /values/bulk?resolve=true (shape matches plant value rows minus top-level plantId/attributeId). */
interface BulkValueRow {
  id: string;
  value: string;
  attributeName: string;
  resolved?: {
    id?: string;
    value?: unknown;
    raw?: unknown;
    type?: string;
    description?: string;
  } | null;
}

type BulkValuesByPlant = Record<string, Record<string, BulkValueRow[]>>;

interface BulkValuesResponse {
  data: { values: BulkValuesByPlant };
}

function normalizeResolvedForPlantValue(
  resolved: BulkValueRow["resolved"],
): PlantValue["resolved"] {
  if (!resolved) return null;
  const val = resolved.value;
  const value: string | number | boolean =
    typeof val === "string" || typeof val === "number" || typeof val === "boolean"
      ? val
      : val === null || val === undefined
        ? ""
        : String(val);
  return {
    ...(resolved.id !== undefined ? { id: String(resolved.id) } : {}),
    value,
    ...(resolved.raw !== undefined && resolved.raw !== null
      ? { raw: String(resolved.raw) }
      : {}),
    ...(resolved.type !== undefined ? { type: resolved.type } : {}),
    ...(resolved.description !== undefined
      ? { description: resolved.description }
      : {}),
  };
}

function bulkRowToPlantValue(plantId: string, attributeId: string, row: BulkValueRow): PlantValue {
  return {
    id: row.id,
    attributeId,
    attributeName: row.attributeName,
    plantId,
    rawValue: String(row.value ?? ""),
    resolved: normalizeResolvedForPlantValue(row.resolved),
  };
}

function flattenBulkToPlantValues(
  plantId: string,
  byAttribute: Record<string, BulkValueRow[]> | undefined,
): PlantValue[] {
  if (!byAttribute) return [];
  const out: PlantValue[] = [];
  for (const [attributeId, rows] of Object.entries(byAttribute)) {
    for (const row of rows) {
      out.push(bulkRowToPlantValue(plantId, attributeId, row));
    }
  }
  return out;
}

function mergeBulkFragments(into: BulkValuesByPlant, fragment: BulkValuesByPlant): void {
  for (const [plantId, attrs] of Object.entries(fragment)) {
    if (!into[plantId]) {
      into[plantId] = { ...attrs };
      continue;
    }
    const target = into[plantId];
    for (const [attrId, rows] of Object.entries(attrs)) {
      target[attrId] = rows;
    }
  }
}

/**
 * Resolved attribute values for many plants in one or a few HTTP calls (see /values/bulk).
 */
async function fetchBulkResolvedValues(
  plantIds: string[],
  options: { chunkSize: number; rowLimit: number },
): Promise<BulkValuesByPlant> {
  if (plantIds.length === 0) return {};
  const merged: BulkValuesByPlant = {};
  const { chunkSize, rowLimit } = options;

  for (let i = 0; i < plantIds.length; i += chunkSize) {
    const chunk = plantIds.slice(i, i + chunkSize);
    const { data } = await getJson<BulkValuesResponse>("/values/bulk", {
      plantIds: chunk.join(","),
      resolve: true,
      limit: rowLimit,
    });
    mergeBulkFragments(merged, data.values ?? {});
  }

  return merged;
}

function listItemToPlantDetail(item: PlantListItem, values: PlantValue[]): PlantDetail {
  return {
    ...item,
    images: item.primaryImage ? [item.primaryImage] : [],
    values,
  };
}

/**
 * Fetches list rows up to `maxPlants`, then hydrates attribute values via `/values/bulk?resolve=true`
 * (replaces one HTTP request per plant).
 */
export async function loadPlantsForPlanning(options: {
  maxPlants: number;
  listPageSize: number;
  /** Plant IDs per bulk request (URL length; default ~80). */
  bulkPlantChunkSize: number;
  /** Max rows per bulk response (catalog plants can have 100+ values each). */
  bulkValueRowLimit: number;
  /** When true, list rows may include `primaryImage` for cards (slightly larger list payload). */
  listIncludeImages?: boolean;
}): Promise<PlantDetail[]> {
  const {
    maxPlants,
    listPageSize,
    bulkPlantChunkSize,
    bulkValueRowLimit,
    listIncludeImages = true,
  } = options;

  const pagesNeeded = Math.max(1, Math.ceil(maxPlants / listPageSize));
  const pages = await Promise.all(
    Array.from({ length: pagesNeeded }, (_, i) =>
      listPlants({
        limit: listPageSize,
        offset: i * listPageSize,
        includeImages: listIncludeImages,
      }),
    ),
  );

  const order: string[] = [];
  const listById = new Map<string, PlantListItem>();
  outer: for (const page of pages) {
    for (const p of page.data) {
      if (listById.has(p.id)) continue;
      if (order.length >= maxPlants) break outer;
      listById.set(p.id, p);
      order.push(p.id);
    }
  }

  const bulkByPlant = await fetchBulkResolvedValues(order, {
    chunkSize: bulkPlantChunkSize,
    rowLimit: bulkValueRowLimit,
  });

  return order.map((id) => {
    const item = listById.get(id)!;
    const values = flattenBulkToPlantValues(id, bulkByPlant[id]);
    return listItemToPlantDetail(item, values);
  });
}

/**
 * Clears in-memory caches (e.g. after “Start over”).
 */
export function clearPlantApiSessionCache() {
  plantDetailCache.clear();
  listResponseCache.clear();
}
