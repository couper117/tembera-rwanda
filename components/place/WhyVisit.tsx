import Icon, { type IconName } from "@/components/Icon";
import { weekHoursOf, type WeekHours } from "@/lib/places/hours";
import type { Place } from "@/lib/places/types";

/**
 * A few reasons this place might suit you, read off the record.
 *
 * Nothing here is written by hand or invented: every line is derived from a
 * field somebody filled in, so it cannot say "family friendly" about a place
 * nobody described that way. That constraint is the point — a summary that
 * guesses is worse than no summary, because a reader has no way to tell which
 * lines were earned.
 *
 * Returns null rather than a thin list. Two weak reasons look like the page is
 * padding, which costs more trust than the section earns.
 */

interface Reason {
  icon: IconName;
  text: string;
}

const MIN_REASONS = 3;

export default function WhyVisit({ place }: { place: Place }) {
  const reasons = reasonsFor(place);
  if (reasons.length < MIN_REASONS) return null;

  return (
    <section className="t-section" id="why">
      <h2 className="t-heading">Why visit</h2>
      <ul className="t-why">
        {reasons.map((reason) => (
          <li key={reason.text} className="t-why__item">
            <span className="t-why__icon">
              <Icon name={reason.icon} size={17} />
            </span>
            {reason.text}
          </li>
        ))}
      </ul>
    </section>
  );
}

function reasonsFor(place: Place): Reason[] {
  const out: Reason[] = [];
  const week: WeekHours = weekHoursOf(place);
  const haystack = [
    ...(place.highlights ?? []),
    ...(place.keywords ?? []),
    place.subtype ?? "",
    place.description ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const mentions = (...words: string[]) => words.some((w) => haystack.includes(w));

  if (place.rating !== undefined && place.rating >= 4.5 && !place.sensitive) {
    out.push({ icon: "star", text: `Highly rated — ${place.rating.toFixed(1)} out of 5` });
  }

  if (mentions("wifi", "wi-fi", "internet")) {
    out.push({ icon: "sparkle", text: "Wi-Fi available" });
  }
  if (mentions("parking", "car park")) {
    out.push({ icon: "bus", text: "Parking on site" });
  }
  if (mentions("family", "kids", "children", "playground")) {
    out.push({ icon: "user", text: "Good for families" });
  }
  if (mentions("view", "rooftop", "scenic", "panorama")) {
    out.push({ icon: "mountain", text: "Known for the view" });
  }
  if (mentions("garden", "outdoor", "terrace", "patio")) {
    out.push({ icon: "tree", text: "Outdoor seating" });
  }
  if (mentions("breakfast", "coffee", "café", "cafe")) {
    out.push({ icon: "utensils", text: "Good for breakfast or coffee" });
  }

  // Open late is a fact about the week, not a word in the description.
  const late = Object.values(week).some(
    (day) => day?.close && (day.close >= "21:00" || day.close <= "04:00"),
  );
  if (late) out.push({ icon: "clock", text: "Open late" });

  const openSunday = week.sun?.open != null;
  if (openSunday) out.push({ icon: "calendar", text: "Open on Sundays" });

  if (place.coordsPrecision === "exact") {
    out.push({ icon: "navigate", text: "Exact directions available" });
  }

  return out.slice(0, 6);
}
