// Extracted verbatim from the legacy app/(site)/map/page.tsx data array.
// Data is unchanged; only its home moved so every screen can query one catalog.

export interface MapRow {
  id: number;
  name: string;
  lat: number;
  lng: number;
  type: string;
  rating: number;
  img: string;
}

export const MAP_ROWS: MapRow[] = [
  {
    id: 1,
    name: "Kigali Genocide Memorial",
    lat: -1.9324,
    lng: 30.0577,
    type: "History",
    rating: 4.9,
    img: "https://i.assetzen.net/i/j6wGs3oQ8F9T/w:1165/h:480/q:70.jpg",
  },
  {
    id: 2,
    name: "Park Inn by Radisson",
    lat: -1.9542,
    lng: 30.0606,
    type: "Hotel",
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1746549859840-808544238d42?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Inzora Rooftop Cafe",
    lat: -1.9439,
    lng: 30.0675,
    type: "Food",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=200",
  },
  {
    id: 4,
    name: "Question Coffee",
    lat: -1.9482,
    lng: 30.0912,
    type: "Food",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200",
  },
];
