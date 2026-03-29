"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  AestheticOption,
  BudgetCadence,
  BudgetTier,
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
import { clearAllPlannerStorage, loadQuestionnaireAnswers, saveQuestionnaireAnswers } from "@/lib/localStorage";
import { clearPlantApiSessionCache } from "@/lib/plantApi";
import { createEmptyAnswers } from "@/lib/questionnaireState";
import { ProgressBar } from "./ProgressBar";
import { renderQuestionnaireStep } from "./WizardSteps";
import { validateQuestionnaireStep, type StepErrors } from "./validation";

const TOTAL_STEPS = 8;

function scrollWizardToTop() {
  if (typeof window === "undefined") return;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" });
}

const PROPERTY_SIZE_LABEL: Record<PropertySize, string> = {
  small: "Pretty small yard",
  medium: "Medium yard",
  large: "Large yard",
  veryLarge: "Really big yard",
};

const ZONE_LABEL: Record<DefensibleZoneId, string> = {
  zone0: "Zone 0 (0–5 ft)",
  zone1: "Zone 1 (5–30 ft)",
  zone2: "Zone 2 (30–100 ft)",
};

const IRRIGATION_LABEL: Record<Irrigation, string> = {
  none: "No irrigation (rain-fed only)",
  drip: "Drip irrigation",
  sprinkler: "Sprinkler system",
  greywater: "Greywater available",
};

const WATER_PREF_LABEL: Record<WaterPreference, string> = {
  drought: "Drought-tolerant only",
  low: "Low water",
  moderate: "Moderate water OK",
};

const LIGHT_LABEL: Record<LightPreferenceId, string> = {
  fullSun: "Lots of sun",
  partSunShade: "Mix of sun and shade",
  shade: "Pretty shady",
};

const POLLINATOR_LABEL: Record<PollinatorImportance, string> = {
  notImportant: "Not the focus",
  nice: "Nice if it happens",
  high: "Big yes for bees & butterflies",
};

const DEER_LABEL: Record<DeerResistanceNeed, string> = {
  notImportant: "Deer not really an issue",
  prefer: "Prefer deer-safe when we can",
  must: "Need plants deer usually skip",
};

const MAINT_TIME_LABEL: Record<MaintenanceTime, string> = {
  veryLow: "Under ~1 hr/month",
  low: "~1–2 hrs/month",
  moderate: "~2–4 hrs/month",
  high: "4+ hrs/month",
};

const PHYSICAL_LABEL: Record<PhysicalAbility, string> = {
  none: "No special limits",
  lowHeight: "Rather avoid tall ladders",
  minimalBending: "Rather avoid lots of kneeling/bending",
};

const SOURCING_LABEL: Record<SourcingOption, string> = {
  nativeNursery: "Native plant nursery",
  bigBox: "Big home store",
  propagate: "Growing my own",
  plantSwap: "Swaps / community",
};

const AESTHETIC_LABEL: Record<AestheticOption, string> = {
  naturalistic: "Wild & natural",
  formal: "Neat & structured",
  cottage: "Cozy cottage garden",
  minimalist: "Simple / calm",
};

const COLOR_LABEL: Record<ColorPreference, string> = {
  greens: "Mostly green / foliage",
  warm: "Warm flower colors",
  cool: "Cool flower colors",
  neutral: "White / soft colors",
  noPreference: "Not picky on color",
};

const SEASON_LABEL: Record<SeasonalInterest, string> = {
  spring: "Spring pop",
  summer: "Summer color",
  autumn: "Fall leaves",
  winter: "Winter shape",
};

const FIRE_RISK_LABEL: Record<FireRisk, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
};

const PRIORITY_LABEL: Record<TopPriority, string> = {
  fireSafety: "Fire safety first",
  aesthetics: "How it looks",
  lowMaintenance: "Easy care",
  water: "Saving water",
  budget: "Saving money",
};

function formatBudgetLine(tier: BudgetTier | null, cadence: BudgetCadence | null): string {
  if (!tier) return "—";
  const suffix =
    cadence === "perMonth"
      ? " / month"
      : cadence === "perYear"
        ? " / year"
        : cadence === "oneTime"
          ? " (project total)"
          : "";
  const band: Record<BudgetTier, string> = {
    under500: "Under $500",
    "500_1000": "$500–$1,000",
    "1000_2500": "$1,000–$2,500",
    "2500_5000": "$2,500–$5,000",
    "5000plus": "$5,000+",
  };
  return `${band[tier]}${suffix}`;
}

function mapJoin<T extends string>(ids: T[], labels: Record<T, string>): string {
  return ids.length ? ids.map((id) => labels[id]).join("; ") : "—";
}

