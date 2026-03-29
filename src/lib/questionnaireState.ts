import type {
  BudgetTier,
  DefensibleZoneId,
  QuestionnaireAnswers,
  TopPriority,
} from "@/types";

const LEGACY_TIER_TO_DOLLARS: Record<BudgetTier, number> = {
  under500: 400,
  "500_1000": 750,
  "1000_2500": 1750,
  "2500_5000": 3750,
  "5000plus": 7500,
};

const LEGACY_DEFENSIBLE_ZONE: Record<string, DefensibleZoneId | undefined> = {
  zone0: "zone1",
  zone1: "zone2",
  zone2: "zone3",
};

function isDefensibleZoneId(v: string): v is DefensibleZoneId {
  return v === "zone1" || v === "zone2" || v === "zone3";
}

/** Maps legacy zone0–2 saves to zone1–3; dedupes. */
export function migrateDefensibleZoneIds(zones: unknown): DefensibleZoneId[] {
  if (!Array.isArray(zones)) return [];
  const out: DefensibleZoneId[] = [];
  for (const item of zones) {
    if (typeof item !== "string") continue;
    if (isDefensibleZoneId(item)) {
      out.push(item);
      continue;
    }
    const mapped = LEGACY_DEFENSIBLE_ZONE[item];
    if (mapped) out.push(mapped);
  }
  return [...new Set(out)];
}

/** Fresh wizard state for a new session. */
export function createEmptyAnswers(): QuestionnaireAnswers {
  return {
    propertySize: null,
    addressZip: "",
    usdaZone: null,
    ashlandAreaResident: null,
    defensibleZones: [],
    irrigation: null,
    waterPreference: null,
    lightPreferences: [],
    pollinatorImportance: null,
    deerResistance: null,
    maintenanceTime: null,
    physicalAbility: null,
    budgetAmountDollars: null,
    budgetCadence: null,
    sourcing: [],
    aesthetics: [],
    colors: [],
    seasonal: [],
    keepExisting: false,
    keepExistingNotes: "",
    removePlants: false,
    removePlantsNotes: "",
    fireRisk: null,
    priorities: [],
  };
}

type RawStored = Partial<QuestionnaireAnswers> & {
  topPriority?: TopPriority | null;
  /** Renamed to ashlandAreaResident; kept for localStorage migration. */
  rogueValleyResident?: boolean | null;
  /** Removed from questionnaire; stripped when loading legacy saves. */
  nearHomePlantingSpace?: unknown;
  /** Replaced by budgetAmountDollars. */
  budget?: BudgetTier | null;
};

/**
 * Merges partial / legacy localStorage payloads into a complete `QuestionnaireAnswers`
 * (migrates `topPriority` → `priorities`).
 */
export function normalizeQuestionnaireAnswers(raw: unknown): QuestionnaireAnswers {
  const base = createEmptyAnswers();
  if (!raw || typeof raw !== "object") return base;

  const p = { ...(raw as RawStored) };
  const legacySingle = p.topPriority;
  delete p.topPriority;

  let priorities = Array.isArray(p.priorities) ? [...p.priorities] : [];
  if (priorities.length === 0 && legacySingle) {
    priorities = [legacySingle];
  }

  const ashlandAreaResident =
    typeof p.ashlandAreaResident === "boolean"
      ? p.ashlandAreaResident
      : typeof p.rogueValleyResident === "boolean"
        ? p.rogueValleyResident
        : base.ashlandAreaResident;

  delete p.rogueValleyResident;
  delete p.nearHomePlantingSpace;

  const legacyBudget = p.budget;
  delete p.budget;

  let budgetAmountDollars: number | null = base.budgetAmountDollars;
  const rawBudgetAmt: unknown = (raw as Record<string, unknown>).budgetAmountDollars;
  if (typeof rawBudgetAmt === "number" && Number.isFinite(rawBudgetAmt) && rawBudgetAmt >= 0) {
    budgetAmountDollars = Math.min(99_999_999, Math.round(rawBudgetAmt));
  } else if (typeof rawBudgetAmt === "string" && rawBudgetAmt.trim() !== "") {
    const n = Number.parseInt(rawBudgetAmt, 10);
    if (Number.isFinite(n) && n >= 0) budgetAmountDollars = Math.min(99_999_999, n);
  }
  if (
    budgetAmountDollars === null &&
    legacyBudget != null &&
    typeof legacyBudget === "string" &&
    legacyBudget in LEGACY_TIER_TO_DOLLARS
  ) {
    budgetAmountDollars = LEGACY_TIER_TO_DOLLARS[legacyBudget as BudgetTier];
  }

  return {
    ...base,
    ...p,
    ashlandAreaResident,
    addressZip: typeof p.addressZip === "string" ? p.addressZip : base.addressZip,
    defensibleZones: migrateDefensibleZoneIds(
      Array.isArray(p.defensibleZones) ? p.defensibleZones : base.defensibleZones,
    ),
    lightPreferences: Array.isArray(p.lightPreferences) ? p.lightPreferences : base.lightPreferences,
    sourcing: Array.isArray(p.sourcing) ? p.sourcing : base.sourcing,
    aesthetics: Array.isArray(p.aesthetics) ? p.aesthetics : base.aesthetics,
    colors: Array.isArray(p.colors) ? p.colors : base.colors,
    seasonal: Array.isArray(p.seasonal) ? p.seasonal : base.seasonal,
    priorities,
    budgetAmountDollars,
  };
}
