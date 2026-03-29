/**
 * Questionnaire-driven filtering and ranking for plant recommendations.
 * Keeps scoring/heuristics testable and out of UI components.
 *
 * API field names verified against https://lwf-api.vercel.app/plant-fields.json
 */

import {
  DEFAULT_PLANT_MATURE_SIZE_ORDERING,
  type DefensibleZoneId,
  type FireResistanceLabel,
  type LightPreferenceId,
  type PlantDetail,
  type PlantMatureDimensionSort,
  type PlantMatureSizeOrdering,
  type PlantSortMode,
  type QuestionnaireAnswers,
  type ScoredPlant,
  type TopPriority,
} from "@/types";

const ATTR = {
  listChoice: "List Choice",
  hiz: "Home Ignition Zone (HIZ)",
  waterAmount: "Water Amount",
  characterScore: "Character Score",
  shortHeight: "<2 ft tall",
  riskNotes: "Risk Reduction Notes - Best Practices",
  climateRecommend: "Climate List Choice",
  lightNeeds: "Light Needs",
  hardinessZone: "Hardiness Zone",
  benefits: "Benefits",
  deerResistance: "Deer Resistance",
  growthListChoice: "Growth List Choice",
  /** City of Ashland program tags (NW, Weed, PH, …). */
  ashland: "Ashland",
  minMatureHeight: "Min Mature Height",
  maxMatureHeight: "Max Mature Height",
  minMatureWidth: "Min Mature Width",
  maxMatureWidth: "Max Mature Width",
} as const;

/** Maps wizard light IDs to Light Needs `resolved.value` strings from the API. */
const LIGHT_DISPLAY: Record<LightPreferenceId, string> = {
  fullSun: "Full Sun",
  partSunShade: "Part Sun/Part Shade",
  shade: "Shade",
};

/** Skip empty entries and literal "null"/"undefined" strings from the API. */
function isJunkResolvedValue(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") {
    const t = val.trim().toLowerCase();
    return t === "" || t === "null" || t === "undefined";
  }
  return false;
}

function valuesFor(plant: PlantDetail, attributeName: string): string[] {
  const out: string[] = [];
  for (const v of plant.values) {
    if (v.attributeName !== attributeName || !v.resolved) continue;
    const val = v.resolved.value;
    if (isJunkResolvedValue(val)) continue;
    if (typeof val === "string") out.push(val);
    else if (typeof val === "boolean") out.push(val ? "true" : "false");
    else out.push(String(val));
  }
  return out;
}

