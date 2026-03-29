import type { ReactNode } from "react";
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
  SeasonalInterest,
  SourcingOption,
  TopPriority,
  UsdaZone,
  WaterPreference,
} from "@/types";
import type { QuestionnaireAnswers } from "@/types";
import { lookupZoneFromZip, normalizeZipInput } from "@/lib/zipToUsdaZone";
import type { StepErrors } from "./validation";

export type WizardExtra = {
  zipHint: string | null;
  setZipHint: (hint: string | null) => void;
};

type Patch = <K extends keyof QuestionnaireAnswers>(
  key: K,
  value: QuestionnaireAnswers[K],
) => void;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-red-700" role="alert">
      {message}
    </p>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)]"
      />
      <span>
        <span className="block font-medium text-[var(--foreground)]">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm text-[var(--muted)]">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

function budgetTierOptions(cadence: BudgetCadence | null): { value: BudgetTier; label: string }[] {
  const u = cadence === "perMonth" ? " / month" : cadence === "perYear" ? " / year" : " (project total)";
  return [
    { value: "under500", label: `Under $500${u}` },
    { value: "500_1000", label: `$500–$1,000${u}` },
    { value: "1000_2500", label: `$1,000–$2,500${u}` },
    { value: "2500_5000", label: `$2,500–$5,000${u}` },
    { value: "5000plus", label: `$5,000+${u}` },
  ];
}

const PRIORITY_CHOICES: { id: TopPriority; label: string; hint: string }[] = [
  {
    id: "fireSafety",
    label: "Fire safety",
    hint: "Prioritize lowest ignition risk and defensible-space fit.",
  },
  { id: "aesthetics", label: "Looks & layout", hint: "Prioritize form, bloom, and overall style." },
  {
    id: "lowMaintenance",
    label: "Low maintenance",
    hint: "Favor simpler care and less pruning.",
  },
  {
    id: "water",
    label: "Water conservation",
    hint: "Favor drought-tolerant and efficient water use.",
  },
  { id: "budget", label: "Budget", hint: "Favor cost-conscious sequencing and plant choices." },
];

