"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestionnaireAnswers, ScoredPlant } from "@/types";
import { generateActionPlan } from "@/lib/generateActionPlan";
import { buildRecommendations } from "@/lib/plannerData";
import {
  loadQuestionnaireAnswers,
  loadTaskChecks,
  saveTaskChecks,
  type TaskCheckState,
} from "@/lib/localStorage";
import { PlantApiError } from "@/lib/plantApi";
import { MaintenanceCalendar } from "./MaintenanceCalendar";

export function ActionPlanView() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuestionnaireAnswers | null>(null);
  const [plants, setPlants] = useState<ScoredPlant[]>([]);
  const [checks, setChecks] = useState<TaskCheckState>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadQuestionnaireAnswers();
    if (!saved) {
      router.replace("/questionnaire");
      return;
    }
    setAnswers(saved);
    setChecks(loadTaskChecks());
  }, [router]);

  useEffect(() => {
    if (!answers) return;
    let cancelled = false;
    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const scored = await buildRecommendations(answers, "fireThenAesthetic");
        if (!cancelled) {
          setPlants(scored);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          const message =
            e instanceof PlantApiError
              ? `${e.message} (${e.status})`
              : "Unable to rebuild recommendations.";
          setError(message);
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [answers]);

  const phases = useMemo(
    () => (answers ? generateActionPlan(answers, plants) : []),
    [answers, plants],
  );

  function toggleTask(id: string, done: boolean) {
    setChecks((prev) => {
      const next = { ...prev, [id]: done };
      saveTaskChecks(next);
      return next;
    });
  }

  if (!answers) {
    return (
      <div className="px-4 py-16 text-center text-sm text-[var(--muted)]">Loading your plan…</div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-strong)]">
          Action plan
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)]">Your phased checklist</h1>
        <p className="text-base text-[var(--muted)]">
          Work outward from the home, track progress, and keep tasks grounded in the plants we just
          surfaced. Checkboxes save on this device only.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
          {error}
        </div>
      ) : null}

      {status === "loading" ? (
        <p className="text-sm text-[var(--muted)]">Rebuilding recommendations…</p>
      ) : null}

      <div className="space-y-4">
        {phases.map((phase, index) => {
          const openDefault = index < 2;
          return (
            <details
              key={phase.id}
              open={openDefault}
              className="rounded-2xl border border-black/10 bg-[var(--surface)] p-4 shadow-sm"
            >
              <summary className="cursor-pointer text-lg font-semibold text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]">
                {phase.title}
              </summary>
              <p className="mt-3 text-sm text-[var(--muted)]">{phase.body}</p>
              <ul className="mt-4 space-y-3">
                {phase.tasks.map((task) => (
                  <li key={task.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/5 bg-white p-3">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)]"
                        checked={Boolean(checks[task.id])}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                      />
                      <span className="text-sm text-[var(--foreground)]">{task.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>

      <MaintenanceCalendar />

      <div className="flex flex-wrap gap-3 print:hidden">
        <a
          href="/results"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/15 bg-white px-5 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
        >
          Back to plant list
        </a>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
          onClick={() => window.print()}
        >
          Print / save as PDF
        </button>
      </div>
    </div>
  );
}
