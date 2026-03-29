import type {
  DefensibleZoneId,
  QuestionnaireAnswers,
  TopPriority,
} from "@/types";

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
    budget: null,
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
  };
}
