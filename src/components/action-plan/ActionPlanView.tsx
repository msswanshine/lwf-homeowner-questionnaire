"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const PRINT_RESTORE_ATTR = "data-fw-print-restore";

export function ActionPlanView() {
  const router = useRouter();
  const checklistRef = useRef<HTMLDivElement>(null);
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

  /** Closed <details> are omitted in many browsers’ print/PDF output; expand briefly around print. */
  useEffect(() => {
    const expandForPrint = () => {
      const root = checklistRef.current;
      if (!root) return;
      root.querySelectorAll("details").forEach((node) => {
        const el = node as HTMLDetailsElement;
        if (!el.hasAttribute(PRINT_RESTORE_ATTR)) {
          el.setAttribute(PRINT_RESTORE_ATTR, el.open ? "open" : "closed");
        }
        el.open = true;
      });
    };

    const restoreAfterPrint = () => {
      const root = checklistRef.current;
      if (!root) return;
      root.querySelectorAll("details").forEach((node) => {
        const el = node as HTMLDetailsElement;
        const prev = el.getAttribute(PRINT_RESTORE_ATTR);
        if (!prev) return;
        el.removeAttribute(PRINT_RESTORE_ATTR);
        el.open = prev === "open";
      });
    };

    const onBeforePrint = () => expandForPrint();
    const onAfterPrint = () => restoreAfterPrint();

    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);

    const mql = window.matchMedia("print");
    const onMqlChange = () => {
      if (mql.matches) expandForPrint();
      else restoreAfterPrint();
    };
    mql.addEventListener("change", onMqlChange);

    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      mql.removeEventListener("change", onMqlChange);
      restoreAfterPrint();
    };
  }, []);

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
    <div className="action-plan-view mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 print:max-w-none print:gap-6 print:px-0 print:py-0">
      <header className="space-y-3 print:space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent-strong)] print:hidden">
          Action plan
        </p>
        <h1 className="text-3xl font-semibold text-[var(--foreground)] print:text-2xl print:font-bold">
          Your phased checklist
        </h1>
        <p className="text-base text-[var(--muted)] print:hidden">
          Work outward from the home, track progress, and keep tasks grounded in the plants we just
          surfaced. Checkboxes save on this device only.
        </p>
        <p className="hidden text-sm text-[var(--muted)] print:block">
          Full checklist — all phases and tasks. Checkboxes match what you saved in this browser.
        </p>
      </header>

      {error ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 print:hidden"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {status === "loading" ? (
        <p className="text-sm text-[var(--muted)] print:hidden">Rebuilding recommendations…</p>
      ) : null}

      <div ref={checklistRef} className="action-plan-checklist space-y-4 print:space-y-3">
        {phases.map((phase, index) => {
          const openDefault = index < 2;
          return (
            <details
              key={phase.id}
              open={openDefault}
              className="action-plan-phase rounded-2xl border border-black/10 bg-[var(--surface)] p-4 shadow-sm print:rounded-none print:shadow-none"
            >
              <summary className="cursor-pointer text-lg font-semibold text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] print:cursor-default">
                {phase.title}
              </summary>
              <p className="action-plan-phase-intro mt-3 text-sm text-[var(--muted)]">{phase.body}</p>
              <ul className="action-plan-task-list mt-4 list-none space-y-3 p-0 print:mt-3 print:space-y-2">
                {phase.tasks.map((task) => (
                  <li key={task.id} className="print:break-inside-avoid">
                    <label className="action-plan-task-row flex cursor-pointer items-start gap-3 rounded-xl border border-black/5 bg-white p-3 print:rounded-none">
                      <input
                        type="checkbox"
                        className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)] print:mt-0.5"
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

      <div className="action-plan-maintenance print:mt-6">
        <MaintenanceCalendar />
      </div>

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
