import type { QuestionnaireAnswers } from "@/types";

export type StepErrors = Partial<Record<string, string>>;

/** Validates a single questionnaire segment (0-based step index, 0..7). */
export function validateQuestionnaireStep(
  step: number,
  answers: QuestionnaireAnswers,
): StepErrors {
  const errors: StepErrors = {};
  switch (step) {
    case 0:
      if (!answers.propertySize) errors.propertySize = "Pick a yard size.";
      if (answers.ashlandAreaResident === null) {
        errors.ashlandAreaResident = "Say if you live in Ashland or not.";
      }
      if (!answers.usdaZone) errors.usdaZone = "Pick your cold-weather zone (or use ZIP to guess).";
      if (answers.defensibleZones.length === 0) {
        errors.defensibleZones =
          "Pick at least one defensible space zone you are planning for.";
      }
      break;
    case 1:
      if (!answers.irrigation) errors.irrigation = "Select your irrigation setup.";
      if (!answers.waterPreference) {
        errors.waterPreference = "Select a water-use preference.";
      }
      break;
    case 2:
      if (answers.lightPreferences.length === 0) {
        errors.lightPreferences = "Pick sunny, shady, or mixed—at least one.";
      }
      if (!answers.pollinatorImportance) {
        errors.pollinatorImportance = "Say if bees and butterflies matter to you.";
      }
      if (!answers.deerResistance) {
        errors.deerResistance = "Say if deer are a problem in your yard.";
      }
      break;
    case 3:
      if (!answers.maintenanceTime) {
        errors.maintenanceTime = "Guess how much time you’ll spend in the yard each month.";
      }
      if (!answers.physicalAbility) {
        errors.physicalAbility = "Say if ladders or lots of kneeling are hard for you.";
      }
      break;
    case 4:
      if (!answers.budgetCadence) {
        errors.budgetCadence = "Choose how you’re thinking about this budget.";
      }
      if (!answers.budget) errors.budget = "Select a budget range.";
      if (answers.sourcing.length === 0) {
        errors.sourcing = "Pick at least one place you might buy or get plants.";
      }
      break;
    case 5:
      if (answers.aesthetics.length === 0) {
        errors.aesthetics = "Pick at least one style you like.";
      }
      if (answers.colors.length === 0) {
        errors.colors = "Pick at least one color vibe (or “not picky”).";
      }
      if (answers.seasonal.length === 0) {
        errors.seasonal = "Pick at least one season you want the yard to shine.";
      }
      break;
    case 6:
      if (answers.keepExisting && !answers.keepExistingNotes.trim()) {
        errors.keepExistingNotes =
          "Write which plants you’re keeping, or turn off the “keep” switch.";
      }
      if (answers.removePlants && !answers.removePlantsNotes.trim()) {
        errors.removePlantsNotes =
          "Write what you’re removing, or turn off the “remove” switch.";
      }
      break;
    case 7:
      if (!answers.fireRisk) errors.fireRisk = "Select your perceived local risk.";
      if (answers.priorities.length === 0) {
        errors.priorities = "Pick at least one thing that matters most to you.";
      }
      break;
    default:
      break;
  }
  return errors;
}