function numericCharacterScore(plant: PlantDetail): number | null {
  const raw = valuesFor(plant, ATTR.characterScore)[0];
  if (raw === undefined) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Where to place the plant (LWF Character Score bands) — distance from home only.
 */
function lwfPlacementLineFromNumericScore(n: number): string {
  if (n >= 20) return "100+ feet from your home";
  if (n >= 17) return "50+ feet from your home";
  if (n >= 13) return "30+ feet from your home";
  if (n >= 9) return "10–30 feet from your home, spaced apart";
  if (n >= 5) return "10+ feet from your home";
  if (n >= 3) return "5–10 feet from your home";
  if (n >= 1) return "Right next to your home";
  return "—";
}

function buildLwfPlacementSummary(plant: PlantDetail): string | null {
  const n = numericCharacterScore(plant);
  if (n !== null && Number.isFinite(n)) return lwfPlacementLineFromNumericScore(n);
  const raw = valuesFor(plant, ATTR.characterScore)[0]?.trim() ?? "";
  if (!raw) return null;
  const u = raw.toUpperCase();
  if (u === "NW") return "Not for fire-wise planting zones";
  if (u === "NA" || u === "N/A") return "Placement not listed";
  return null;
}

/**
 * Maps API "List Choice" entries to a numeric fire-affinity score (higher is better).
 */
function listChoiceFireScore(display: string): number {
  const v = display.toLowerCase();
  if (v.includes("prefer") || v.includes("recommend")) return 3;
  if (v.includes("consider") || v.includes("agree")) return 2;
  if (v.includes("conflict")) return 1;
  return 2;
}

function fireLabelFromScores(scores: number[]): FireResistanceLabel {
  if (scores.length === 0) return "Medium";
  const best = Math.max(...scores);
  const worst = Math.min(...scores);
  if (worst >= 3 || best >= 3) return "High";
  if (best === 2 && worst >= 2) return "Medium";
  if (worst <= 1 && best <= 1) return "Low";
  return "Medium";
}

function inferZonesFromHiz(hizLabels: string[]): DefensibleZoneId[] {
  const joined = hizLabels.join(" ").toLowerCase();
  const zones = new Set<DefensibleZoneId>();
  if (joined.includes("0-5") || joined.includes("0–5")) zones.add("zone1");
  if (
    joined.includes("5-30") ||
    joined.includes("10-30") ||
    joined.includes("5–30") ||
    joined.includes("10–30")
  )
    zones.add("zone2");
  if (
    joined.includes("30-100") ||
    joined.includes("50-100") ||
    joined.includes("30–100") ||
    joined.includes("50–100")
  )
    zones.add("zone3");
  const short = hizLabels.some((h) => h.includes("<2") || h.includes("2 ft"));
  if (short) zones.add("zone1");
  return [...zones];
}

function plantMatchesDefensibleZones(
  plant: PlantDetail,
  selected: DefensibleZoneId[],
): boolean {
  if (selected.length === 0) return true;
  const hiz = valuesFor(plant, ATTR.hiz);
  const inferred = inferZonesFromHiz(hiz);
  const short = valuesFor(plant, ATTR.shortHeight).some((s) => s === "true");
  if (inferred.length === 0) {
    return selected.includes("zone2") || (selected.includes("zone1") && short);
  }
  return selected.some((z) => inferred.includes(z));
}

function waterMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  const labels = valuesFor(plant, ATTR.waterAmount).map((w) => w.toLowerCase());
  if (labels.length === 0) return true;
  const pref = user.waterPreference;
  if (!pref) return true;
  const joined = labels.join(" ");
  if (pref === "drought") {
    return joined.includes("low") || joined.includes("very low") || joined.includes("xeric");
  }
  if (pref === "low") {
    return (
      joined.includes("low") ||
      joined.includes("moderate") ||
      joined.includes("very low") ||
      joined.includes("xeric")
    );
  }
  return true;
}

function maintenanceMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  const time = user.maintenanceTime;
  if (!time || time === "moderate" || time === "high") return true;
  const score = numericCharacterScore(plant);
  if (score === null) return true;
  if (time === "veryLow" && score >= 8) return false;
  if (time === "low" && score >= 9) return false;
  return true;
}

function hardinessMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  if (!user.usdaZone) return true;
  const zones = valuesFor(plant, ATTR.hardinessZone);
  if (zones.length === 0) return true;
  return zones.some((z) => String(z) === user.usdaZone);
}

/**
 * If the user picked light patterns, require overlap with plant Light Needs when present.
 */
function lightMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  if (user.lightPreferences.length === 0) return true;
  const plantVals = valuesFor(plant, ATTR.lightNeeds);
  if (plantVals.length === 0) return true;
  const wantLabels = user.lightPreferences.map((l) => LIGHT_DISPLAY[l]);
  return wantLabels.some((want) => plantVals.some((pv) => pv === want));
}

function benefitsForPollinator(plant: PlantDetail): boolean {
  const vals = valuesFor(plant, ATTR.benefits);
  return vals.some((v) => /pollinator/i.test(v));
}

/**
 * Pollinator / bird lines for cards and print (from Benefits).
 * Pollinator: "Yes" plus optional "host" / "food"; bird: "Yes" plus optional "food" / "shelter".
 */
