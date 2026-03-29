"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useMyListPlantIds } from "@/lib/useMyListPlantIds";

const MyListIdsContext = createContext<string[] | null>(null);

export function MyListProvider({ children }: { children: ReactNode }) {
  const ids = useMyListPlantIds();
  return <MyListIdsContext.Provider value={ids}>{children}</MyListIdsContext.Provider>;
}

/** Subset of saved plant ids; empty array when used outside {@link MyListProvider}. */
export function useMyListIds(): string[] {
  return useContext(MyListIdsContext) ?? [];
}
