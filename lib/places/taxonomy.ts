// The Tembera category tree.
//
// Two levels: sixteen groups, each with the subcategories a user would
// recognise. A place always has a group (`categoryId`) and a subcategory; it
// may also carry a finer `subtype` already present in the source data
// (a denomination, a room type), which the browser offers as a second filter.
//
// Subcategory labels are the contract between the data and the UI — a place's
// `subcategory` must be one of the strings listed here, or its group page will
// not be able to filter it.

export interface CategoryGroup {
  id: string;
  /** Short label for chips, nav and tiles. */
  label: string;
  /** Longer label for page headings. */
  title: string;
  /** Icon key resolved by components/Icon.tsx. */
  icon: string;
  /** Surfaced in the home screen's primary Explore row. */
  primary?: boolean;
  /**
   * A place of remembrance rather than a place to consume — memorial sites.
   * Suppresses ratings, reviews, prices and promotional placement, and renders
   * in a restrained style. See the note on Category.sensitive in schema.prisma.
   */
  sensitive?: boolean;
  subcategories: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "dining",
    label: "Dining",
    title: "Dining & Nightlife",
    icon: "utensils",
    primary: true,
    subcategories: ["Restaurants", "Resto Bars", "Cafés", "Bars", "Fast Food"],
  },
  {
    id: "stays",
    label: "Stays",
    title: "Stays & Accommodation",
    icon: "bed",
    primary: true,
    subcategories: ["Hotels", "Lodges", "Guest Houses", "Resorts", "Hostels"],
  },
  {
    id: "shopping",
    label: "Shopping",
    title: "Markets & Shopping",
    icon: "basket",
    primary: true,
    subcategories: ["Markets", "Supermarkets", "Shopping Centers", "Shops", "Malls"],
  },
  {
    id: "finance",
    label: "Finance",
    title: "Banks & Finance",
    icon: "bank",
    primary: true,
    subcategories: ["Banks", "ATMs", "Microfinance Institutions", "Mobile Money"],
  },
  {
    id: "worship",
    label: "Worship",
    title: "Religious Places",
    icon: "worship",
    subcategories: ["Churches", "Mosques", "Temples", "Other Places of Worship"],
  },
  {
    id: "education",
    label: "Education",
    title: "Education",
    icon: "school",
    subcategories: ["Schools", "Universities", "Colleges", "Training Centers", "Libraries"],
  },
  {
    id: "health",
    label: "Healthcare",
    title: "Healthcare",
    icon: "hospital",
    primary: true,
    subcategories: ["Hospitals", "Clinics", "Pharmacies", "Health Centers"],
  },
  {
    id: "arts",
    label: "Museums & Arts",
    title: "Museums & Arts",
    icon: "palette",
    subcategories: ["Museums", "Art Galleries", "Cultural Centers", "Art Spaces"],
  },
  {
    id: "recreation",
    label: "Fitness",
    title: "Fitness & Recreation",
    icon: "dumbbell",
    // "Playgrounds" is an addition to the brief's list: the catalog already
    // holds ten family play venues and this is where they belong.
    subcategories: ["Gyms", "Fitness Centers", "Sports Clubs", "Swimming Pools", "Playgrounds"],
  },
  {
    id: "sports",
    label: "Sports & Events",
    title: "Sports & Events",
    icon: "trophy",
    subcategories: ["Arenas", "Stadiums", "Sports Grounds", "Event Venues"],
  },
  {
    id: "memorials",
    label: "Memorials",
    title: "Memorials & Heritage",
    icon: "memorial",
    // Places of remembrance. Never rated, reviewed, priced or promoted —
    // see the note on Category.sensitive in prisma/schema.prisma.
    sensitive: true,
    subcategories: ["Memorial Sites", "Genocide Memorials", "Historical Sites", "Heritage Sites"],
  },
  {
    id: "safety",
    label: "Public Safety",
    title: "Public Safety",
    icon: "shield",
    subcategories: ["Police Stations", "Fire Stations", "Emergency Services"],
  },
  {
    id: "nature",
    label: "Parks & Nature",
    title: "Parks & Nature",
    icon: "tree",
    primary: true,
    subcategories: ["Parks", "Nature Reserves", "Forests", "Lakes", "Hiking Trails", "Waterfalls"],
  },
  {
    id: "transport",
    label: "Transport",
    title: "Transportation",
    icon: "bus",
    subcategories: ["Bus Stations", "Taxi Stands", "Train Stations", "Transport Hubs", "Car Rental"],
  },
  {
    id: "airports",
    label: "Airports",
    title: "Airports",
    icon: "plane",
    subcategories: ["International Airports", "Domestic Airports", "Airstrips"],
  },
  {
    id: "wonders",
    label: "Wonders",
    title: "Wonders & Attractions",
    icon: "mountain",
    subcategories: [
      "Natural Wonders",
      "Landmarks",
      "Tourist Attractions",
      "Scenic Viewpoints",
      "Monuments",
    ],
  },
];

export type CategoryId = (typeof CATEGORY_GROUPS)[number]["id"];

const BY_ID = new Map(CATEGORY_GROUPS.map((group) => [group.id, group]));

export function getGroup(id: string): CategoryGroup | undefined {
  return BY_ID.get(id);
}

export function groupLabel(id: string): string {
  return BY_ID.get(id)?.label ?? id;
}

export function groupTitle(id: string): string {
  return BY_ID.get(id)?.title ?? id;
}

/** The group a subcategory belongs to, for search and deep links. */
export function groupForSubcategory(subcategory: string): CategoryGroup | undefined {
  const needle = subcategory.toLowerCase();
  return CATEGORY_GROUPS.find((group) =>
    group.subcategories.some((sub) => sub.toLowerCase() === needle),
  );
}
