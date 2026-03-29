/**
 * Shared domain types for FireWise Landscape Planner.
 * Plant shapes align with https://lwf-api.vercel.app/api/v2 (see plant-fields.json).
 */

export type PropertySize = "small" | "medium" | "large" | "veryLarge";

export type UsdaZone = "5" | "6" | "7" | "8" | "9";

export type DefensibleZoneId = "zone0" | "zone1" | "zone2";

export type Irrigation = "none" | "drip" | "sprinkler" | "greywater";

export type WaterPreference = "drought" | "low" | "moderate";

export type MaintenanceTime = "veryLow" | "low" | "moderate" | "high";

export type PhysicalAbility = "none" | "lowHeight" | "minimalBending";

export type BudgetTier =
  | "under500"
  | "500_1000"
  | "1000_2500"
  | "2500_5000"
  | "5000plus";

/** How the user thinks about the dollar bands in BudgetTier. */
export type BudgetCadence = "oneTime" | "perMonth" | "perYear";

export type SourcingOption =
  | "nativeNursery"
  | "bigBox"
  | "propagate"
  | "plantSwap";

export type AestheticOption =
  | "naturalistic"
  | "formal"
  | "cottage"
  | "minimalist";

export type ColorPreference =
  | "greens"
  | "warm"
  | "cool"
  | "neutral"
  | "noPreference";

export type SeasonalInterest = "spring" | "summer" | "autumn" | "winter";

export type FireRisk = "low" | "moderate" | "high" | "extreme";

export type TopPriority =
  | "fireSafety"
  | "aesthetics"
  | "lowMaintenance"
  | "water"
  | "budget";

/** Maps to API Light Needs display names. */
export type LightPreferenceId = "fullSun" | "partSunShade" | "shade";

export type PollinatorImportance = "notImportant" | "nice" | "high";

export type DeerResistanceNeed = "notImportant" | "prefer" | "must";

/** One wizard submission — questionnaire + user testing iterations. */
export interface QuestionnaireAnswers {
  propertySize: PropertySize | null;
  /** ZIP (5 digits) for USDA lookup; optional. */
  addressZip: string;
  usdaZone: UsdaZone | null;
  /**
   * City of Ashland–area plant rules (LWF "Ashland" attribute)—not the whole Rogue Valley.
   * null = not yet answered (step 0 required).
   */
  ashlandAreaResident: boolean | null;
  defensibleZones: DefensibleZoneId[];
  irrigation: Irrigation | null;
  waterPreference: WaterPreference | null;
  lightPreferences: LightPreferenceId[];
  pollinatorImportance: PollinatorImportance | null;
  deerResistance: DeerResistanceNeed | null;
  maintenanceTime: MaintenanceTime | null;
  physicalAbility: PhysicalAbility | null;
  budget: BudgetTier | null;
  budgetCadence: BudgetCadence | null;
  sourcing: SourcingOption[];
  aesthetics: AestheticOption[];
  colors: ColorPreference[];
  seasonal: SeasonalInterest[];
  keepExisting: boolean;
  keepExistingNotes: string;
  removePlants: boolean;
  removePlantsNotes: string;
  fireRisk: FireRisk | null;
  /** Multiple priorities (at least one required). */
  priorities: TopPriority[];
}

export interface PlantPrimaryImage {
  url?: string;
  type?: string;
  source?: string;
}

export interface PlantValueResolved {
  id?: string;
  value: string | number | boolean;
  raw?: string;
  type?: string;
  description?: string;
}

export interface PlantValue {
  id: string;
  attributeId: string;
  attributeName: string;
  plantId: string;
  rawValue: string;
  resolved: PlantValueResolved | null;
}

export interface PlantListItem {
  id: string;
  genus: string;
  species: string;
  subspeciesVarieties: string | null;
  commonName: string;
  urls: string[];
  notes: string | null;
  lastUpdated: string | null;
  primaryImage?: PlantPrimaryImage | null;
}

export interface PlantDetail extends PlantListItem {
  images: PlantPrimaryImage[];
  values: PlantValue[];
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface PlantsListResponse {
  data: PlantListItem[];
  meta: { pagination: PaginationMeta };
}

export interface PlantDetailResponse {
  data: PlantDetail;
}

export type FireResistanceLabel = "High" | "Medium" | "Low";

/** Enriched plant used by results UI and PDF. */
export interface ScoredPlant extends PlantDetail {
  fireResistance: FireResistanceLabel;
  fireScore: number;
  aestheticScore: number;
  priorityScore: number;
  recommendedZones: DefensibleZoneId[];
  waterUseLabel: string | null;
  maintenanceLabel: string | null;
  /** e.g. "Yes · host · food" for UI label "Pollinator friendly". */
  pollinatorFriendlyLabel: string | null;
  /** e.g. "Yes · food · shelter" for UI label "Bird friendly". */
  birdFriendlyLabel: string | null;
  /** Remaining benefit tags (bats, other wildlife, uncategorized benefit text). */
  otherWildlifeTags: string[];
  /** Short deer resistance summary for UI tags. */
  deerResistanceLabel: string | null;
  /** Gardener-facing care / establishment hint from character score bands. */
  easeOfGrowthLabel: string | null;
  /** Where to plant: distance from home from LWF Character Score (not gardening difficulty). */
  lwfPlacementSummary: string | null;
}

export type PlantSortMode =
  | "fireThenAesthetic"
  | "water"
  | "maintenance"
  | "deerResistance"
  | "pollinatorFriendly"
  | "birdFriendly"
  | "alphabetical";

/** Per-dimension ordering for LWF mature height/width (feet); plants with no data for that metric sort last. */
export type PlantMatureDimensionSort = "none" | "minAsc" | "maxDesc";

/** Both can be active: height is applied first, then width; use Sort by for final tiebreaks. */
export interface PlantMatureSizeOrdering {
  height: PlantMatureDimensionSort;
  width: PlantMatureDimensionSort;
}

export const DEFAULT_PLANT_MATURE_SIZE_ORDERING: PlantMatureSizeOrdering = {
  height: "none",
  width: "none",
};

export interface ActionPlanTask {
  id: string;
  label: string;
}

export interface ActionPlanStage {
  id: string;
  title: string;
  body: string;
  tasks: ActionPlanTask[];
}