function buildWildlifeSummaries(plant: PlantDetail): {
  pollinatorFriendlyLabel: string | null;
  birdFriendlyLabel: string | null;
  otherWildlifeTags: string[];
} {
  const vals = valuesFor(plant, ATTR.benefits);
  let pollinatorGeneric = false;
  let pollinatorHost = false;
  let pollinatorFood = false;
  let birdFood = false;
  let birdShelter = false;
  let bats = false;
  let otherWildlife = false;
  const unclassified: string[] = [];

  for (const raw of vals) {
    const v = raw.toLowerCase();
    if (v.includes("pollinator host")) {
      pollinatorHost = true;
    } else if (v.includes("pollinator food")) {
      pollinatorFood = true;
    } else if (v.includes("pollinator friendly") || v.includes("pollinator")) {
      pollinatorGeneric = true;
    } else if (v.includes("bird food")) {
      birdFood = true;
    } else if (v.includes("bird shelter")) {
      birdShelter = true;
    } else if (v.includes("bat")) {
      bats = true;
    } else if (v.includes("other wildlife")) {
      otherWildlife = true;
    } else {
      unclassified.push(raw);
    }
  }

  const pollinatorAny = pollinatorGeneric || pollinatorHost || pollinatorFood;
  let pollinatorFriendlyLabel: string | null = null;
  if (pollinatorAny) {
    const parts = ["Yes"];
    if (pollinatorHost) parts.push("host");
    if (pollinatorFood) parts.push("food");
    pollinatorFriendlyLabel = parts.join(" · ");
  }

  const birdAny = birdFood || birdShelter;
  let birdFriendlyLabel: string | null = null;
  if (birdAny) {
    const parts = ["Yes"];
    if (birdFood) parts.push("food");
    if (birdShelter) parts.push("shelter");
    birdFriendlyLabel = parts.join(" · ");
  }

  const otherWildlifeTags: string[] = [];
  if (bats) otherWildlifeTags.push("Bats");
  if (otherWildlife) otherWildlifeTags.push("Wildlife");
  for (const u of unclassified.slice(0, 2)) {
    if (isJunkResolvedValue(u)) continue;
    otherWildlifeTags.push(u.length > 24 ? `${u.slice(0, 22)}…` : u);
  }

  return { pollinatorFriendlyLabel, birdFriendlyLabel, otherWildlifeTags };
}

/** Single-line deer tag for cards (API: Some, High (Usually), Very High, …). */
function buildDeerResistanceLabel(plant: PlantDetail): string | null {
  const vals = valuesFor(plant, ATTR.deerResistance);
  if (vals.length === 0) return null;
  const joined = vals.join(" ").toLowerCase();
  if (joined.includes("very high")) return "Deer: very high";
  if (joined.includes("high (usually)")) return "Deer: high";
  if (joined.includes("conflict")) return "Deer: mixed data";
  if (joined.includes("some")) return "Deer: some";
  if (joined.includes("high")) return "Deer: high";
  return `Deer: ${vals[0].slice(0, 24)}`;
}

/**
 * Heuristic “ease of care” from Character Score (flammability character in LWF; lower = often simpler profile).
 */
function buildEaseOfGrowthLabel(plant: PlantDetail): string | null {
  const n = numericCharacterScore(plant);
  const growth = valuesFor(plant, ATTR.growthListChoice).join(" ").toLowerCase();
  const growthOk =
    growth.includes("agree") || growth.includes("recommend") || growth.includes("consider");
  if (n === null) {
    return growthOk ? "Growth: typical (data partial)" : null;
  }
  let base: string;
  if (n <= 5) base = "Easier care profile";
  else if (n <= 10) base = "Typical care";
  else base = "Higher-care / spacing";
  if (growthOk && n > 5) base = `${base} · favorable growth data`;
  return base;
}

function pollinatorMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  const imp = user.pollinatorImportance;
  if (!imp || imp === "notImportant") return true;
  if (imp === "nice") return true;
  if (imp === "high") {
    if (valuesFor(plant, ATTR.benefits).length === 0) return false;
    return benefitsForPollinator(plant);
  }
  return true;
}

function deerResistanceStrength(plant: PlantDetail): "none" | "some" | "high" {
  const vals = valuesFor(plant, ATTR.deerResistance);
  if (vals.length === 0) return "none";
  const joined = vals.map((v) => v.toLowerCase()).join(" ");
  if (joined.includes("very high") || joined.includes("high (usually)")) return "high";
  if (joined.includes("some")) return "some";
  return "none";
}

function deerMatches(user: QuestionnaireAnswers, plant: PlantDetail): boolean {
  const need = user.deerResistance;
  if (!need || need === "notImportant") return true;
  const tier = deerResistanceStrength(plant);
  if (need === "must") return tier === "high";
  return true;
}

