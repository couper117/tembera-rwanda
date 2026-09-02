"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import PlaceImage from "@/components/ui/PlaceImage";
import Spinner from "@/components/ui/Spinner";
import { useSaved } from "@/lib/client/saved";
import type { CategoryId } from "@/lib/places/types";

/**
 * The saved list, under the bookmark in the header.
 *
 * The icon used to be a link straight to `/saved`, which meant "did I save
 * this?" cost a page load and a trip back. A menu answers it in place, and
 * still offers the full screen for the times you actually want it.
 *
 * The ids live in the browser (guest) or the session (account), but nothing in
 * the header knows what they point at, so the names are fetched on open rather
 * than shipped to every page in a context. Six rows do not justify handing the
 * whole catalogue to every visitor.
 */

interface Summary {
  id: string;
  name: string;
  categoryId: CategoryId;
  subtype?: string;
  city: string;
  image?: string;
}

/** How many fit under a header without the menu becoming a page. */
const PREVIEW = 6;

export default function SavedMenu({ onNavigate }: { onNavigate: () => void }) {
  const { ids, ready, synced } = useSaved();
  const [places, setPlaces] = useState<Summary[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Newest saves first — the one you just tapped is the one you are looking
  // for. `ids` is append-ordered, so the list is simply reversed.
  const wanted = [...ids].reverse().slice(0, PREVIEW);
  const key = wanted.join(",");

  useEffect(() => {
    if (!ready || wanted.length === 0) {
      setPlaces([]);
      return;
    }

    let live = true;
    setFailed(false);
    fetch(`/api/places/summary?ids=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => live && setPlaces(data.places ?? []))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
    // `key` is the content of `wanted`; depending on the array itself would
    // refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ready]);

  return (
    <div className="t-menu">
      <div className="t-menu__head">
        <span className="t-menu__headtitle">Saved places</span>
        {ready && ids.length > 0 && <span className="t-badge">{ids.length}</span>}
      </div>

      {!ready || (places === null && !failed) ? (
        <div className="t-menu__empty">
          <Spinner size={18} label="Loading your saved places" />
        </div>
      ) : failed ? (
        <div className="t-menu__empty">
          <p className="t-menu__emptytext">That did not load. Open the saved screen instead.</p>
        </div>
      ) : ids.length === 0 ? (
        <div className="t-menu__empty">
          <span className="t-menu__emptyicon">
            <Icon name="bookmark" size={20} />
          </span>
          <p className="t-menu__emptytext">
            Nothing saved yet. Tap the bookmark on any place to keep it here.
          </p>
        </div>
      ) : (
        places?.map((place) => (
          <Link
            key={place.id}
            href={`/place/${place.id}`}
            className="t-menuplace"
            onClick={onNavigate}
          >
            <PlaceImage
              src={place.image}
              alt=""
              className="t-menuplace__img"
              categoryId={place.categoryId}
              seed={place.id}
            />
            <span className="t-menuplace__body">
              <span className="t-menuplace__name">{place.name}</span>
              <span className="t-menuplace__note">
                {[place.subtype, place.city].filter(Boolean).join(" · ")}
              </span>
            </span>
          </Link>
        ))
      )}

      <div className="t-menu__foot">
        <Link href="/saved" className="t-menu__item" onClick={onNavigate}>
          <Icon name="bookmark" size={17} />
          {ids.length > PREVIEW ? `All ${ids.length} saved places` : "Open saved places"}
        </Link>
        {ready && !synced && ids.length > 0 && (
          <p className="t-menu__hint">
            Saved in this browser. <Link href="/login">Sign in</Link> to keep them.
          </p>
        )}
      </div>
    </div>
  );
}
