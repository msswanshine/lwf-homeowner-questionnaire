/**
 * Browser persistence helpers for questionnaire answers and task checklists.
 */

import type { QuestionnaireAnswers, ScoredPlant } from "@/types";
import { normalizeQuestionnaireAnswers } from "@/lib/questionnaireState";

/** Dispatched on `window` after the saved plant list changes (same tab). */
export const FW_MY_LIST_CHANGED_EVENT = "fw-planner-my-list-changed";

/** Listened to on `window` to open the My Plan dialog (e.g. from site header on /results). */
export const FW_OPEN_MY_PLAN_EVENT = "fw-open-my-plan";

export const MY_LIST_LS_KEY = "fw.planner.myList.v1" as const;

const KEYS = {
  answers: "fw.questionnaire.answers.v1",
  results: "fw.questionnaire.results.v7",
  tasks: "fw.actionplan.tasks.v1",
  /** User-curated plant ids from results (detail modal “Add to list”). */
  myList: MY_LIST_LS_KEY,
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

export function loadMyListPlantIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = readJson<string[]>(window.localStorage.getItem(KEYS.myList));
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.length > 0);
}

/** Appends `plantId` if missing. Returns whether the list changed. */
export function addPlantToMyList(plantId: string): boolean {
  if (typeof window === "undefined") return false;
  const ids = loadMyListPlantIds();
  if (ids.includes(plantId)) return false;
  ids.push(plantId);
  window.localStorage.setItem(KEYS.myList, JSON.stringify(ids));
  window.dispatchEvent(new Event(FW_MY_LIST_CHANGED_EVENT));
  return true;
}

/** Removes `plantId` if present. Returns whether the list changed. */
export function removePlantFromMyList(plantId: string): boolean {
  if (typeof window === "undefined") return false;
  const ids = loadMyListPlantIds();
  const next = ids.filter((id) => id !== plantId);
  if (next.length === ids.length) return false;
  window.localStorage.setItem(KEYS.myList, JSON.stringify(next));
  window.dispatchEvent(new Event(FW_MY_LIST_CHANGED_EVENT));
  return true;
}

export function clearMyListPlantIds() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEYS.myList);
}

/**
 * Clears all planner-related saved state.
 */
export function clearAllPlannerStorage() {
  clearQuestionnaireAnswers();
  clearCachedResults();
  clearTaskChecks();
  clearMyListPlantIds();
}
