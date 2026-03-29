/**
 * Browser persistence helpers for questionnaire answers and task checklists.
 */

import type { QuestionnaireAnswers, ScoredPlant } from "@/types";
import { normalizeQuestionnaireAnswers } from "@/lib/questionnaireState";

const KEYS = {
  answers: "fw.questionnaire.answers.v1",
  results: "fw.questionnaire.results.v8",
  tasks: "fw.actionplan.tasks.v1",
} as const;

function readJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadQuestionnaireAnswers(): QuestionnaireAnswers | null {
  if (typeof window === "undefined") return null;
  const raw = readJson<unknown>(window.localStorage.getItem(KEYS.answers));
  if (!raw) return null;
  return normalizeQuestionnaireAnswers(raw);
}

export function saveQuestionnaireAnswers(answers: QuestionnaireAnswers) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.answers, JSON.stringify(answers));
}

export function clearQuestionnaireAnswers() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.answers);
}

export function loadCachedResults(): ScoredPlant[] | null {
  if (typeof window === "undefined") return null;
  return readJson<ScoredPlant[]>(window.localStorage.getItem(KEYS.results));
}

export function saveCachedResults(plants: ScoredPlant[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.results, JSON.stringify(plants));
}

export function clearCachedResults() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.results);
}

export type TaskCheckState = Record<string, boolean>;

export function loadTaskChecks(): TaskCheckState {
  if (typeof window === "undefined") return {};
  return readJson<TaskCheckState>(window.localStorage.getItem(KEYS.tasks)) ?? {};
}

export function saveTaskChecks(state: TaskCheckState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.tasks, JSON.stringify(state));
}

export function clearTaskChecks() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.tasks);
}

/**
 * Clears all planner-related saved state.
 */
export function clearAllPlannerStorage() {
  clearQuestionnaireAnswers();
  clearCachedResults();
  clearTaskChecks();
}