function aestheticScore(user: QuestionnaireAnswers, plant: PlantDetail): number {
  let score = 1;
  const habit = plant.values
    .filter((v) => v.attributeName === "Habit/Form")
    .map((v) => String(v.resolved?.value ?? ""))
    .join(" ")
    .toLowerCase();
  for (const a of user.aesthetics) {
    if (a === "naturalistic" && habit.includes("fine")) score += 2;
    if (a === "formal" && habit.includes("dense")) score += 1;
    if (a === "cottage" && (habit.includes("broad") || habit.includes("medium"))) score += 1;
    if (a === "minimalist" && habit.includes("fine")) score += 2;
  }
  if (user.colors.includes("noPreference")) score += 1;
  if (user.priorities.includes("aesthetics")) score += 2;
  return score;
}

function pollinatorBoost(user: QuestionnaireAnswers, plant: PlantDetail): number {
  if (user.pollinatorImportance !== "nice") return 0;
  return benefitsForPollinator(plant) ? 2 : 0;
}

function deerBoost(user: QuestionnaireAnswers, plant: PlantDetail): number {
  if (user.deerResistance !== "prefer") return 0;
  const tier = deerResistanceStrength(plant);
  if (tier === "high") return 3;
  if (tier === "some") return 1;
  return 0;
}

function priorityBlendScore(
  user: QuestionnaireAnswers,
  plant: PlantDetail,
  fireScore: number,
  aesthetic: number,
  waterLabel: string | null,
  maint: number | null,
): number {
  let s = 0;
  const pri = new Set<TopPriority>(user.priorities);
  if (pri.has("fireSafety")) s += fireScore * 4;
  if (pri.has("aesthetics")) s += aesthetic * 2;
  if (pri.has("lowMaintenance") && maint !== null) s += Math.max(0, 12 - maint);
  if (pri.has("water")) {
    const w = (waterLabel ?? "").toLowerCase();
    if (w.includes("low") || w.includes("xeric")) s += 3;
    else if (w.includes("moderate")) s += 1;
  }
  if (pri.has("budget")) {
    const tight = user.budget === "under500" || user.budget === "500_1000";
    const score = numericCharacterScore(plant);
    if (tight && score !== null && score <= 6) s += 2;
    if (!tight) s += 1;
  }
  s += pollinatorBoost(user, plant);
  s += deerBoost(user, plant);
  return s;
}

function shouldExcludeForFirePriority(user: QuestionnaireAnswers, scores: number[]): boolean {
  if (!user.priorities.includes("fireSafety")) return false;
  if (scores.length === 0) return false;
  return scores.every((s) => s <= 1);
}

/**
 * Ashland-area residents: exclude plants with hard Ashland prohibitions (noxious weed, invasive, harmful).
 * These rules apply to the City of Ashland program, not necessarily elsewhere in the Rogue Valley. The full
 * LWF catalog under Ashland-style rules is ~hundreds of species vs thousands regionally; this app applies the
 * same checks to whatever catalog slice the planner loaded. Placement codes (P10, P30, …) are not excluded
 * here—Character Score / zones handle spacing.
 */
function hasAshlandHardProhibition(plant: PlantDetail): boolean {
  const vals = valuesFor(plant, ATTR.ashland);
  if (vals.length === 0) return false;
  for (const raw of vals) {
    const u = raw.trim().toUpperCase();
    if (u === "NW" || u === "WEED" || u === "PH") return true;
    const lower = raw.toLowerCase();
    if (lower.includes("noxious")) return true;
    if (lower.includes("harmful to humans")) return true;
    if (lower.includes("invasive") && lower.includes("several")) return true;
  }
  return false;
}

/**
 * Filters and scores plants for the results experience.
 */
