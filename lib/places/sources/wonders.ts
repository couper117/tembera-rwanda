// Extracted verbatim from the legacy app/(site)/wonders/page.tsx data array.
// Data is unchanged; only its home moved so every screen can query one catalog.

export interface WonderRow {
  name: string;
  type: string;
  desc: string;
  img: string;
}

export const WONDER_ROWS: WonderRow[] = [
  {
    name: "Volcanoes National Park",
    type: "National Park",
    desc: "The mist-covered home of the mountain gorillas and the dramatic Virunga volcano range.",
    img: "/assets/images/wonder_volcanoes_national_park.jpg",
  },
  {
    name: "Akagera National Park",
    type: "National Park",
    desc: "A sprawling savannah where the Big Five roam across lakes, swamps, and open plains.",
    img: "/assets/images/wonder_akagera_national_park.jpg",
  },
  {
    name: "Nyungwe Forest National Park",
    type: "National Park",
    desc: "One of the oldest rainforests in Africa, famous for chimpanzee trekking and the high canopy walk.",
    img: "/assets/images/wonder_nyungwe_forest_national_park.jpg",
  },
  {
    name: "Lake Kivu",
    type: "Water",
    desc: "An emerald-blue inland sea perfect for sunset boat rides and exploring the lakeside towns of Rubavu and Karongi.",
    img: "/assets/images/rwanda_lake_kivu_sunset.jpg",
  },
  {
    name: "Twin Lakes (Burera & Ruhondo)",
    type: "Water",
    desc: "Stunning blue lakes at the base of the volcanoes, offering some of the most scenic views in the country.",
    img: "/assets/images/wonder_twin_lakes_burera_ruhondo.jpg",
  },
];
