"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { QuestionnaireAnswers } from "@/types";
import { clearAllPlannerStorage, loadQuestionnaireAnswers, saveQuestionnaireAnswers } from "@/lib/localStorage";
import { clearPlantApiSessionCache } from "@/lib/plantApi";
import { createEmptyAnswers } from "@/lib/questionnaireState";
import { ProgressBar } from "./ProgressBar";
import { renderQuestionnaireStep } from "./WizardSteps";
import { validateQuestionnaireStep, type StepErrors } from "./validation";

const TOTAL_STEPS = 8;

function formatCadence(c: QuestionnaireAnswers["budgetCadence"]): string {
  if (c === "perMonth") return "per month";
  if (c === "perYear") return "per year";
  if (c === "oneTime") return "one-time project";
  return "—";
}

function Summary({ answers }: { answers: QuestionnaireAnswers }) {
  const rows: { label: string; value: string }[] = [
    { label: "Lot size", value: answers.propertySize ?? "—" },
    { label: "Planting space near home", value: answers.nearHomePlantingSpace ?? "—" },
    { label: "ZIP (lookup)", value: answers.addressZip.trim() || "—" },
    { label: "USDA zone", value: answers.usdaZone ?? "—" },
    { label: "Defensible zones", value: answers.defensibleZones.join(", ") || "—" },
    { label: "Irrigation", value: answers.irrigation ?? "—" },
    { label: "Water preference", value: answers.waterPreference ?? "—" },
    { label: "Sun / shade", value: answers.lightPreferences.join(", ") || "—" },
    { label: "Pollinators", value: answers.pollinatorImportance ?? "—" },
    { label: "Deer resistance", value: answers.deerResistance ?? "—" },
    { label: "Maintenance time", value: answers.maintenanceTime ?? "—" },
    {
      label: "Budget",
      value:
        answers.budget != null
          ? `${answers.budget} (${formatCadence(answers.budgetCadence)})`
          : "—",
    },
    { label: "Fire risk", value: answers.fireRisk ?? "—" },
    { label: "Priorities", value: answers.priorities.join(", ") || "—" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--foreground)]">Review your answers</h2>
      <p className="text-sm text-[var(--muted)]">
        Everything saves automatically—double-check before we query the plant library.
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
    if (step >= TOTAL_STEPS) return "Review";
    const titles = [
      "Property basics",
      "Water & water use",
      "Site conditions",
      "Maintenance level",
      "Budget",
      "Style & seasons",
      "Current landscape",
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
      return;
    }
    for (let i = 0; i < TOTAL_STEPS; i++) {
      const partial = validateQuestionnaireStep(i, answers);
      if (Object.keys(partial).length > 0) {
        setStep(i);
        setErrors(partial);
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
          Questionnaire
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">
          Let’s tailor a fire-wise planting plan
        </h1>
        <p className="text-base text-[var(--muted)]">
          Plain language, step by step. You can navigate back anytime or start fresh.
        </p>
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
          Start over
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
              Edit answers
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
        Need context?{" "}
        <Link className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline" href="/">
          Return home
        </Link>
      </p>
    </div>
  );
}
