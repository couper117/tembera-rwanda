/**
 * The full subcategory list, per category.
 *
 * The seed shipped three to six per category, which is enough to sort 495
 * imported listings and nowhere near enough for a business describing itself.
 * A shop owner picking "Shops" is telling a visitor almost nothing; the point
 * of a directory is that "Bookshops" and "Hardware Stores" are different
 * searches with different answers.
 *
 * Written for Rwanda rather than translated from a generic list: brochettes,
 * moto stages, SACCOs and forex bureaus are things people actually look for
 * here, and their absence is what makes an imported taxonomy feel foreign.
 *
 * Additive only. Every name the catalogue already uses appears below, because
 * `Place.subcategory` stores the string and removing one would orphan every
 * listing that carries it. `scripts/sync-subcategories.ts` upserts these.
 *
 * Memorials is deliberately the shortest list here. A place of remembrance is
 * not a business category and does not want finer marketing segments.
 */
export const SUBCATEGORIES: Record<string, string[]> = {
  dining: [
    "Restaurants",
    "Resto Bars",
    "Cafés",
    "Coffee Shops",
    "Bars",
    "Fast Food",
    "Bakeries",
    "Pizzerias",
    "Grills & Brochettes",
    "Buffets",
    "Juice Bars",
    "Ice Cream & Desserts",
    "Street Food",
    "Food Courts",
    "Catering Services",
    "Nightclubs",
  ],
  stays: [
    "Hotels",
    "Lodges",
    "Guest Houses",
    "Resorts",
    "Hostels",
    "Apartments",
    "Serviced Apartments",
    "Villas",
    "Motels",
    "Eco Lodges",
    "Campsites",
    "Homestays",
  ],
  shopping: [
    "Markets",
    "Supermarkets",
    "Shopping Centers",
    "Shops",
    "Malls",
    "Boutiques",
    "Clothing Stores",
    "Shoe Shops",
    "Craft & Souvenir Shops",
    "Electronics Stores",
    "Mobile Phone Shops",
    "Furniture Stores",
    "Hardware Stores",
    "Bookshops",
    "Stationery Shops",
    "Jewellery Shops",
    "Beauty & Cosmetics",
    "Salons & Barbers",
    "Tailors",
  ],
  finance: [
    "Banks",
    "ATMs",
    "Microfinance Institutions",
    "Mobile Money",
    "Forex Bureaus",
    "SACCOs",
    "Insurance Offices",
    "Money Transfer",
  ],
  worship: [
    "Churches",
    "Cathedrals",
    "Chapels",
    "Mosques",
    "Temples",
    "Synagogues",
    "Prayer Centers",
    "Other Places of Worship",
  ],
  education: [
    "Schools",
    "Nursery Schools",
    "Primary Schools",
    "Secondary Schools",
    "Universities",
    "Colleges",
    "Vocational Schools",
    "Training Centers",
    "Language Schools",
    "Driving Schools",
    "Libraries",
  ],
  health: [
    "Hospitals",
    "Clinics",
    "Health Centers",
    "Pharmacies",
    "Dental Clinics",
    "Eye Clinics",
    "Maternity Clinics",
    "Laboratories",
    "Physiotherapy",
    "Veterinary Clinics",
  ],
  arts: [
    "Museums",
    "Art Galleries",
    "Cultural Centers",
    "Art Spaces",
    "Theatres",
    "Cinemas",
    "Craft Centers",
    "Music Venues",
  ],
  recreation: [
    "Gyms",
    "Fitness Centers",
    "Sports Clubs",
    "Swimming Pools",
    "Playgrounds",
    "Yoga Studios",
    "Martial Arts Dojos",
    "Tennis Courts",
    "Golf Courses",
  ],
  nature: [
    "Parks",
    "Lakes",
    "Waterfalls",
    "Forests",
    "Nature Reserves",
    "Hiking Trails",
    "Botanical Gardens",
    "Islands",
    "Caves",
    "Hot Springs",
    "Wetlands",
  ],
  wonders: [
    "Tourist Attractions",
    "Landmarks",
    "Monuments",
    "Natural Wonders",
    "Scenic Viewpoints",
    "Volcanoes",
    "Mountains",
    "Heritage Trails",
  ],
  sports: [
    "Stadiums",
    "Arenas",
    "Event Venues",
    "Sports Grounds",
    "Conference Centers",
    "Exhibition Halls",
    "Concert Venues",
    "Race Tracks",
  ],
  transport: [
    "Bus Stations",
    "Taxi Stands",
    "Moto Stages",
    "Car Rental",
    "Transport Hubs",
    "Train Stations",
    "Petrol Stations",
    "Parking",
    "Boat Landings",
    "Courier & Logistics",
  ],
  airports: ["International Airports", "Domestic Airports", "Airstrips", "Heliports"],
  safety: [
    "Police Stations",
    "Fire Stations",
    "Emergency Services",
    "Ambulance Services",
    "Rescue Services",
    "Security Services",
  ],
  memorials: [
    "Genocide Memorials",
    "Memorial Sites",
    "Heritage Sites",
    "Historical Sites",
  ],
};

/** Every subcategory name, for validation that does not care about parentage. */
export function allSubcategoryNames(): string[] {
  return [...new Set(Object.values(SUBCATEGORIES).flat())];
}