export function filterAndScorePlants(
  plants: PlantDetail[],
  answers: QuestionnaireAnswers,
): ScoredPlant[] {
  const out: ScoredPlant[] = [];
  for (const plant of plants) {
    const listScores = valuesFor(plant, ATTR.listChoice).map(listChoiceFireScore);
    if (shouldExcludeForFirePriority(answers, listScores)) continue;
    if (!plantMatchesDefensibleZones(plant, answers.defensibleZones)) continue;
    if (!waterMatches(answers, plant)) continue;
    if (!maintenanceMatches(answers, plant)) continue;
    if (!hardinessMatches(answers, plant)) continue;
    if (!lightMatches(answers, plant)) continue;
    if (!pollinatorMatches(answers, plant)) continue;
    if (!deerMatches(answers, plant)) continue;
    if (answers.ashlandAreaResident === true && hasAshlandHardProhibition(plant)) continue;

    const fireResistance = fireLabelFromScores(listScores);
    const fireScore = listScores.length ? Math.max(...listScores) : 2;
    const recommendedZones =
      inferZonesFromHiz(valuesFor(plant, ATTR.hiz)).length > 0
        ? inferZonesFromHiz(valuesFor(plant, ATTR.hiz))
        : answers.defensibleZones.length
          ? answers.defensibleZones
          : (["zone2"] as DefensibleZoneId[]);
    const waterUseLabel = valuesFor(plant, ATTR.waterAmount)[0] ?? null;
    const maintenanceLabel = numericCharacterScore(plant)?.toString() ?? null;
    const maintNum = numericCharacterScore(plant);
    const { pollinatorFriendlyLabel, birdFriendlyLabel, otherWildlifeTags } =
      buildWildlifeSummaries(plant);
    const deerResistanceLabel = buildDeerResistanceLabel(plant);
    const easeOfGrowthLabel = buildEaseOfGrowthLabel(plant);
    const lwfPlacementSummary = buildLwfPlacementSummary(plant);
    const aesthetic = aestheticScore(answers, plant);
    const priorityScore = priorityBlendScore(
      answers,
      plant,
      fireScore,
      aesthetic,
      waterUseLabel,
      maintNum,
    );

    out.push({
      ...plant,
      fireResistance,
      fireScore,
      aestheticScore: aesthetic,
      priorityScore,
      recommendedZones,
      waterUseLabel,
      maintenanceLabel,
      pollinatorFriendlyLabel,
      birdFriendlyLabel,
      otherWildlifeTags,
      deerResistanceLabel,
      easeOfGrowthLabel,
      lwfPlacementSummary,
    });
  }
  return out;
}

/** Stronger deer resistance first; no data sorts last. */
function deerResistanceSortValue(plant: PlantDetail): number {
  const vals = valuesFor(plant, ATTR.deerResistance);
  if (vals.length === 0) return 0;
  const tier = deerResistanceStrength(plant);
  if (tier === "high") return 3;
  if (tier === "some") return 2;
  return 1;
}

/** More segments in “Yes · …” → richer pollinator / bird value. */
function pollinatorFriendlySortValue(p: ScoredPlant): number {
  if (!p.pollinatorFriendlyLabel) return 0;
  return p.pollinatorFriendlyLabel.split(" · ").length;
}

function birdFriendlySortValue(p: ScoredPlant): number {
  if (!p.birdFriendlyLabel) return 0;
  return p.birdFriendlyLabel.split(" · ").length;
}

function tiebreakFireThenName(a: ScoredPlant, b: ScoredPlant): number {
  const f = b.fireScore - a.fireScore;
  if (f !== 0) return f;
  return a.commonName.localeCompare(b.commonName);
}

