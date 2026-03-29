import type {
  QuestionnaireAnswers,
  TopPriority,
} from "@/types";

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
    defensibleZones: Array.isArray(p.defensibleZones) ? p.defensibleZones : base.defensibleZones,
    lightPreferences: Array.isArray(p.lightPreferences) ? p.lightPreferences : base.lightPreferences,
    sourcing: Array.isArray(p.sourcing) ? p.sourcing : base.sourcing,
    aesthetics: Array.isArray(p.aesthetics) ? p.aesthetics : base.aesthetics,
    colors: Array.isArray(p.colors) ? p.colors : base.colors,
    seasonal: Array.isArray(p.seasonal) ? p.seasonal : base.seasonal,
    priorities,
  };
}
