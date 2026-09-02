import Link from "next/link";
import Icon from "@/components/Icon";
import { PageHead, Panel, Stat } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth";
import { catalogQuality, type QualityPlace } from "@/lib/data/quality";

export const dynamic = "force-dynamic";

/**
 * What the catalogue is missing, and who to fix first.
 *
 * Deliberately not a dashboard of percentages. A completeness score is
 * something to report; a list of named places with an edit link beside each
 * one is something to work through, and the difference decides whether this
 * screen gets opened twice.
 *
 * Every list is capped. 396 rows of "no description" is the same information
 * as twenty rows and a count, minus the ability to read it.
 */
const SHOWN = 12;

function PlaceList({ places }: { places: QualityPlace[] }) {
  const shown = places.slice(0, SHOWN);
  const rest = places.length - shown.length;

  return (
    <>
      <ul className="a-qlist">
        {shown.map((p) => (
          <li key={p.id}>
            <Link href={`/admin/places/${p.id}`} className="a-qlist__name">
              {p.name}
            </Link>
            <span className="a-qlist__meta">
              {p.city} · {p.categoryId}
            </span>
          </li>
        ))}
      </ul>
      {/* No "see all" link: /admin/places has no filter for these yet, and a
          link that quietly drops the filter is worse than a plain count. */}
      {rest > 0 && (
        <p className="a-qlist__more">and {rest.toLocaleString()} more.</p>
      )}
    </>
  );
}

export default async function QualityPage() {
  await requireStaff();
  const quality = await catalogQuality();

  const worst = [...quality.gaps].sort((a, b) => b.count - a.count);
  const pct = (n: number) =>
    quality.total === 0 ? "0%" : `${Math.round((n / quality.total) * 100)}%`;

  return (
    <>
      <PageHead
        title="Catalogue quality"
        sub={`${quality.total.toLocaleString()} published places. ${quality.complete.toLocaleString()} ${
          quality.complete === 1 ? "has" : "have"
        } nothing missing.`}
      />

      {/* The gaps as a queue, worst first. `attention` tints anything above
          zero, which is the same language the dashboard's queues use. */}
      <div className="a-stats">
        {worst.map((gap) => (
          <Stat
            key={gap.key}
            label={gap.label}
            value={gap.count}
            icon="alert"
            note={pct(gap.count)}
            attention
          />
        ))}
        <Stat
          label="Photo shared with another place"
          value={quality.duplicatePhotoPlaces}
          icon="image"
          note={`${quality.duplicatePhotos.length} photos`}
          attention
        />
      </div>

      {quality.complete === quality.total && (
        <p className="a-sample">
          <Icon name="check" size={16} />
          <span>
            <strong>Nothing outstanding.</strong> Every published place has a
            description, a photo of its own, an exact pin, hours, contact
            details and a rating.
          </span>
        </p>
      )}

      {/* Borrowed photos come first. A missing photo reads as incomplete; a
          photo of somewhere else reads as a claim about a place the visitor
          may be about to drive to. */}
      {quality.duplicatePhotos.length > 0 && (
        <Panel
          title={`One photo, several places (${quality.duplicatePhotos.length})`}
        >
          <p className="a-qpanel__detail">
            {quality.duplicatePhotoPlaces.toLocaleString()} places share a photo
            with at least one other. Only one of each group can be the real
            one — the rest are showing a visitor somewhere they are not going.
          </p>
          <div className="a-qdupes">
            {quality.duplicatePhotos.slice(0, 8).map((dupe) => (
              <div key={dupe.image} className="a-qdupe">
                <span className="a-qdupe__count">{dupe.places.length} places</span>
                <ul className="a-qlist">
                  {dupe.places.map((p) => (
                    <li key={p.id}>
                      <Link href={`/admin/places/${p.id}`} className="a-qlist__name">
                        {p.name}
                      </Link>
                      <span className="a-qlist__meta">{p.city}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {quality.duplicatePhotos.length > 8 && (
            <p className="a-qlist__more">
              and {quality.duplicatePhotos.length - 8} more shared photos.
            </p>
          )}
        </Panel>
      )}

      {worst
        .filter((gap) => gap.count > 0)
        .map((gap) => (
          <Panel key={gap.key} title={`${gap.label} (${gap.count.toLocaleString()})`}>
            <p className="a-qpanel__detail">{gap.detail}</p>
            <PlaceList places={gap.places} />
          </Panel>
        ))}
    </>
  );
}
