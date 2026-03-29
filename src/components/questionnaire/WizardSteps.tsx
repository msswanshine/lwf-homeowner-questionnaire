import type { ReactNode } from "react";
import type {
  AestheticOption,
  BudgetCadence,
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

const PRIORITY_CHOICES: { id: TopPriority; label: string; hint: string }[] = [
  {
    id: "fireSafety",
    label: "Fire safety comes first",
    hint: "I want plants that are safer if a fire gets close to the house.",
  },
  { id: "aesthetics", label: "How it looks", hint: "I care a lot about pretty flowers, shapes, and style." },
  {
    id: "lowMaintenance",
    label: "Easy to take care of",
    hint: "I don’t want plants that need tons of trimming and fuss.",
  },
  {
    id: "water",
    label: "Saving water",
    hint: "I want plants that don’t need a lot of watering.",
  },
  { id: "budget", label: "Saving money", hint: "I need to keep costs sensible." },
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
          <p className="text-sm font-medium text-[var(--accent-strong)]">Your place</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">How big is your yard?</h2>
            <p className="text-sm text-[var(--muted)]">
              Not exact science—just so we don’t suggest a zillion plants for a tiny lot (or too few for a
              huge one).
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.propertySize ?? ""}
              onChange={(e) => patch("propertySize", (e.target.value || null) as PropertySize | null)}
              aria-invalid={Boolean(errors.propertySize)}
            >
              <option value="">Pick one…</option>
              <option value="small">Pretty small (about under 1/4 acre)</option>
              <option value="medium">Medium (about 1/4 to 1/2 acre)</option>
              <option value="large">Large (about 1/2 to 1 acre)</option>
              <option value="veryLarge">Really big (about 1 acre or more)</option>
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
                Ashland has <span className="text-[var(--foreground)]">extra plant rules</span> to help
                with wildfire safety. If you live there, say yes—we’ll hide plants the rules say “no way”
                to (like nasty weeds or super-risky ones). If you don’t live in Ashland, say no and we’ll
                use the bigger list for your part of the region.
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
                  <span className="font-medium text-[var(--foreground)]">Yes, I live in Ashland</span>
                </label>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-black/10 bg-[var(--surface)] px-4 py-3">
                  <input
                    type="checkbox"
                    checked={answers.ashlandAreaResident === false}
                    onChange={(e) => patch("ashlandAreaResident", e.target.checked ? false : null)}
                    className="mt-1 size-5 rounded border border-black/20 accent-[var(--accent)]"
                    aria-invalid={Boolean(errors.ashlandAreaResident)}
                  />
                  <span className="font-medium text-[var(--foreground)]">Nope, I live somewhere else</span>
                </label>
              </div>
            </fieldset>
            <FieldError message={errors.ashlandAreaResident} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">How cold does it get where you are?</h2>
            <p className="text-sm text-[var(--muted)]">
              Landscapers call this your “hardiness zone.” Type your ZIP if you’re in Washington, Oregon,
              or Idaho—we’ll guess a zone (close, not perfect). Then pick the zone that matches you.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Your ZIP code
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
                    setZipHint(
                      `We think you’re around Zone ${z}. If that sounds wrong, just pick a different zone below.`,
                    );
                  } else {
                    setZipHint(
                      "We couldn’t guess from that ZIP—use 5 digits, and for now we only auto-guess in WA, OR, and ID. Or just pick your zone yourself below.",
                    );
                  }
                }}
              >
                Guess zone from ZIP
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
              <option value="">Pick your zone…</option>
              {(["5", "6", "7", "8", "9"] as const).map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
            <FieldError message={errors.usdaZone} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Defensible space zones</h2>
            <p className="text-sm text-[var(--muted)]">
              Zone 1 is closest to the home, Zone 2 is the lean, clean, green ring, and Zone 3 extends farther
              out. Select every zone you are actively planning—this is the “room around the house” from a fire
              perspective.{" "}
              <a
                href="https://wfca.com/wildfire-articles/firewise-defensible-space/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              >
                More about Firewise defensible space (opens in new tab)
              </a>
            </p>
            <div className="grid gap-3">
              {(
                [
                  {
                    id: "zone1" as const,
                    title: "Zone 1 (0–5 ft)",
                    hint: "Immediate home perimeter—emphasize non-combustible surfaces and ground-hugging plants.",
                  },
                  {
                    id: "zone2" as const,
                    title: "Zone 2 (5–30 ft)",
                    hint: "Well-spaced, irrigated plantings; watch ladder fuels.",
                  },
                  {
                    id: "zone3" as const,
                    title: "Zone 3 (30–100 ft)",
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
          <p className="text-sm font-medium text-[var(--accent-strong)]">Sun, bees, and deer</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Is it sunny or shady where you’ll plant?</h2>
            <p className="text-sm text-[var(--muted)]">
              Check every one that fits—like “sunny in front, shady on the side.”
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "fullSun" as const, title: "Lots of sun most of the day" },
                  { id: "partSunShade" as const, title: "Some sun, some shade" },
                  { id: "shade" as const, title: "Pretty shady (or shady in the afternoon)" },
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Do you want plants that help bees, butterflies, and other pollinators?</h2>
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
              <option value="">Pick one…</option>
              <option value="notImportant">Not really thinking about that</option>
              <option value="nice">Yeah, that’d be cool if it happens</option>
              <option value="high">Big yes! I want to help pollinators on purpose</option>
            </select>
            <FieldError message={errors.pollinatorImportance} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Is your yard a deer buffet?</h2>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.deerResistance ?? ""}
              onChange={(e) =>
                patch("deerResistance", (e.target.value || null) as DeerResistanceNeed | null)
              }
              aria-invalid={Boolean(errors.deerResistance)}
            >
              <option value="">Pick one…</option>
              <option value="notImportant">Deer aren’t really a thing here</option>
              <option value="prefer">Sometimes—I’d like deer-safe plants when we can</option>
              <option value="must">Yes, and I need plants they usually leave alone</option>
            </select>
            <FieldError message={errors.deerResistance} />
          </section>
        </div>
      );
    case 3:
      return (
        <div className="space-y-8">
          <p className="text-sm font-medium text-[var(--accent-strong)]">Time and your body</p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              How much time do you want to spend in the yard each month?
            </h2>
            <p className="text-sm text-[var(--muted)]">Just a guess is fine—not a contract.</p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.maintenanceTime ?? ""}
              onChange={(e) =>
                patch("maintenanceTime", (e.target.value || null) as MaintenanceTime | null)
              }
              aria-invalid={Boolean(errors.maintenanceTime)}
            >
              <option value="">Pick one…</option>
              <option value="veryLow">Almost none—like under an hour a month</option>
              <option value="low">A little—about 1–2 hours a month</option>
              <option value="moderate">Some—about 2–4 hours a month</option>
              <option value="high">I’m out there a lot—4+ hours a month</option>
            </select>
            <FieldError message={errors.maintenanceTime} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Anything physical limitations we should know?</h2>
            <p className="text-sm text-[var(--muted)]">
              So we don’t only suggest plants that need you on a tall ladder or crawling on your knees.
            </p>
            <select
              className="w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
              value={answers.physicalAbility ?? ""}
              onChange={(e) =>
                patch("physicalAbility", (e.target.value || null) as PhysicalAbility | null)
              }
              aria-invalid={Boolean(errors.physicalAbility)}
            >
              <option value="">Pick one…</option>
              <option value="none">Nope, I’m good</option>
              <option value="lowHeight">I’d rather not need a tall ladder</option>
              <option value="minimalBending">I’d rather not kneel or bend a ton</option>
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Dollar amount</h2>
            <p className="text-sm text-[var(--muted)]">
              Whole dollars only, rounded. You’ll say next whether this is for the whole project, each month, or
              each year.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-medium text-[var(--foreground)]" aria-hidden>
                $
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="e.g. 1500"
                className="min-w-[12rem] flex-1 rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                value={answers.budgetAmountDollars === null ? "" : String(answers.budgetAmountDollars)}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === "") {
                    patch("budgetAmountDollars", null);
                    return;
                  }
                  const n = Number.parseInt(v, 10);
                  if (!Number.isFinite(n) || n < 0) return;
                  patch("budgetAmountDollars", Math.min(99_999_999, n));
                }}
                aria-invalid={Boolean(errors.budgetAmountDollars)}
              />
            </div>
            <FieldError message={errors.budgetAmountDollars} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">This amount is for…</h2>
            <p className="text-sm text-[var(--muted)]">Pick the option that matches how you think about this number.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  { value: "oneTime" as const, label: "Whole project", hint: "One-time total for this effort." },
                  {
                    value: "perMonth" as const,
                    label: "Each month",
                    hint: "Roughly what you can spend per month.",
                  },
                  { value: "perYear" as const, label: "Each year", hint: "Roughly what you can spend per year." },
                ] satisfies { value: BudgetCadence; label: string; hint: string }[]
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 shadow-sm ${
                    answers.budgetCadence === opt.value
                      ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]/60"
                      : "border-black/15 bg-white"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="budgetCadence"
                      className="mt-1 accent-[var(--accent)]"
                      checked={answers.budgetCadence === opt.value}
                      onChange={() => patch("budgetCadence", opt.value)}
                    />
                    <span className="font-medium text-[var(--foreground)]">{opt.label}</span>
                  </span>
                  <span className="pl-7 text-sm text-[var(--muted)]">{opt.hint}</span>
                </label>
              ))}
            </div>
            <FieldError message={errors.budgetCadence} />
          </section>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Where will you probably get plants?</h2>
            <p className="text-sm text-[var(--muted)]">Check every place you might use—more than one is fine.</p>
            <div className="grid gap-3">
              {(
                [
                  {
                    id: "nativeNursery" as const,
                    title: "A native-plant nursery",
                    hint: "People who really know local plants.",
                  },
                  {
                    id: "bigBox" as const,
                    title: "A big home-improvement store",
                    hint: "Handy, but read the tags so it’s the right plant for here.",
                  },
                  {
                    id: "propagate" as const,
                    title: "Growing my own (cuttings, seeds…)",
                    hint: "Cheaper, just takes patience.",
                  },
                  {
                    id: "plantSwap" as const,
                    title: "Swaps with neighbors or community events",
                    hint: "Fun way to share little plants or divisions.",
                  },
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
          <p className="text-sm font-medium text-[var(--accent-strong)]">Look & feel</p>
          <p className="text-sm text-[var(--muted)]">
            No wrong answers—just what you like. You can pick more than one vibe.
          </p>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">What style feels good to you?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "naturalistic" as const, title: "Wild and natural (like a mini meadow)" },
                  { id: "formal" as const, title: "Neat and tidy with clear shapes" },
                  { id: "cottage" as const, title: "Cozy cottage garden—full and flowery" },
                  { id: "minimalist" as const, title: "Simple and calm (lots of rocks or gravel is OK)" },
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Favorite colors in the garden</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "greens" as const, title: "Mostly green leaves—flowers not the main event" },
                  { id: "warm" as const, title: "Warm colors (reds, oranges, yellows)" },
                  { id: "cool" as const, title: "Cool colors (blues, purples)" },
                  { id: "neutral" as const, title: "White or soft, quiet flower colors" },
                  { id: "noPreference" as const, title: "Whatever looks good—I’m not picky" },
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">When should the yard look exciting?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { id: "spring" as const, title: "Spring—first flowers and fresh growth" },
                  { id: "summer" as const, title: "Summer—lots of color" },
                  { id: "autumn" as const, title: "Fall—leaf color and texture" },
                  { id: "winter" as const, title: "Winter—interesting shapes even when bare" },
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
            <p className="font-semibold text-[var(--foreground)]">Why we ask</p>
            <p className="mt-2">
              If you already have plants you love, we won’t act like the yard is empty—those go into your
              plan story. If something needs to go (because it’s risky or you’re over it), we put that on a
              “do this first” list before new planting.
            </p>
          </div>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">What’s out there already?</h2>
            <Toggle
              checked={answers.keepExisting}
              onChange={(v) => patch("keepExisting", v)}
              label="There are plants I want to keep"
              description="Tell us what they are so new plants play nice with them."
            />
            {answers.keepExisting ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="keep-notes">
                  Which plants are stayers?
                </label>
                <textarea
                  id="keep-notes"
                  className="min-h-28 w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                  value={answers.keepExistingNotes}
                  onChange={(e) => patch("keepExistingNotes", e.target.value)}
                  aria-invalid={Boolean(errors.keepExistingNotes)}
                  placeholder="Example: the maple by the porch, Grandma's rosebush..."
                />
                <FieldError message={errors.keepExistingNotes} />
              </div>
            ) : null}
          </section>
          <section className="space-y-3">
            <Toggle
              checked={answers.removePlants}
              onChange={(v) => patch("removePlants", v)}
              label="There are plants I want to rip out or swap soon"
              description="We’ll nudge you to handle these before you put new stuff in."
            />
            {answers.removePlants ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="remove-notes">
                  What’s on the remove/replace list?
                </label>
                <textarea
                  id="remove-notes"
                  className="min-h-28 w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-base shadow-sm"
                  value={answers.removePlantsNotes}
                  onChange={(e) => patch("removePlantsNotes", e.target.value)}
                  aria-invalid={Boolean(errors.removePlantsNotes)}
                  placeholder="Example: hedge scrunched against the house, spiky bush under the deck..."
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
            <h2 className="text-lg font-semibold text-[var(--foreground)]">What matters most to you? (pick any)</h2>
            <p className="text-sm text-[var(--muted)]">
              We’ll juggle these when we sort plants—safety around fire still comes first in the math.
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
