// Extracted verbatim from the legacy app/(site)/historics/page.tsx data array.
// Data is unchanged; only its home moved so every screen can query one catalog.

export interface HistoricRow {
  id: number;
  name: string;
  category: string;
  desc: string;
  hours: string;
  location: string;
  img: string;
  lat: number;
  lng: number;
}

export const HISTORIC_ROWS: HistoricRow[] = [
  {
    id: 1,
    name: "Kigali Genocide Memorial",
    category: "Memorial",
    desc: "The final resting place for more than 250,000 victims of the Genocide against the Tutsi.",
    hours: "8:00 AM - 4:00 PM (Open Daily)",
    location: "Gisozi, Kigali",
    img: "https://i.assetzen.net/i/j6wGs3oQ8F9T/w:1165/h:480/q:70.jpg",
    lat: -1.9301,
    lng: 30.0605,
  },
  {
    id: 2,
    name: "King's Palace Museum",
    category: "Museum",
    desc: "A reconstruction of the traditional royal residence in Nyanza.",
    hours: "8:00 AM - 6:00 PM",
    location: "Nyanza District",
    img: "/assets/images/historic_kings_palace_museum.jpg",
    lat: -2.3567,
    lng: 29.7495,
  },
  {
    id: 3,
    name: "Ethnographic Museum",
    category: "Museum",
    desc: "Houses one of Africa's finest ethnographic collections.",
    hours: "9:00 AM - 6:00 PM",
    location: "Huye (Butare)",
    img: "/assets/images/historic_ethnographic_museum.jpg",
    lat: -2.5967,
    lng: 29.7402,
  },
  {
    id: 4,
    name: "Kandt House Museum",
    category: "Museum",
    desc: "Discover the colonial history and evolution of Kigali.",
    hours: "8:00 AM - 6:00 PM",
    location: "Kanombe, Kigali",
    img: "/assets/images/historic_kandt_house_museum.jpg",
    lat: -1.9753,
    lng: 30.173,
  },
  {
    id: 5,
    name: "Murambi Memorial",
    category: "Memorial",
    desc: "A powerful memorial located in the Southern Province.",
    hours: "8:00 AM - 5:00 PM",
    location: "Nyamagabe",
    img: "/assets/images/historic_murambi_memorial.jpg",
    lat: -2.4556,
    lng: 29.5678,
  },
  {
    id: 6,
    name: "Campaign Against Genocide",
    category: "Museum",
    desc: "Located at the Parliament building, depicting the campaign to stop the genocide.",
    hours: "8:00 AM - 5:00 PM",
    location: "Kimihurura, Kigali",
    img: "/assets/images/historic_campaign_against_genocide.jpg",
    lat: -1.9536,
    lng: 30.0965,
  },
];