function Summary({ answers }: { answers: QuestionnaireAnswers }) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Yard size",
      value: answers.propertySize ? PROPERTY_SIZE_LABEL[answers.propertySize] : "—",
    },
    {
      label: "Live in Ashland?",
      value:
        answers.ashlandAreaResident === null
          ? "—"
          : answers.ashlandAreaResident
            ? "Yes"
            : "No",
    },
    { label: "ZIP (for zone guess)", value: answers.addressZip.trim() || "—" },
    { label: "Cold-weather zone", value: answers.usdaZone ? `Zone ${answers.usdaZone}` : "—" },
    {
      label: "Defensible space zones",
      value: mapJoin(answers.defensibleZones, ZONE_LABEL),
    },
    {
      label: "Irrigation",
      value: answers.irrigation ? IRRIGATION_LABEL[answers.irrigation] : "—",
    },
    {
      label: "Water preference",
      value: answers.waterPreference ? WATER_PREF_LABEL[answers.waterPreference] : "—",
    },
    {
      label: "Sun or shade",
      value: mapJoin(answers.lightPreferences, LIGHT_LABEL),
    },
    {
      label: "Pollinators",
      value: answers.pollinatorImportance ? POLLINATOR_LABEL[answers.pollinatorImportance] : "—",
    },
    {
      label: "Deer",
      value: answers.deerResistance ? DEER_LABEL[answers.deerResistance] : "—",
    },
    {
      label: "Time in the yard",
      value: answers.maintenanceTime ? MAINT_TIME_LABEL[answers.maintenanceTime] : "—",
    },
    {
      label: "Hard on your body?",
      value: answers.physicalAbility ? PHYSICAL_LABEL[answers.physicalAbility] : "—",
    },
    {
      label: "Rough budget",
      value: formatBudgetLine(answers.budget, answers.budgetCadence),
    },
    {
      label: "Where you’ll get plants",
      value: mapJoin(answers.sourcing, SOURCING_LABEL),
    },
    {
      label: "Style",
      value: mapJoin(answers.aesthetics, AESTHETIC_LABEL),
    },
    {
      label: "Colors",
      value: mapJoin(answers.colors, COLOR_LABEL),
    },
    {
      label: "Favorite seasons",
      value: mapJoin(answers.seasonal, SEASON_LABEL),
    },
    {
      label: "Plants you want to keep",
      value: answers.keepExisting
        ? answers.keepExistingNotes.trim() || "—"
        : "Not listing keepers",
    },
    {
      label: "Plants to remove or swap",
      value: answers.removePlants
        ? answers.removePlantsNotes.trim() || "—"
        : "Nothing on the remove list",
    },
    {
      label: "Fire risk",
      value: answers.fireRisk ? FIRE_RISK_LABEL[answers.fireRisk] : "—",
    },
    {
      label: "What matters most",
      value: mapJoin(answers.priorities, PRIORITY_LABEL),
    },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">Look everything over</h2>
      <p className="text-sm text-[var(--muted)]">
        Your answers save as you go. When it looks right, tap the button to load plant ideas.
      </p>
      <dl className="divide-y divide-black/10 rounded-xl border border-black/10 bg-white">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm sm:grid-cols-4">
            <dt className="font-medium text-[var(--foreground)] sm:col-span-1">{row.label}</dt>
            <dd className="col-span-2 text-[var(--muted)] sm:col-span-3">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function QuestionnaireWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(createEmptyAnswers);
  const [errors, setErrors] = useState<StepErrors>({});
  const [zipHint, setZipHint] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadQuestionnaireAnswers();
    if (saved) setAnswers(saved);
  }, []);

  useEffect(() => {
    saveQuestionnaireAnswers(answers);
  }, [answers]);

  const progressLabel = useMemo(() => {
    if (step >= TOTAL_STEPS) return "Check your answers";
    const titles = [
      "Your yard & safety rings",
      "Water & water use",
      "Sun, wildlife & deer",
      "Time & your body",
      "Budget",
      "Look & seasons",
      "What’s already there",
      "Risk & priorities",
    ];
    return titles[step] ?? "";
  }, [step]);

  function patch<K extends keyof QuestionnaireAnswers>(key: K, value: QuestionnaireAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      const nextErrors = validateQuestionnaireStep(step, answers);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      setErrors({});
      setStep((s) => s + 1);
      scrollWizardToTop();
      return;
    }
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const partial = validateQuestionnaireStep(i, answers);
      if (Object.keys(partial).length > 0) {
        setStep(i);
        setErrors(partial);
        scrollWizardToTop();
        return;
      }
    }
    setErrors({});
    router.push("/results");
  }

  function goBack() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  function startOver() {
    clearAllPlannerStorage();
    clearPlantApiSessionCache();
    setAnswers(createEmptyAnswers());
    setStep(0);
    setErrors({});
    setZipHint(null);
  }

  const atSummary = step >= TOTAL_STEPS;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--accent-strong)]">
          Questions
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Fire-wise plants that fit your yard
        </h1>

      </header>

      <ProgressBar
        current={Math.min(step + 1, TOTAL_STEPS)}
        total={TOTAL_STEPS}
        label={progressLabel}
      />

      <section className="rounded-2xl border border-black/10 bg-[var(--surface)] p-6 shadow-sm sm:p-8">
        {atSummary ? (
          <Summary answers={answers} />
        ) : (
          renderQuestionnaireStep(step, answers, patch, errors, { zipHint, setZipHint })
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-full px-5 text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          onClick={startOver}
        >
          Clear & start over
        </button>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {!atSummary ? (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:opacity-40"
              onClick={goBack}
              disabled={step === 0}
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
              onClick={() => setStep(TOTAL_STEPS - 1)}
            >
              Go back & edit
            </button>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-44 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
            onClick={goNext}
          >
            {atSummary ? "Generate my plant list" : "Next"}
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-[var(--muted)]">
        Want out?{" "}
        <Link className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline" href="/">
          Home
        </Link>
      </p>
    </div>
  );
}
