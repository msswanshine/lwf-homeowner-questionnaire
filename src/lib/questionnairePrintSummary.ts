/**
 * Human-readable rows for print/PDF (results “Your inputs” block).
 * Label wording is aligned with the questionnaire where practical; keep in sync with UX copy if it drifts.
 */

import type {
  AestheticOption,
  BudgetCadence,
  ColorPreference,
  DefensibleZoneId,
  DeerResistanceNeed,
  FireRisk,
  Irrigation,
  LightPreferenceId,
  MaintenanceTime,
  PhysicalAbility,
  PollinatorImportance,
  PropertySize,
  QuestionnaireAnswers,
  SeasonalInterest,
  SourcingOption,
  TopPriority,
  WaterPreference,
} from "@/types";

const DEFENSIBLE_ZONE_LABEL: Record<DefensibleZoneId, string> = {
  zone1: "Zone 1 — 0 to 5 ft",
  zone2: "Zone 2 — 5 to 30 ft",
  zone3: "Zone 3 — 30 to 100 ft",
};

const PROPERTY_SIZE: Record<PropertySize, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  veryLarge: "Very large",
};

const IRRIGATION: Record<Irrigation, string> = {
  none: "None",
  drip: "Drip",
  sprinkler: "Sprinkler",
  greywater: "Greywater",
};

const WATER_PREF: Record<WaterPreference, string> = {
  drought: "Drought-tolerant / xeric bias",
  low: "Low to moderate water",
  moderate: "Moderate water okay",
};

const LIGHT: Record<LightPreferenceId, string> = {
  fullSun: "Full sun",
  partSunShade: "Part sun / part shade",
  shade: "Shade",
};

const POLLINATOR: Record<PollinatorImportance, string> = {
  notImportant: "Not important",
  nice: "Nice to have",
  high: "High priority",
};

const DEER: Record<DeerResistanceNeed, string> = {
  notImportant: "Not important",
  prefer: "Prefer resistant plants",
  must: "Must be highly resistant",
};

const MAINTENANCE: Record<MaintenanceTime, string> = {
  veryLow: "Very low",
  low: "Low",
  moderate: "Moderate",
  high: "High",
};

const PHYSICAL: Record<PhysicalAbility, string> = {
  none: "No limits noted",
  lowHeight: "Prefer low height / raised beds",
  minimalBending: "Minimal bending / kneeling",
};

const BUDGET_CADENCE: Record<BudgetCadence, string> = {
  oneTime: "Whole project (one-time)",
  perMonth: "Per month",
  perYear: "Per year",
};

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const SOURCING: Record<SourcingOption, string> = {
  nativeNursery: "Native / specialty nursery",
  bigBox: "Big-box store",
  propagate: "Propagate / grow from cuttings or seed",
  plantSwap: "Plant swap / community",
};

const AESTHETIC: Record<AestheticOption, string> = {
  naturalistic: "Naturalistic",
  formal: "Formal",
  cottage: "Cottage",
  minimalist: "Minimalist",
};

const COLOR: Record<ColorPreference, string> = {
  greens: "Greens",
  warm: "Warm tones",
  cool: "Cool tones",
  neutral: "Neutral",
  noPreference: "No preference",
};

const SEASONAL: Record<SeasonalInterest, string> = {
  spring: "Spring",
  summer: "Summer",
  autumn: "Autumn",
  winter: "Winter",
};

const FIRE_RISK: Record<FireRisk, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
};

const PRIORITY: Record<TopPriority, string> = {
  fireSafety: "Fire safety",
  aesthetics: "Aesthetics",
  lowMaintenance: "Low maintenance",
  water: "Water savings",
  budget: "Budget",
};

export interface QuestionnairePrintLine {
  label: string;
  value: string;
}

/** Redact full ZIP on printed PDFs (still useful to confirm a rough area). */
function zipForPrint(zip: string): string {
  const t = zip.trim();
  if (t.length < 5) return t.length ? "Provided (partial)" : "—";
  return `${t.slice(0, 3)}xx`;
}

