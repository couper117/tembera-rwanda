"use client";

import { useEffect, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/Icon";
import { categoryIcon, categoryTint } from "@/components/ui/categoryIcon";
import type { CategoryId } from "@/lib/places/types";

interface Props {
  src?: string;
  alt: string;
  className?: string;
  /** Drives the placeholder glyph when the image is missing or fails. */
  categoryId?: CategoryId;
  fallbackIcon?: IconName;
  sizes?: string;
}

/**
 * Some legacy image URLs are dead (a removed Flickr upload, a couple of
 * `googleusercontent` links that never resolved). A broken-image glyph looks
 * like a bug; this degrades to a calm branded placeholder instead.
 */
export default function PlaceImage({
  src,
  alt,
  className,
  categoryId,
  fallbackIcon,
  sizes,
}: Props) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The server sends the <img> in the HTML, so a dead URL can 404 before React
  // hydrates — and that error event is gone by the time onError is attached.
  // Checking naturalWidth on mount catches those; onError catches the rest.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        className="t-imgfallback"
        role="img"
        aria-label={alt}
        style={{ background: categoryTint(categoryId) }}
      >
        <Icon
          name={fallbackIcon ?? (categoryId ? categoryIcon(categoryId) : "image")}
          size={26}
        />
      </div>
    );
  }

  return (
    // Sources are ~40 different remote hosts plus inline data: URIs, so
    // next/image would need every one allow-listed for no real benefit here.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
