/**
 * Cached view of GET /attributes/hierarchical for attribute UUIDs and value IDs.
 * Keep {@link PLANNER_BULK_ATTRIBUTE_NAMES} aligned with filter/scoring in filterPlants.ts (+ Habit/Form).
 */

import type { LightPreferenceId, QuestionnaireAnswers, UsdaZone } from "@/types";

const PLANT_API_BASE =
  process.env.NEXT_PUBLIC_PLANT_API_BASE ?? "https://lwf-api.vercel.app/api/v2";
const ATTR_URL = `${PLANT_API_BASE}/attributes/hierarchical`;

const REGISTRY_TTL_MS = 3600 * 1000;

/** Attribute display names required for planner bulk + scoring (see filterPlants ATTR). */
export const PLANNER_BULK_ATTRIBUTE_NAMES = [
  "List Choice",
  "Home Ignition Zone (HIZ)",
  "Water Amount",
  "Character Score",
  "<2 ft tall",
  "Risk Reduction Notes - Best Practices",
  "Climate List Choice",
  "Light Needs",
  "Hardiness Zone",
  "Benefits",
  "Deer Resistance",
  "Growth List Choice",
  "Ashland",
  "Min Mature Height",
  "Max Mature Height",
  "Min Mature Width",
  "Max Mature Width",
  "Habit/Form",
] as const;

interface ValuesAllowedRow {
  id: string;
  displayName?: string | null;
}
interface HierarchicalNode {
  id: string;
  name: string;
  children?: HierarchicalNode[];
  valuesAllowed?: ValuesAllowedRow[];
}

interface HierarchicalResponse {
  data: HierarchicalNode[];
}

function walkNodes(nodes: HierarchicalNode[], fn: (n: HierarchicalNode) => void): void {
  for (const n of nodes) {
    fn(n);
    const ch = n.children;
    if (ch?.length) walkNodes(ch, fn);
  }
}

function valueRawIdByDisplay(node: HierarchicalNode | undefined, display: string): string | undefined {
  if (!node?.valuesAllowed?.length) return undefined;
  const want = display.trim();
  for (const row of node.valuesAllowed) {
    if (String(row.displayName ?? "").trim() === want) return String(row.id);
  }
  return undefined;
}

export interface LwfAttributeRegistry {
  /** First occurrence wins when duplicate names exist elsewhere in the tree. */
  nameToNode: ReadonlyMap<string, HierarchicalNode>;
  loadedAt: number;
}

let cached: LwfAttributeRegistry | null = null;
let inflight: Promise<LwfAttributeRegistry> | null = null;

async function fetchHierarchical(): Promise<LwfAttributeRegistry> {
  const response = await fetch(ATTR_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`LWF attributes/hierarchical failed: ${response.status} ${response.statusText}`);
  }
  const json = (await response.json()) as HierarchicalResponse;
  const roots = json.data ?? [];
  const nameToNode = new Map<string, HierarchicalNode>();
  walkNodes(roots, (n) => {
    if (n.name && !nameToNode.has(n.name)) nameToNode.set(n.name, n);
  });
  return { nameToNode, loadedAt: Date.now() };
}

/**
 * Returns cached hierarchical index, refreshing after {@link REGISTRY_TTL_MS}.
 */
export async function getLwfAttributeRegistry(): Promise<LwfAttributeRegistry> {
  const now = Date.now();
  if (cached !== null && now - cached.loadedAt < REGISTRY_TTL_MS) {
    return cached;
  }
  if (inflight) return inflight;
  inflight = fetchHierarchical()
    .then((r) => {
      cached = r;
      inflight = null;
      return r;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
}

/**
 * Distinct attribute UUIDs for GET /values/bulk?attributeIds= (planner slice).
 */
export async function getPlannerBulkAttributeIdsCsv(): Promise<string> {
  const reg = await getLwfAttributeRegistry();
  const ids: string[] = [];
  for (const name of PLANNER_BULK_ATTRIBUTE_NAMES) {
    const id = reg.nameToNode.get(name)?.id;
    if (id) ids.push(id);
  }
  return [...new Set(ids)].join(",");
}

const LIGHT_PREF_TO_DISPLAY: Record<LightPreferenceId, string> = {
  fullSun: "Full Sun",
  partSunShade: "Part Sun/Part Shade",
  shade: "Shade",
};

/**
 * Builds `filterByValue` query params (`attributeUuid:rawValueId`).
 * Same attribute, repeated params → OR; different attributes → AND.
 * Omits dimensions that cannot be expressed (Ashland exclusions, pollinators, etc.).
 */
export async function buildListFiltersFromAnswers(answers: QuestionnaireAnswers): Promise<string[]> {
  const reg = await getLwfAttributeRegistry();
  const out: string[] = [];

  const hzNode = reg.nameToNode.get("Hardiness Zone");
  if (answers.usdaZone && hzNode) {
    const raw = valueRawIdByDisplay(hzNode, answers.usdaZone);
    if (raw) out.push(`${hzNode.id}:${raw}`);
  }

  const lightNode = reg.nameToNode.get("Light Needs");
  if (answers.lightPreferences.length > 0 && lightNode) {
    for (const lp of answers.lightPreferences) {
      const disp = LIGHT_PREF_TO_DISPLAY[lp];
      const raw = valueRawIdByDisplay(lightNode, disp);
      if (raw) out.push(`${lightNode.id}:${raw}`);
    }
  }

  const hizNode = reg.nameToNode.get("Home Ignition Zone (HIZ)");
  if (answers.defensibleZones.length > 0 && hizNode) {
    const rawIds = new Set<string>();
    for (const z of answers.defensibleZones) {
      if (z === "zone1") {
        rawIds.add("01"); // 0-5 ft band
      } else if (z === "zone2") {
        rawIds.add("02"); // 5-10
        rawIds.add("03"); // 10-30
      } else if (z === "zone3") {
        rawIds.add("04"); // 30-100
        rawIds.add("05"); // 50-100
      }
    }
    for (const r of rawIds) out.push(`${hizNode.id}:${r}`);
  }

  const waterNode = reg.nameToNode.get("Water Amount");
  if (answers.waterPreference && waterNode) {
    if (answers.waterPreference === "drought") {
      for (const r of ["03", "04", "05"]) {
        out.push(`${waterNode.id}:${r}`);
      }
    } else if (answers.waterPreference === "low") {
      for (const r of ["02", "03", "04", "05"]) {
        out.push(`${waterNode.id}:${r}`);
      }
    }
  }

  const deerNode = reg.nameToNode.get("Deer Resistance");
  if (answers.deerResistance === "must" && deerNode) {
    out.push(`${deerNode.id}:04`, `${deerNode.id}:05`);
  }

  return out;
}

/** Map USDA zone display digit to raw value id (for tests / diagnostics). */
export async function hardinessRawIdForUsda(zone: UsdaZone): Promise<string | undefined> {
  const reg = await getLwfAttributeRegistry();
  const node = reg.nameToNode.get("Hardiness Zone");
  return valueRawIdByDisplay(node, zone);
}
