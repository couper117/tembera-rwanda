// Extracted verbatim from the legacy app/(site)/restaurants/page.tsx data array.
// Data is unchanged; only its home moved so every screen can query one catalog.

export interface RestaurantRow {
  name: string;
  rate: string;
  quote: string;
  img: string;
  lat: number;
  lng: number;
}

export const RESTAURANT_ROWS: RestaurantRow[] = [
  { name: "Inzora Rooftop", rate: "4.8", quote: "Unbeatable views. Try the house-made granola.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", lat: -1.9439, lng: 30.0675 },
  { name: "Question Coffee", rate: "4.9", quote: "A masterpiece of Rwandan coffee culture.", img: "https://images.unsplash.com/photo-1542332213-31f87348057f", lat: -1.9482, lng: 30.0912 },
  { name: "Soy Asian Table", rate: "4.7", quote: "Exquisite Asian fusion in a modern garden setting.", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19", lat: -1.9441, lng: 30.0892 },
  { name: "The Bistro", rate: "4.9", quote: "Elegance on a plate. Top-tier service.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", lat: -1.9455, lng: 30.0611 },
  { name: "Rubia Roasters", rate: "4.8", quote: "Clean, modern design with precision roasts.", img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31", lat: -1.9515, lng: 30.0824 },
  { name: "Pili Pili", rate: "4.7", quote: "Poolside vibes and the best grilled tilapia.", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", lat: -1.9322, lng: 30.1245 },
  { name: "Repub Lounge", rate: "4.8", quote: "Authentic flavors with a view of the city lights.", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9", lat: -1.9501, lng: 30.0622 },
  { name: "Poivre Noir", rate: "4.6", quote: "French-Belgian fusion with a cozy, artistic vibe.", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de", lat: -1.9460, lng: 30.0600 },
  { name: "Meze Fresh", rate: "4.5", quote: "The best Mexican burritos in Kigali. Fast and fresh.", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", lat: -1.9490, lng: 30.0630 },
  { name: "Camellia Tea", rate: "4.4", quote: "A bustling local favorite for tea and quick bites.", img: "https://images.unsplash.com/photo-1601923157894-eb2f7fffd7d7", lat: -1.9440, lng: 30.0620 },
];
