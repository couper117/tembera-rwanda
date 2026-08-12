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
    img: "http://googleusercontent.com/image_collection/image_retrieval/16059656606262893531_0",
  },
  {
    name: "Akagera National Park",
    type: "National Park",
    desc: "A sprawling savannah where the Big Five roam across lakes, swamps, and open plains.",
    img: "http://googleusercontent.com/image_collection/image_retrieval/13952493864587426278_0",
  },
  {
    name: "Nyungwe Forest National Park",
    type: "National Park",
    desc: "One of the oldest rainforests in Africa, famous for chimpanzee trekking and the high canopy walk.",
    img: "http://googleusercontent.com/image_collection/image_retrieval/2977566872927862920_0",
  },
  {
    name: "Lake Kivu",
    type: "Water",
    desc: "An emerald-blue inland sea perfect for sunset boat rides and exploring the lakeside towns of Rubavu and Karongi.",
    img: "http://googleusercontent.com/image_collection/image_retrieval/210355924026499005_0",
  },
  {
    name: "Twin Lakes (Burera & Ruhondo)",
    type: "Water",
    desc: "Stunning blue lakes at the base of the volcanoes, offering some of the most scenic views in the country.",
    img: "http://googleusercontent.com/image_collection/image_retrieval/14471468351131662477_0",
  },
];
