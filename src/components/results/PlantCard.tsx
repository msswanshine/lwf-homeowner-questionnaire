"use client";

import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import type { PlantValue, ScoredPlant } from "@/types";
import { getPlantById } from "@/lib/plantApi";
import { addPlantToMyList, removePlantFromMyList } from "@/lib/localStorage";
import { useMyListIds } from "./MyListProvider";

const PLACEHOLDER_IMAGE_SRC = "/plant-placeholder.png";

/** Matches filterPlants: omit API empty / literal "null" / "undefined" for tags & modal rows. */
function isJunkDisplayText(s: string): boolean {
  const t = s.trim().toLowerCase();
  return t === "" || t === "null" || t === "undefined";
}

function catalogAttributeDisplayText(v: PlantValue): string | null {
  const raw = v.rawValue;
  const resolved = v.resolved?.value;
  const s =
    resolved !== null && resolved !== undefined && String(resolved) !== ""
      ? String(resolved)
      : raw !== null && raw !== undefined
        ? String(raw)
        : "";
  if (isJunkDisplayText(s)) return null;
  return s;
}

/** One row per attribute name; values joined (API often returns one row per zone, benefit, etc.). */
function consolidatedCatalogRows(values: PlantValue[]): { name: string; text: string }[] {
  const order: string[] = [];
  const byName = new Map<string, string[]>();

  for (const v of values) {
    const piece = catalogAttributeDisplayText(v);
    if (piece === null) continue;
    const name = v.attributeName.trim();
    if (name === "") continue;

    let bucket = byName.get(name);
    if (!bucket) {
      bucket = [];
      byName.set(name, bucket);
      order.push(name);
    }
    if (!bucket.includes(piece)) bucket.push(piece);
  }

  return order.map((name) => ({
    name,
    text: byName.get(name)!.join(", "),
  }));
}

function badgeColor(label: ScoredPlant["fireResistance"]) {
  if (label === "High") return "bg-emerald-700 text-white font-bold";
  if (label === "Medium") return "bg-amber-600 text-white font-bold";
  return "bg-rose-700 text-white font-bold";
}

function tagClass(kind: "accent" | "muted") {
  if (kind === "accent") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-black/10 bg-[var(--surface-2)] text-[var(--foreground)]";
}

const IMAGE_TEXT_GRADIENT =
  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 28%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.08) 78%, transparent 100%)";

