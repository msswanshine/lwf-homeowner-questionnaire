import { groupPlantsByZone } from "@/lib/filterPlants";
import { formatQuestionnaireForPrint } from "@/lib/questionnairePrintSummary";
import type { DefensibleZoneId, QuestionnaireAnswers, ScoredPlant } from "@/types";

const ZONE_LABEL: Record<DefensibleZoneId, string> = {
  zone1: "Zone 1 — 0 to 5 ft",
  zone2: "Zone 2 — 5 to 30 ft",
  zone3: "Zone 3 — 30 to 100 ft",
};

function scientificLine(plant: ScoredPlant): string {
  const sub = plant.subspeciesVarieties ? ` ${plant.subspeciesVarieties}` : "";
  return `${plant.genus} ${plant.species}${sub}`;
}

function nonJunkTag(t: string): boolean {
  const x = t.trim().toLowerCase();
  return x !== "" && x !== "null" && x !== "undefined";
}

function wildlifePrintCell(plant: ScoredPlant): string {
  const parts: string[] = [];
  if (plant.pollinatorFriendlyLabel) {
    parts.push(`Pollinator: ${plant.pollinatorFriendlyLabel}`);
  }
  if (plant.birdFriendlyLabel) {
    parts.push(`Bird: ${plant.birdFriendlyLabel}`);
  }
  const tags = (plant.otherWildlifeTags ?? []).filter(nonJunkTag);
  if (tags.length) {
    parts.push(tags.join(", "));
  }
  return parts.length > 0 ? parts.join(" | ") : "—";
}

export function PlantResultsPrintTables({
  grouped,
  myPlanPlants,
  answers,
}: {
  grouped: Record<DefensibleZoneId, ScoredPlant[]>;
  /** When non-empty, print/PDF uses these selections (My Plan) instead of the full recommendation set. */
  myPlanPlants: ScoredPlant[];
  /** Questionnaire inputs used to generate recommendations (same session as this printout). */
  answers: QuestionnaireAnswers | null;
}) {
  const printFromMyPlan = myPlanPlants.length > 0;
  const groupedForPrint = printFromMyPlan ? groupPlantsByZone(myPlanPlants) : grouped;
  const answerLines = answers ? formatQuestionnaireForPrint(answers) : null;

  return (
    <div className="print-plant-report hidden space-y-5 print:block">
      {answerLines ? (
        <section className="print-answers-summary" aria-label="Your questionnaire inputs">
          <h2 className="print-answers-title">Your inputs</h2>
          <table className="print-answers-table">
            <tbody>
              {answerLines.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
      <div className="print-report-heading">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          FireWise plant list
        </p>
        <h1 className="text-base font-bold text-[var(--foreground)]">
          {printFromMyPlan ? "My selected plants" : "Recommended plants"}
        </h1>
        {printFromMyPlan ? (
          <p className="mt-1 max-w-[5.5in] text-[10px] leading-snug text-[var(--muted)]">
            From your My Plan list — plants you chose for your property (print or save as PDF from the results
            page).
          </p>
        ) : null}
      </div>
      {(["zone1", "zone2", "zone3"] as const).map((zone) => {
        const list = groupedForPrint[zone];
        if (!list.length) return null;
        return (
          <section key={zone} className="print-zone-section">
            <h2 className="print-zone-title">{ZONE_LABEL[zone]}</h2>
            <table className="print-plant-table">
              <thead>
                <tr>
                  <th scope="col" className="print-col-img" />
                  <th scope="col">Name</th>
                  <th scope="col">Scientific</th>
                  <th scope="col">Water</th>
                  <th scope="col">Care</th>
                  <th scope="col">Fire</th>
                  <th scope="col">Wildlife</th>
                  <th scope="col">Deer</th>
                  <th scope="col">LWF placement &amp; care</th>
                </tr>
              </thead>
              <tbody>
                {list.map((plant, rowIdx) => {
                  const imageUrl = plant.primaryImage?.url ?? plant.images?.[0]?.url;
                  const wildlife = wildlifePrintCell(plant);
                  const deer = plant.deerResistanceLabel?.replace(/^Deer:\s*/i, "") ?? "—";
                  const placement = plant.lwfPlacementSummary ?? "—";
                  const ease = plant.easeOfGrowthLabel?.trim();
                  const careCell = ease ? `${placement} · ${ease}` : placement;
                  return (
                    <tr key={`print-${zone}-${plant.id ?? "na"}-${rowIdx}`}>
                      <td className="print-col-img">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="print-plant-thumb"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <span className="print-thumb-placeholder" aria-hidden>
                            —
                          </span>
                        )}
                      </td>
                      <td className="print-nowrap">{plant.commonName}</td>
                      <td className="print-scientific">{scientificLine(plant)}</td>
                      <td>{plant.waterUseLabel ?? "—"}</td>
                      <td className="print-nowrap">{plant.maintenanceLabel ?? "—"}</td>
                      <td className="print-nowrap">{plant.fireResistance}</td>
                      <td className="print-wrap">{wildlife}</td>
                      <td className="print-wrap">{deer}</td>
                      <td className="print-wrap">{careCell}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