export function renderQuestionnaireStep(
  step: number,
  answers: QuestionnaireAnswers,
  patch: Patch,
  errors: StepErrors,
  extra: WizardExtra,
): ReactNode {
  const { zipHint, setZipHint } = extra;

  switch (step) {
    case 0:
      return (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Overall lot size</h2>
            <p className="text-sm text-[var(--muted)]">
              Rough acreage helps us scale how many plant options make sense.
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.propertySize ?? ""}
              onChange={(e) => patch("propertySize", (e.target.value || null) as PropertySize | null)}
              aria-invalid={Boolean(errors.propertySize)}
            >
              <option value="">Select lot size…</option>
              <option value="small">Small (&lt;0.25 acre)</option>
              <option value="medium">Medium (0.25–0.5 acre)</option>
              <option value="large">Large (0.5–1 acre)</option>
              <option value="veryLarge">Very large (1+ acre)</option>
            </select>
            <FieldError message={errors.propertySize} />
          </section>

          <section className="space-y-3">
            <fieldset
              className="space-y-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm"
              aria-required="true"
            >
              <legend className="text-lg font-semibold text-[var(--foreground)]">
                Do you live in the Ashland area?
              </legend>
              <p className="text-sm text-[var(--muted)]">
                City of Ashland has its own wildfire–landscape plant restrictions in the Living with Fire
                catalog—separate from the wider Rogue Valley. If you answer{" "}
                <span className="text-[var(--foreground)]">yes</span>, we apply those{" "}
                <span className="text-[var(--foreground)]">Ashland</span> tags and drop plants flagged as
                noxious weeds, major invasives, or similar hard prohibitions (placement codes like P10 or P30
                still appear on cards). If you live elsewhere in the valley, choose{" "}
                <span className="text-[var(--foreground)]">no</span> for the broader regional list.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="flex cursor-pointer gap-3 rounded-lg border border-black/10 bg-[var(--surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={answers.ashlandAreaResident === true}
                    onChange={(e) => patch("ashlandAreaResident", e.target.checked ? true : null)}
                    className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)]"
                    aria-invalid={Boolean(errors.ashlandAreaResident)}
                  />
                  <span className="font-medium text-[var(--foreground)]">Yes — Ashland area (city rules apply)</span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-black/10 bg-[var(--surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={answers.ashlandAreaResident === false}
                    onChange={(e) => patch("ashlandAreaResident", e.target.checked ? false : null)}
                    className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)]"
                    aria-invalid={Boolean(errors.ashlandAreaResident)}
                  />
                  <span className="font-medium text-[var(--foreground)]">No — I live elsewhere</span>
                </label>
              </div>
            </fieldset>
            <FieldError message={errors.ashlandAreaResident} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">USDA hardiness zone</h2>
            <p className="text-sm text-[var(--muted)]">
              Enter a WA, OR, or ID ZIP for a rough zone suggestion (approximate), then confirm or adjust
              the zone.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  ZIP code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                  placeholder="e.g. 98101"
                  value={answers.addressZip}
                  onChange={(e) => {
                    patch("addressZip", normalizeZipInput(e.target.value));
                    setZipHint(null);
                  }}
                />
              </div>
              <button
                type="button"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent-strong)]"
                onClick={() => {
                  const z = lookupZoneFromZip(answers.addressZip);
                  if (z) {
                    patch("usdaZone", z);
                    setZipHint(`Suggested Zone ${z} from ZIP (approximate for PNW). You can override below.`);
                  } else {
                    setZipHint(
                      "Could not map this ZIP — pick your zone manually, or check you entered five digits (WA/OR/ID coverage).",
                    );
                  }
                }}
              >
                Look up zone
              </button>
            </div>
            {zipHint ? (
              <p className="text-sm text-[var(--muted)]" role="status">
                {zipHint}
              </p>
            ) : null}
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.usdaZone ?? ""}
              onChange={(e) => patch("usdaZone", (e.target.value || null) as UsdaZone | null)}
              aria-invalid={Boolean(errors.usdaZone)}
            >
              <option value="">Select zone…</option>
              {(["5", "6", "7", "8", "9"] as const).map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
            <FieldError message={errors.usdaZone} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Defensible space zones you’re working on
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Zone 0 hugs the home, Zone 1 is the lean, clean, green ring, and Zone 2 extends farther out.
              Select every zone you are actively planning—this is the “room around the house” from a fire
              perspective.
            </p>
            <div className="grid gap-3">
              {(
                [
                  {
                    id: "zone0" as const,
                    title: "Zone 0 (0–5 ft)",
                    hint: "Immediate home perimeter—emphasize non-combustible surfaces and ground-hugging plants.",
                  },
                  {
                    id: "zone1" as const,
                    title: "Zone 1 (5–30 ft)",
                    hint: "Well-spaced, irrigated plantings; watch ladder fuels.",
                  },
                  {
                    id: "zone2" as const,
                    title: "Zone 2 (30–100 ft)",
                    hint: "Broader landscape—fuel breaks and lower-density plantings.",
                  },
                ] satisfies { id: DefensibleZoneId; title: string; hint: string }[]
              ).map((z) => {
                const checked = answers.defensibleZones.includes(z.id);
                return (
                  <Toggle
                    key={z.id}
                    checked={checked}
                    onChange={(on) => {
                      const next = new Set(answers.defensibleZones);
                      if (on) next.add(z.id);
                      else next.delete(z.id);
                      patch("defensibleZones", [...next]);
                    }}
                    label={z.title}
                    description={z.hint}
                  />
                );
              })}
            </div>
            <FieldError message={errors.defensibleZones} />
          </section>
        </div>
      );
    case 1:
      return (
        <div className="space-y-8">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Water use</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">How water gets to the yard</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.irrigation ?? ""}
              onChange={(e) =>
                patch("irrigation", (e.target.value || null) as Irrigation | null)
              }
              aria-invalid={Boolean(errors.irrigation)}
            >
              <option value="">How do you water today?</option>
              <option value="none">No irrigation (rain-fed only)</option>
              <option value="drip">Drip irrigation</option>
              <option value="sprinkler">Sprinkler system</option>
              <option value="greywater">Greywater available</option>
            </select>
            <FieldError message={errors.irrigation} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Water-use preference</h2>
            <p className="text-sm text-[var(--muted)]">
              How thirsty are you willing to go for new plants after they’re established?
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.waterPreference ?? ""}
              onChange={(e) =>
                patch("waterPreference", (e.target.value || null) as WaterPreference | null)
              }
              aria-invalid={Boolean(errors.waterPreference)}
            >
              <option value="">Choose water posture…</option>
              <option value="drought">Drought-tolerant only</option>
              <option value="low">Low water</option>
              <option value="moderate">Moderate water OK</option>
            </select>
            <FieldError message={errors.waterPreference} />
          </section>
        </div>
      );
    case 2:
      return (
        <div className="space-y-8">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Site conditions</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Sun and shade</h2>
            <p className="text-sm text-[var(--muted)]">
              Where are you planting? Pick every pattern that applies (e.g. full sun front yard + shade
              side yard).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "fullSun" as const, title: "Mostly full sun (6+ hrs)" },
                  { id: "partSunShade" as const, title: "Mixed sun / part shade" },
                  { id: "shade" as const, title: "Shade or afternoon shade" },
                ] satisfies { id: LightPreferenceId; title: string }[]
              ).map((item) => {
                const checked = answers.lightPreferences.includes(item.id);
                return (
                  <Toggle
                    key={item.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.lightPreferences);
                      if (on) set.add(item.id);
                      else set.delete(item.id);
                      patch("lightPreferences", [...set]);
                    }}
                    label={item.title}
                  />
                );
              })}
            </div>
            <FieldError message={errors.lightPreferences} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Pollinators & habitat</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.pollinatorImportance ?? ""}
              onChange={(e) =>
                patch(
                  "pollinatorImportance",
                  (e.target.value || null) as PollinatorImportance | null,
                )
              }
              aria-invalid={Boolean(errors.pollinatorImportance)}
            >
              <option value="">How important is pollinator-friendly planting?</option>
              <option value="notImportant">Not a focus right now</option>
              <option value="nice">Nice to have</option>
              <option value="high">High priority</option>
            </select>
            <FieldError message={errors.pollinatorImportance} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Deer</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.deerResistance ?? ""}
              onChange={(e) =>
                patch("deerResistance", (e.target.value || null) as DeerResistanceNeed | null)
              }
              aria-invalid={Boolean(errors.deerResistance)}
            >
              <option value="">How much do you need deer resistance?</option>
              <option value="notImportant">Not an issue in my yard</option>
              <option value="prefer">Prefer deer-resistant when possible</option>
              <option value="must">Must be highly deer resistant</option>
            </select>
            <FieldError message={errors.deerResistance} />
          </section>
        </div>
      );
    case 3:
      return (
        <div className="space-y-8">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Maintenance level</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Time for garden care</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.maintenanceTime ?? ""}
              onChange={(e) =>
                patch("maintenanceTime", (e.target.value || null) as MaintenanceTime | null)
              }
              aria-invalid={Boolean(errors.maintenanceTime)}
            >
              <option value="">How much time monthly?</option>
              <option value="veryLow">Very low (&lt;1 hr/month)</option>
              <option value="low">Low (1–2 hrs/month)</option>
              <option value="moderate">Moderate (2–4 hrs/month)</option>
              <option value="high">High (4+ hrs/month)</option>
            </select>
            <FieldError message={errors.maintenanceTime} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Physical comfort</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.physicalAbility ?? ""}
              onChange={(e) =>
                patch("physicalAbility", (e.target.value || null) as PhysicalAbility | null)
              }
              aria-invalid={Boolean(errors.physicalAbility)}
            >
              <option value="">Accessibility preferences…</option>
              <option value="none">No restrictions</option>
              <option value="lowHeight">Prefer low-height work</option>
              <option value="minimalBending">Prefer minimal bending / kneeling</option>
            </select>
            <FieldError message={errors.physicalAbility} />
          </section>
        </div>
      );
    case 4:
      return (
        <div className="space-y-8">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Budget</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">How you count this budget</h2>
            <p className="text-sm text-[var(--muted)]">
              Same dollar bands—pick whether this is a one-time project total or a recurring spend frame.
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.budgetCadence ?? ""}
              onChange={(e) =>
                patch("budgetCadence", (e.target.value || null) as BudgetCadence | null)
              }
              aria-invalid={Boolean(errors.budgetCadence)}
            >
              <option value="">Choose cadence…</option>
              <option value="oneTime">One-time project total</option>
              <option value="perMonth">Roughly what I can spend per month</option>
              <option value="perYear">Roughly what I can spend per year</option>
            </select>
            <FieldError message={errors.budgetCadence} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Amount band</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.budget ?? ""}
              onChange={(e) => patch("budget", (e.target.value || null) as BudgetTier | null)}
              aria-invalid={Boolean(errors.budget)}
            >
              <option value="">Select a budget band…</option>
              {budgetTierOptions(answers.budgetCadence).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <FieldError message={errors.budget} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Where will you source plants?</h2>
            <div className="grid gap-3">
              {(
                [
                  {
                    id: "nativeNursery" as const,
                    title: "Native plant nursery",
                    hint: "Specialists with regional ecotypes.",
                  },
                  { id: "bigBox" as const, title: "Big box store", hint: "Convenient staples—verify tags." },
                  {
                    id: "propagate" as const,
                    title: "Propagate / grow from seed",
                    hint: "Patient, budget-friendly establishment.",
                  },
                  { id: "plantSwap" as const, title: "Community plant swap", hint: "Great for plugs and splits." },
                ] satisfies { id: SourcingOption; title: string; hint: string }[]
              ).map((s) => {
                const checked = answers.sourcing.includes(s.id);
                return (
                  <Toggle
                    key={s.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.sourcing);
                      if (on) set.add(s.id);
                      else set.delete(s.id);
                      patch("sourcing", [...set]);
                    }}
                    label={s.title}
                    description={s.hint}
                  />
                );
              })}
            </div>
            <FieldError message={errors.sourcing} />
          </section>
        </div>
      );
    case 5:
      return (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Desired aesthetic</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "naturalistic" as const, title: "Naturalistic / wild" },
                  { id: "formal" as const, title: "Structured / formal" },
                  { id: "cottage" as const, title: "Cottage garden" },
                  { id: "minimalist" as const, title: "Minimalist / gravel garden" },
                ] satisfies { id: AestheticOption; title: string }[]
              ).map((a) => {
                const checked = answers.aesthetics.includes(a.id);
                return (
                  <Toggle
                    key={a.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.aesthetics);
                      if (on) set.add(a.id);
                      else set.delete(a.id);
                      patch("aesthetics", [...set]);
                    }}
                    label={a.title}
                  />
                );
              })}
            </div>
            <FieldError message={errors.aesthetics} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Color palette</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "greens" as const, title: "Greens / foliage focus" },
                  { id: "warm" as const, title: "Warm tones (reds / oranges)" },
                  { id: "cool" as const, title: "Cool tones (blues / purples)" },
                  { id: "neutral" as const, title: "White / neutral blooms" },
                  { id: "noPreference" as const, title: "No strong preference" },
                ] satisfies { id: ColorPreference; title: string }[]
              ).map((c) => {
                const checked = answers.colors.includes(c.id);
                return (
                  <Toggle
                    key={c.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.colors);
                      if (on) set.add(c.id);
                      else set.delete(c.id);
                      patch("colors", [...set]);
                    }}
                    label={c.title}
                  />
                );
              })}
            </div>
            <FieldError message={errors.colors} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Seasonal interest</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "spring" as const, title: "Spring bloom" },
                  { id: "summer" as const, title: "Summer color" },
                  { id: "autumn" as const, title: "Autumn foliage" },
                  { id: "winter" as const, title: "Winter structure" },
                ] satisfies { id: SeasonalInterest; title: string }[]
              ).map((s) => {
                const checked = answers.seasonal.includes(s.id);
                return (
                  <Toggle
                    key={s.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.seasonal);
                      if (on) set.add(s.id);
                      else set.delete(s.id);
                      patch("seasonal", [...set]);
                    }}
                    label={s.title}
                  />
                );
              })}
            </div>
            <FieldError message={errors.seasonal} />
          </section>
        </div>
      );
    case 6:
      return (
        <div className="space-y-8">
          <div className="rounded-xl border border-[var(--accent-soft)] bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
            <p className="font-semibold text-[var(--foreground)]">What this step is for</p>
            <p className="mt-2">
              We don’t want to suggest plants that fight what you already love. If you list keepers, we fold
              them into the plan narrative. Anything you want gone becomes an urgent, first-step task in
              Phase 0 of your action plan.
            </p>
          </div>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              What’s already in your landscape?
            </h2>
            <Toggle
              checked={answers.keepExisting}
              onChange={(v) => patch("keepExisting", v)}
              label="There are plants I want to keep and work around"
              description="Describe them so new picks complement—not duplicate—them."
            />
            {answers.keepExisting ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="keep-notes">
                  What are you keeping?
                </label>
                <textarea
                  id="keep-notes"
                  className="min-h-28 w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                  value={answers.keepExistingNotes}
                  onChange={(e) => patch("keepExistingNotes", e.target.value)}
                  aria-invalid={Boolean(errors.keepExistingNotes)}
                  placeholder="Examples: mature vine maple near patio, heirloom roses…"
                />
                <FieldError message={errors.keepExistingNotes} />
              </div>
            ) : null}
          </section>
          <section className="space-y-3">
            <Toggle
              checked={answers.removePlants}
              onChange={(v) => patch("removePlants", v)}
              label="There are plants I plan to remove or replace soon"
              description="These become Phase 0 checklist items so you tackle hazards before new planting."
            />
            {answers.removePlants ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="remove-notes">
                  What should be removed or replaced?
                </label>
                <textarea
                  id="remove-notes"
                  className="min-h-28 w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                  value={answers.removePlantsNotes}
                  onChange={(e) => patch("removePlantsNotes", e.target.value)}
                  aria-invalid={Boolean(errors.removePlantsNotes)}
                  placeholder="Cedar hedge against siding, juniper under deck…"
                />
                <FieldError message={errors.removePlantsNotes} />
              </div>
            ) : null}
          </section>
        </div>
      );
    case 7:
      return (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Fire risk context</h2>
            <p className="text-sm text-[var(--muted)]">
              This is your self-assessment—pair it with local fire authority guidance for your address.
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.fireRisk ?? ""}
              onChange={(e) => patch("fireRisk", (e.target.value || null) as FireRisk | null)}
              aria-invalid={Boolean(errors.fireRisk)}
            >
              <option value="">How would you describe local risk?</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="extreme">Extreme</option>
            </select>
            <FieldError message={errors.fireRisk} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Priorities (pick any that apply)</h2>
            <p className="text-sm text-[var(--muted)]">
              We’ll balance these when ranking plants—fire performance still anchors safety.
            </p>
            <div className="grid gap-3">
              {PRIORITY_CHOICES.map((p) => {
                const checked = answers.priorities.includes(p.id);
                return (
                  <Toggle
                    key={p.id}
                    checked={checked}
                    onChange={(on) => {
                      const set = new Set(answers.priorities);
                      if (on) set.add(p.id);
                      else set.delete(p.id);
                      patch("priorities", [...set]);
                    }}
                    label={p.label}
                    description={p.hint}
                  />
                );
              })}
            </div>
            <FieldError message={errors.priorities} />
          </section>
        </div>
      );
    default:
      return null;
  }
}
