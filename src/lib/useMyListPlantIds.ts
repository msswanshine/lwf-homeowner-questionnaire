"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  FW_MY_LIST_CHANGED_EVENT,
  MY_LIST_LS_KEY,
  loadMyListPlantIds,
} from "@/lib/localStorage";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onCustom = () => onChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === MY_LIST_LS_KEY) onChange();
  };
  window.addEventListener(FW_MY_LIST_CHANGED_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(FW_MY_LIST_CHANGED_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function snapshotJson(): string {
  return JSON.stringify(loadMyListPlantIds());
}

export function useMyListPlantIds(): string[] {
  const json = useSyncExternalStore(subscribe, snapshotJson, () => "[]");
  return useMemo(() => {
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
    } catch {
      return [];
    }
  }, [json]);
}