/** First numeric feet from LWF mature height/width fields (values are usually plain numbers as text). */
function firstMatureSizeFeet(plant: PlantDetail, attributeName: string): number | null {
  const raw = valuesFor(plant, attributeName)[0];
  if (raw === undefined) return null;
  const s = String(raw).trim();
  const direct = Number(s);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  const m = s.match(/(-?[\d.]+)\s*(?:ft|feet|')?/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function matureSizeExtents(plant: PlantDetail): {
  hMin: number | null;
  hMax: number | null;
  wMin: number | null;
  wMax: number | null;
} {
  return {
    hMin: firstMatureSizeFeet(plant, ATTR.minMatureHeight),
    hMax: firstMatureSizeFeet(plant, ATTR.maxMatureHeight),
    wMin: firstMatureSizeFeet(plant, ATTR.minMatureWidth),
    wMax: firstMatureSizeFeet(plant, ATTR.maxMatureWidth),
  };
}

/** Ascending: smaller first; nulls sort after any number. */
function compareNullableAsc(
  a: number | null,
  b: number | null,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareNullableDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function compareMatureDimensionPair(
  A: ReturnType<typeof matureSizeExtents>,
  B: ReturnType<typeof matureSizeExtents>,
  dimension: "height" | "width",
  mode: PlantMatureDimensionSort,
): number {
  if (mode === "none") return 0;
  if (dimension === "height") {
    return mode === "minAsc"
      ? compareNullableAsc(A.hMin, B.hMin)
      : compareNullableDesc(A.hMax, B.hMax);
  }
  return mode === "minAsc"
    ? compareNullableAsc(A.wMin, B.wMin)
    : compareNullableDesc(A.wMax, B.wMax);
}

/**
 * Combined size relevance: height ordering first (if set), then width (if set).
 * Missing data for a compared metric sorts that plant after plants with data.
 */
function compareByMatureSize(a: ScoredPlant, b: ScoredPlant, ordering: PlantMatureSizeOrdering): number {
  const A = matureSizeExtents(a);
  const B = matureSizeExtents(b);
  const byH = compareMatureDimensionPair(A, B, "height", ordering.height);
  if (byH !== 0) return byH;
  return compareMatureDimensionPair(A, B, "width", ordering.width);
}

function compareByMode(a: ScoredPlant, b: ScoredPlant, mode: PlantSortMode): number {
  if (mode === "alphabetical") {
    return a.commonName.localeCompare(b.commonName);
  }
  if (mode === "water") {
    return (a.waterUseLabel ?? "").localeCompare(b.waterUseLabel ?? "");
  }
  if (mode === "maintenance") {
    return (Number(a.maintenanceLabel) || 0) - (Number(b.maintenanceLabel) || 0);
  }
  if (mode === "deerResistance") {
    const d = deerResistanceSortValue(b) - deerResistanceSortValue(a);
    if (d !== 0) return d;
    return tiebreakFireThenName(a, b);
  }
  if (mode === "pollinatorFriendly") {
    const d = pollinatorFriendlySortValue(b) - pollinatorFriendlySortValue(a);
    if (d !== 0) return d;
    return tiebreakFireThenName(a, b);
  }
  if (mode === "birdFriendly") {
    const d = birdFriendlySortValue(b) - birdFriendlySortValue(a);
    if (d !== 0) return d;
    return tiebreakFireThenName(a, b);
  }
  const f = b.fireScore - a.fireScore;
  if (f !== 0) return f;
  const pr = b.priorityScore - a.priorityScore;
  if (pr !== 0) return pr;
  return b.aestheticScore - a.aestheticScore;
}

/**
 * Stable sort for UI reordering. When either mature height or width ordering is set, those run first
 * (height, then width); `mode` breaks remaining ties.
 */
export function sortScoredPlants(
  plants: ScoredPlant[],
  mode: PlantSortMode,
  sizeOrdering: PlantMatureSizeOrdering = DEFAULT_PLANT_MATURE_SIZE_ORDERING,
): ScoredPlant[] {
  const copy = [...plants];
  const anyMatureOrder =
    sizeOrdering.height !== "none" || sizeOrdering.width !== "none";
  copy.sort((a, b) => {
    if (anyMatureOrder) {
      const bySize = compareByMatureSize(a, b, sizeOrdering);
      if (bySize !== 0) return bySize;
    }
    return compareByMode(a, b, mode);
  });
  return copy;
}

/**
 * Groups plants by defensible space zone for collapsible sections.
 */
export function groupPlantsByZone(plants: ScoredPlant[]): Record<DefensibleZoneId, ScoredPlant[]> {
  const groups: Record<DefensibleZoneId, ScoredPlant[]> = {
    zone1: [],
    zone2: [],
    zone3: [],
  };
  for (const p of plants) {
    const zones = p.recommendedZones.length ? p.recommendedZones : (["zone2"] as DefensibleZoneId[]);
    for (const z of zones) {
      groups[z].push(p);
    }
  }
  return groups;
}
