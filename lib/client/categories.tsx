"use client";

// The taxonomy, delivered to client components.
//
// The category tree now lives in Postgres and is admin-editable. The site
// layout loads it once on the server and hands it to this provider, so every
// client component (nav, rail, tiles, search) renders the live taxonomy
// synchronously — no per-component fetch, and edits in the admin dashboard show
// up everywhere on the next request.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { CategoryGroup } from "@/lib/places/taxonomy";

const CategoryContext = createContext<CategoryGroup[]>([]);

export function CategoryProvider({
  categories,
  children,
}: {
  categories: CategoryGroup[];
  children: ReactNode;
}) {
  return (
    <CategoryContext.Provider value={categories}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories(): CategoryGroup[] {
  return useContext(CategoryContext);
}

export function useCategoryMap(): Map<string, CategoryGroup> {
  const list = useCategories();
  return useMemo(() => new Map(list.map((g) => [g.id, g])), [list]);
}

export function useGroup(id: string): CategoryGroup | undefined {
  return useCategoryMap().get(id);
}

/** Label for a category id, falling back to the id itself. */
export function useGroupLabel(id: string): string {
  return useGroup(id)?.label ?? id;
}
