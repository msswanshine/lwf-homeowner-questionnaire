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
      if (!answers.propertySize) errors.propertySize = "Choose a property size.";
      if (!answers.nearHomePlantingSpace) {
        errors.nearHomePlantingSpace =
          "Estimate how much planted space you have close to the home.";
      }
      if (!answers.usdaZone) errors.usdaZone = "Select or look up your USDA zone.";
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
        errors.lightPreferences = "Pick at least one sun/shade pattern.";
      }
      if (!answers.pollinatorImportance) {
        errors.pollinatorImportance = "Select how much pollinator value matters.";
      }
      if (!answers.deerResistance) {
        errors.deerResistance = "Select deer resistance importance.";
      }
      break;
    case 3:
      if (!answers.maintenanceTime) {
        errors.maintenanceTime = "Estimate maintenance time.";
      }
      if (!answers.physicalAbility) {
        errors.physicalAbility = "Select accessibility preferences.";
      }
      break;
    case 4:
      if (!answers.budgetCadence) {
        errors.budgetCadence = "Choose how you’re thinking about this budget.";
      }
      if (!answers.budget) errors.budget = "Select a budget range.";
      if (answers.sourcing.length === 0) {
        errors.sourcing = "Pick at least one sourcing option.";
      }
      break;
    case 5:
      if (answers.aesthetics.length === 0) {
        errors.aesthetics = "Choose at least one aesthetic direction.";
      }
      if (answers.colors.length === 0) {
        errors.colors = "Pick at least one color direction (or “No preference”).";
      }
      if (answers.seasonal.length === 0) {
        errors.seasonal = "Select at least one season of interest.";
      }
      break;
    case 6:
      if (answers.keepExisting && !answers.keepExistingNotes.trim()) {
        errors.keepExistingNotes = "Tell us what you are keeping, or turn this off.";
      }
      if (answers.removePlants && !answers.removePlantsNotes.trim()) {
        errors.removePlantsNotes = "List what should be removed, or turn this off.";
      }
      break;
    case 7:
      if (!answers.fireRisk) errors.fireRisk = "Select your perceived local risk.";
      if (answers.priorities.length === 0) {
        errors.priorities = "Pick at least one priority.";
      }
      break;
    default:
      break;
  }
  return errors;
}
