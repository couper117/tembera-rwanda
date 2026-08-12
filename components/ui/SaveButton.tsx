"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { useSaved } from "@/lib/client/saved";

interface Props {
  placeId: string;
  placeName: string;
  /** "floating" sits over card media; "inline" sits in a toolbar. */
  variant?: "floating" | "inline";
  size?: number;
}

export default function SaveButton({
  placeId,
  placeName,
  variant = "floating",
  size = 18,
}: Props) {
  const { isSaved, toggle, ready } = useSaved();
  const [popping, setPopping] = useState(false);
  const saved = isSaved(placeId);

  // Reset the pop animation class so it can replay on the next save.
  useEffect(() => {
    if (!popping) return;
    const timer = setTimeout(() => setPopping(false), 340);
    return () => clearTimeout(timer);
  }, [popping]);

  const className =
    variant === "floating"
      ? `t-save${popping ? " t-save--pop" : ""}`
      : `t-iconbtn${saved ? " t-iconbtn--active" : ""}${popping ? " t-save--pop" : ""}`;

  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${placeName} from saved` : `Save ${placeName}`}
      // Cards are links; saving must not navigate.
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!saved) setPopping(true);
        toggle(placeId);
      }}
      // Avoid rendering a "saved" state before storage has been read.
      disabled={!ready}
    >
      <Icon name="bookmark" size={size} filled={saved} />
    </button>
  );
}
