/**
 * Builds phased action items from saved answers and the scored plant list.
 */

import type { ActionPlanStage, QuestionnaireAnswers, ScoredPlant } from "@/types";

function budgetCadenceSentence(answers: QuestionnaireAnswers): string {
  if (answers.budgetCadence === "perMonth") {
    return "You entered budget as a monthly figure—pace shopping and labor across the season to stay within that rhythm.";
  }
  if (answers.budgetCadence === "perYear") {
    return "You entered budget as a yearly envelope—split larger installs across spring and fall to match cash flow.";
  }
  return "You entered budget as a one-time project total—keep phases sequential until that amount is spent.";
}

function budgetNarrative(answers: QuestionnaireAnswers): string {
  const cadence = budgetCadenceSentence(answers);
  let detail: string;
  switch (answers.budget) {
    case "under500":
      detail =
        "Phase 2 focuses on smaller containers and fast-impact swaps that fit a tight budget.";
      break;
    case "500_1000":
    case "1000_2500":
      detail =
        "Phase 2 sequences medium-sized purchases with a few anchor shrubs first.";
      break;
    case "2500_5000":
    case "5000plus":
      detail =
        "Phase 2 can include larger specimens; still stage work outward from the home.";
      break;
    default:
      detail =
        "Phase 2 sequences plantings from the home outward, pacing purchases to your budget.";
  }
  return `${cadence} ${detail}`;
}

/**
 * Produces default phases for the accordion UI (Phase 0–4).
 */
export function generateActionPlan(
  answers: QuestionnaireAnswers,
  plants: ScoredPlant[],
): ActionPlanStage[] {
  const phases: ActionPlanStage[] = [];

  const removalTasks =
    answers.removePlants && answers.removePlantsNotes.trim().length
      ? [
          {
            id: "p0-remove",
            label: `Remove or isolate flagged plants: ${answers.removePlantsNotes.trim()}`,
          },
        ]
      : [];

  const debrisTask =
    answers.fireRisk === "high" || answers.fireRisk === "extreme"
      ? {
          id: "p0-debris",
          label: "Increase debris removal frequency within 30 ft of structures this season.",
        }
      : null;

  phases.push({
    id: "phase-0",
    title: "Phase 0 — Remove hazards",
    body:
      answers.removePlants || debrisTask
        ? "Handle removals and urgent housekeeping before adding new plants."
        : "No removals flagged—still walk the site for dead material and ladder fuels.",
    tasks: [
      ...removalTasks,
      ...(debrisTask ? [debrisTask] : []),
      {
        id: "p0-walkthrough",
        label: "Walk Zone 0–1 and remove dead branches, leaves on roofs, and clutter against siding.",
      },
    ],
  });

  const zone0Plants = plants.filter((p) => p.recommendedZones.includes("zone0"));
  phases.push({
    id: "phase-1",
    title: "Phase 1 — Zone 0 (0–5 ft)",
    body: "Keep the immediate perimeter lean, hydrated, and low—favor ground-hugging choices from your list.",
    tasks: [
      {
        id: "p1-hardscape",
        label:
          "Add or maintain non-combustible breaks (gravel, stone, pavers) where plants touch foundations.",
      },
      ...zone0Plants.slice(0, 6).map((p) => ({
        id: `p1-${p.id}`,
        label: `Plant / refresh: ${p.commonName} (${p.fireResistance} fire resistance)`,
      })),
    ],
  });

  const zone1Plants = plants.filter((p) => p.recommendedZones.includes("zone1"));
  phases.push({
    id: "phase-2",
    title: "Phase 2 — Zone 1 (5–30 ft)",
    body: budgetNarrative(answers),
    tasks: zone1Plants.slice(0, 10).map((p) => ({
      id: `p2-${p.id}`,
      label: `Install ${p.commonName} — keep spacing per mature width; mulch with non-combustible options near structures.`,
    })),
  });

  const zone2Plants = plants.filter((p) => p.recommendedZones.includes("zone2"));
  phases.push({
    id: "phase-3",
    title: "Phase 3 — Zone 2 (30–100 ft)",
    body: "Longer-term canopy and structural plants—pace irrigation work with the season.",
    tasks: zone2Plants.slice(0, 8).map((p) => ({
      id: `p3-${p.id}`,
      label: `Plan ${p.commonName} for mid-field placement with defensible spacing.`,
    })),
  });

  const priorityLine =
    answers.priorities.length > 0
      ? `You said these matter: ${answers.priorities.join(", ")}—use that lens when choosing between plant options.`
      : "";

  phases.push({
    id: "phase-4",
    title: "Phase 4 — Ongoing maintenance",
    body: `Keep fuels broken up, irrigation predictable, and revisit the plan each spring.${priorityLine ? ` ${priorityLine}` : ""}`,
    tasks: [
      {
        id: "p4-water",
        label: `Watering cadence: ${answers.irrigation === "none" ? "Rain-fed—prioritize establishment watering for new plants." : "Align controller schedules with drought periods and wind events."}`,
      },
      {
        id: "p4-prune",
        label: "Prune for ladder-fuel removal—raise canopies where shrubs grow under trees.",
      },
      {
        id: "p4-review",
        label: "Schedule an annual review before fire season; update this plan as plants mature.",
      },
    ],
  });

  if (answers.keepExisting && answers.keepExistingNotes.trim()) {
    phases[1]?.tasks.unshift({
      id: "p1-keep",
      label: `Preserve noted favorites: ${answers.keepExistingNotes.trim()}`,
    });
  }

  return phases;
}