export const PlantCard = memo(function PlantCard({
  plant,
  fromMyPlan = false,
}: {
  plant: ScoredPlant;
  /** When true (My Plan panel only), saved plants show Remove instead of disabled Added. */
  fromMyPlan?: boolean;
}) {
  const titleId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const learnMoreRef = useRef<HTMLButtonElement>(null);
  const closeFallbackTimerRef = useRef<number | null>(null);

  const [hover, setHover] = useState(false);
  const [kbdFlip, setKbdFlip] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalValues, setModalValues] = useState<PlantValue[] | null>(null);
  const myListIds = useMyListIds();
  const onMyList = myListIds.includes(plant.id);

  const showBack = hover || kbdFlip || modalOpen;

  const openDetailModal = useCallback(() => {
    setModalOpen(true);
  }, []);

  const imageUrl = plant.primaryImage?.url ?? plant.images?.[0]?.url;
  const otherTags = (plant.otherWildlifeTags ?? []).filter((t) => !isJunkDisplayText(t));

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (modalOpen) {
      if (!el.open) {
        el.classList.remove("plant-detail-dialog--closing");
        el.showModal();
      }
    } else if (el.open) {
      el.classList.remove("plant-detail-dialog--closing");
      el.close();
    }
  }, [modalOpen]);

  const requestDialogClose = useCallback(() => {
    const el = dialogRef.current;
    if (!el?.open || el.classList.contains("plant-detail-dialog--closing")) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      el.close();
      return;
    }

    el.classList.add("plant-detail-dialog--closing");

    const cleanup = () => {
      if (closeFallbackTimerRef.current !== null) {
        clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
    };

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", onTransitionEnd);
      cleanup();
      el.classList.remove("plant-detail-dialog--closing");
      if (el.open) el.close();
    };

    el.addEventListener("transitionend", onTransitionEnd);
    closeFallbackTimerRef.current = window.setTimeout(() => {
      el.removeEventListener("transitionend", onTransitionEnd);
      el.classList.remove("plant-detail-dialog--closing");
      if (el.open) el.close();
      cleanup();
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (closeFallbackTimerRef.current !== null) {
        clearTimeout(closeFallbackTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!modalOpen) {
      setModalValues(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await getPlantById(plant.id);
        if (!cancelled) setModalValues(full.values);
      } catch {
        if (!cancelled) setModalValues(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, plant.id]);

  function handleDialogClose() {
    setModalOpen(false);
    learnMoreRef.current?.focus();
  }

  function handleRootKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      const t = e.target as HTMLElement;
      if (t.closest("button") || t.closest("dialog")) return;
      e.preventDefault();
      setKbdFlip((f) => !f);
    }
  }

  return (
    <>
      <article
        className={`plant-card-root group relative h-full min-h-[300px] rounded-xl bg-white outline-none print:hidden ${
          showBack ? "plant-card-root--flipped" : ""
        }`}
        aria-labelledby={titleId}
        tabIndex={0}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          if (!modalOpen) setHover(false);
        }}
        onKeyDown={handleRootKeyDown}
      >
        <div className="plant-card-flip-inner min-h-[300px]">
          {/* Front — image-first */}
          <div className="plant-card-face flex min-h-[300px] flex-col rounded-xl bg-[var(--surface-2)]">
            <div className="relative min-h-[220px] flex-1">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={plant.commonName}
                  className="absolute inset-0 size-full object-cover rounded-xl"
                  width={480}
                  height={640}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[linear-gradient(180deg,var(--surface-2),var(--accent-soft))]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={PLACEHOLDER_IMAGE_SRC}
                    alt=""
                    className="size-[45%] max-h-32 max-w-[8rem] object-contain"
                    width={128}
                    height={128}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 top-[26%] rounded-xl"
                style={{ background: IMAGE_TEXT_GRADIENT }}
              />
              <div className="absolute inset-x-0 bottom-0 z-[1] px-3 pb-3 pt-14">
                <span
                  className={`mb-2 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold shadow-sm ${badgeColor(plant.fireResistance)}`}
                >
                  {plant.fireResistance} fire resistance
                </span>
                <h3 id={titleId} className="text-base font-semibold leading-snug text-white drop-shadow-md">
                  {plant.commonName}
                </h3>
                <p className="text-xs italic leading-snug text-white/95 drop-shadow-md">
                  {plant.genus} {plant.species}
                  {plant.subspeciesVarieties ? ` ${plant.subspeciesVarieties}` : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Back — summary + Learn more opens modal */}
          <div className="plant-card-face plant-card-face--back flex flex-col rounded-xl border border-black/10 bg-white p-3 shadow-inner">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--foreground)]">
                  {plant.commonName}
                </h3>
                <button
                  type="button"
                  className={
                    fromMyPlan && onMyList
                      ? "inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-800 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                      : "inline-flex min-h-9 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white px-3 text-xs font-semibold text-[var(--accent-strong)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)]"
                  }
                  disabled={onMyList && !fromMyPlan}
                  onClick={() => {
                    if (fromMyPlan && onMyList) removePlantFromMyList(plant.id);
                    else addPlantToMyList(plant.id);
                  }}
                  aria-label={
                    onMyList
                      ? fromMyPlan
                        ? `Remove ${plant.commonName} from your list`
                        : `${plant.commonName} is already on your list`
                      : `Add ${plant.commonName} to your list`
                  }
                >
                  {onMyList ? (fromMyPlan ? "Remove" : "Added") : "Add"}
                </button>
              </div>
              <p className="text-xs italic text-[var(--muted)]">
                {plant.genus} {plant.species}
                {plant.subspeciesVarieties ? ` ${plant.subspeciesVarieties}` : ""}
              </p>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor(plant.fireResistance)}`}
              >
                {plant.fireResistance} fire resistance
              </span>
              <dl className="space-y-2 text-[11px] text-[var(--muted)]">
                <div className="flex flex-wrap gap-x-1">
                  <dt className="font-semibold text-[var(--foreground)]">Water</dt>
                  <dd>{plant.waterUseLabel ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--foreground)]">
                    Fire-safety placement (LWF)
                  </dt>
                  <dd className="mt-0.5 text-[var(--foreground)]">
                    {plant.lwfPlacementSummary ?? "—"}
                  </dd>
                </div>
                {plant.easeOfGrowthLabel ? (
                  <div>
                    <dt className="font-semibold text-[var(--foreground)]">Care note</dt>
                    <dd className="mt-0.5">{plant.easeOfGrowthLabel}</dd>
                  </div>
                ) : null}
              </dl>
              {plant.pollinatorFriendlyLabel ? (
                <div className="text-[11px]">
                  <p className="font-semibold text-[var(--foreground)]">Pollinator friendly</p>
                  <p className="text-[var(--muted)]">{plant.pollinatorFriendlyLabel}</p>
                </div>
              ) : null}
              {plant.birdFriendlyLabel ? (
                <div className="text-[11px]">
                  <p className="font-semibold text-[var(--foreground)]">Bird friendly</p>
                  <p className="text-[var(--muted)]">{plant.birdFriendlyLabel}</p>
                </div>
              ) : null}
              {otherTags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {otherTags.map((t, tagIdx) => (
                    <span
                      key={`${tagIdx}-${t}`}
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagClass("accent")}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              {plant.deerResistanceLabel ? (
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagClass("muted")}`}
                >
                  {plant.deerResistanceLabel} resistance
                </span>
              ) : null}
            </div>
            <button
              ref={learnMoreRef}
              type="button"
              className="mt-2 inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full border border-black/10 bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--accent-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
              onClick={openDetailModal}
            >
              Learn more
            </button>
          </div>
        </div>
      </article>

      <dialog
        ref={dialogRef}
        className="plant-detail-dialog text-[var(--foreground)] shadow-xl print:hidden rounded-xl"
        aria-labelledby={dialogTitleId}
        onClose={handleDialogClose}
        onCancel={(e) => {
          e.preventDefault();
          requestDialogClose();
        }}
      >
        <div className="flex max-h-[min(85vh,640px)] flex-col overflow-hidden rounded-2xl border border-black/15 bg-[var(--surface)]">
          <div className="border-b border-black/10 px-4 py-3">
            <h2 id={dialogTitleId} className="text-base font-semibold">
              {plant.commonName}
            </h2>
            <p className="text-xs italic text-[var(--muted)]">
              {plant.genus} {plant.species}
              {plant.subspeciesVarieties ? ` ${plant.subspeciesVarieties}` : ""}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-2 text-xs text-[var(--muted)]">Catalog attributes from Living with Fire</p>
            <ul className="space-y-2 text-sm">
              {consolidatedCatalogRows(modalValues ?? plant.values).map((row) => (
                <li key={row.name}>
                  <span className="font-semibold">{row.name}: </span>
                  <span>{row.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 border-t border-black/10 p-3">
            <button
              type="button"
              className={
                fromMyPlan && onMyList
                  ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rose-300 bg-white px-4 text-sm font-semibold text-rose-900 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                  : "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-black/15 bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] disabled:cursor-not-allowed disabled:border-black/10 disabled:bg-[var(--surface-2)] disabled:text-[var(--muted)]"
              }
              disabled={onMyList && !fromMyPlan}
              onClick={() => {
                if (fromMyPlan && onMyList) removePlantFromMyList(plant.id);
                else addPlantToMyList(plant.id);
              }}
              aria-label={
                onMyList
                  ? fromMyPlan
                    ? `Remove ${plant.commonName} from your list`
                    : `${plant.commonName} is on your list`
                  : `Add ${plant.commonName} to your planting list`
              }
            >
              {onMyList ? (fromMyPlan ? "Remove" : "On your list") : "Add To Planting List!"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)]"
              onClick={requestDialogClose}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
});
