"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GroupSummary } from "@/lib/places/catalog";

/**
 * Category counts, computed once on the server and shared with every client
 * component that needs them (the rail, the header's category sheet, the
 * explorer). This exists so none of those components has to import the catalog
 * — doing that would pull the raw datasets into the browser bundle.
 */
const CatalogMetaContext = createContext<GroupSummary[]>([]);

export function CatalogMetaProvider({
  summaries,
  children,
}: {
  summaries: GroupSummary[];
  children: ReactNode;
}) {
  return (
    <CatalogMetaContext.Provider value={summaries}>
      {children}
    </CatalogMetaContext.Provider>
  );
}

export function useGroupSummaries(): GroupSummary[] {
  return useContext(CatalogMetaContext);
}

/** Total number of listed places, derived from the same summaries. */
export function useTotalPlaces(): number {
  return useGroupSummaries().reduce((sum, group) => sum + group.total, 0);
}