function joinMap<T extends string>(ids: T[], map: Record<T, string>): string {
  if (ids.length === 0) return "—";
  return ids.map((id) => map[id]).join(", ");
}

function truncateNote(s: string, max = 160): string {
  const t = s.trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/**
 * Rows for a compact definition list on the results printout.
 */
export function formatQuestionnaireForPrint(answers: QuestionnaireAnswers): QuestionnairePrintLine[] {
  const lines: QuestionnairePrintLine[] = [];

  lines.push(
    { label: "Property size", value: answers.propertySize ? PROPERTY_SIZE[answers.propertySize] : "—" },
    {
      label: "ZIP (redacted)",
      value: zipForPrint(answers.addressZip),
    },
    {
      label: "USDA hardiness zone",
      value: answers.usdaZone ? `Zone ${answers.usdaZone}` : "—",
    },
    {
      label: "Ashland-area rules",
      value:
        answers.ashlandAreaResident === null
          ? "—"
          : answers.ashlandAreaResident
            ? "Yes — Ashland program filters apply"
            : "No",
    },
    {
      label: "Defensible space zones",
      value:
        answers.defensibleZones.length > 0
          ? answers.defensibleZones.map((z) => DEFENSIBLE_ZONE_LABEL[z]).join(", ")
          : "—",
    },
    { label: "Irrigation", value: answers.irrigation ? IRRIGATION[answers.irrigation] : "—" },
    {
      label: "Water preference",
      value: answers.waterPreference ? WATER_PREF[answers.waterPreference] : "—",
    },
    {
      label: "Sun / light",
      value: joinMap(answers.lightPreferences, LIGHT),
    },
    {
      label: "Pollinator importance",
      value: answers.pollinatorImportance ? POLLINATOR[answers.pollinatorImportance] : "—",
    },
    {
      label: "Deer resistance",
      value: answers.deerResistance ? DEER[answers.deerResistance] : "—",
    },
    {
      label: "Maintenance time",
      value: answers.maintenanceTime ? MAINTENANCE[answers.maintenanceTime] : "—",
    },
    {
      label: "Physical ability / ergonomics",
      value: answers.physicalAbility ? PHYSICAL[answers.physicalAbility] : "—",
    },
    {
      label: "Budget amount",
      value:
        answers.budgetAmountDollars !== null && answers.budgetAmountDollars >= 1
          ? formatUsd(answers.budgetAmountDollars)
          : "—",
    },
    {
      label: "Budget scope",
      value: answers.budgetCadence ? BUDGET_CADENCE[answers.budgetCadence] : "—",
    },
    {
      label: "Plant sourcing",
      value: joinMap(answers.sourcing, SOURCING),
    },
    {
      label: "Aesthetic style",
      value: joinMap(answers.aesthetics, AESTHETIC),
    },
    {
      label: "Color preferences",
      value: joinMap(answers.colors, COLOR),
    },
    {
      label: "Seasonal interest",
      value: joinMap(answers.seasonal, SEASONAL),
    },
    {
      label: "Keep existing plants",
      value: answers.keepExisting ? `Yes${answers.keepExistingNotes.trim() ? ` — ${truncateNote(answers.keepExistingNotes)}` : ""}` : "No",
    },
    {
      label: "Remove plants",
      value: answers.removePlants ? `Yes${answers.removePlantsNotes.trim() ? ` — ${truncateNote(answers.removePlantsNotes)}` : ""}` : "No",
    },
    {
      label: "Wildfire risk (self-reported)",
      value: answers.fireRisk ? FIRE_RISK[answers.fireRisk] : "—",
    },
    {
      label: "Top priorities",
      value: answers.priorities.length > 0 ? answers.priorities.map((p) => PRIORITY[p]).join(", ") : "—",
    },
  );

  return lines;
}
