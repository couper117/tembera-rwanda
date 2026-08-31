"use client";

import { useState } from "react";
import CategoryChips from "@/components/home/CategoryChips";
import NearYou from "@/components/home/NearYou";
import TopRated from "@/components/home/TopRated";
import type { Place } from "@/lib/places/types";

interface Props {
  /** Nearest-N rows, keyed by category id plus "all". */
  nearby: Record<string, Place[]>;
  /** Top-rated rows, same keys. */
  rated: Record<string, Place[]>;
  /** Cards per row — the same number the server ranked. */
  limit: number;
}

/**
 * The filtered part of the landing page: chips, then the two rows they act on.
 *
 * The chips own no data of their own; they set one id here and both rows read
 * it. That is the whole reason this wrapper exists — the alternative was a URL
 * parameter and a server round trip for what should feel instant.
 */
export default function HomeFeed({ nearby, rated, limit }: Props) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <>
      <CategoryChips active={active} onChange={setActive} />
      <NearYou rows={nearby} categoryId={active} limit={limit} />
      <TopRated rows={rated} categoryId={active} />
    </>
  );
}
