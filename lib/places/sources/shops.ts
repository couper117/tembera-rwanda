// Extracted verbatim from the legacy app/(site)/shops/page.tsx data array.
// Data is unchanged; only its home moved so every screen can query one catalog.

export interface ShopRow {
  id: number;
  name: string;
  type: string;
  area: string;
  icon: string;
  description: string;
  hours: string;
  location: string;
  category: string[];
}

export const SHOP_ROWS: ShopRow[] = [
  {
    id: 1,
    name: "Kimironko Market",
    type: "market",
    area: "Kimironko",
    icon: "fas fa-basket-shopping",
    description:
      "Kigali's largest and most vibrant market offering fresh produce, textiles, crafts, and household goods. A true local experience.",
    hours: "Daily: 7am-7pm",
    location: "Kimironko Sector",
    category: ["market", "food", "craft"],
  },
  {
    id: 2,
    name: "Caplaki Craft Village",
    type: "craft",
    area: "Gacuriro",
    icon: "fas fa-hands",
    description:
      "A cooperative of artisans selling traditional Rwandan crafts, including baskets, wood carvings, paintings, and jewelry.",
    hours: "Mon-Sat: 9am-6pm",
    location: "Gacuriro Road",
    category: ["craft", "art", "souvenir"],
  },
  {
    id: 3,
    name: "Nyamirambo Women's Center Market",
    type: "market",
    area: "Nyamirambo",
    icon: "fas fa-people-group",
    description:
      "Community market run by local women offering traditional crafts, textiles, and guided tours of the Nyamirambo neighborhood.",
    hours: "Mon-Fri: 8am-5pm",
    location: "Nyamirambo",
    category: ["market", "craft", "clothing"],
  },
  {
    id: 4,
    name: "Question Coffee Café & Shop",
    type: "food",
    area: "Kacyiru",
    icon: "fas fa-mug-hot",
    description:
      "Specialty coffee shop selling premium Rwandan coffee beans and accessories. Offers coffee tasting sessions.",
    hours: "Daily: 7am-8pm",
    location: "Kacyiru",
    category: ["food", "souvenir"],
  },
  {
    id: 5,
    name: "Rwanda Clothing",
    type: "clothing",
    area: "City Center",
    icon: "fas fa-tshirt",
    description:
      "Boutique featuring contemporary Rwandan fashion designers. Modern clothing with traditional influences.",
    hours: "Mon-Sat: 10am-7pm",
    location: "City Center",
    category: ["clothing", "art"],
  },
  {
    id: 6,
    name: "Inema Arts Center",
    type: "art",
    area: "Kacyiru",
    icon: "fas fa-palette",
    description:
      "Contemporary art gallery and studio showcasing works by Rwandan artists. Also offers art workshops.",
    hours: "Tue-Sun: 9am-6pm",
    location: "Kacyiru",
    category: ["art", "craft"],
  },
  {
    id: 7,
    name: "Simba Supermarket",
    type: "market",
    area: "Multiple Locations",
    icon: "fas fa-store",
    description:
      "Popular supermarket chain offering both local and imported goods. Known for its fresh produce section.",
    hours: "Daily: 8am-9pm",
    location: "Citywide",
    category: ["market", "food"],
  },
  {
    id: 8,
    name: "Gahaya Links Gift Shop",
    type: "souvenir",
    area: "Kacyiru",
    icon: "fas fa-gift",
    description:
      "Specializes in traditional Rwandan baskets and woven products made by women's cooperatives across the country.",
    hours: "Mon-Sat: 9am-6pm",
    location: "Kacyiru",
    category: ["souvenir", "craft"],
  },
  {
    id: 9,
    name: "Union Trade Center",
    type: "market",
    area: "City Center",
    icon: "fas fa-building",
    description:
      "Multi-level shopping center with a variety of shops selling electronics, clothing, books, and more.",
    hours: "Daily: 8am-8pm",
    location: "City Center",
    category: ["market", "clothing"],
  },
  {
    id: 10,
    name: "Azizi Life Boutique",
    type: "craft",
    area: "Gikondo",
    icon: "fas fa-gem",
    description:
      "Fair trade shop offering handmade crafts, jewelry, and home decor made by Rwandan artisans.",
    hours: "Mon-Fri: 8:30am-5:30pm",
    location: "Gikondo",
    category: ["craft", "souvenir", "art"],
  },
  {
    id: 11,
    name: "Nyabugogo Market",
    type: "market",
    area: "Nyabugogo",
    icon: "fas fa-truck-moving",
    description:
      "Major transport hub and market known for fresh food, spices, and affordable clothing. Very busy atmosphere.",
    hours: "Daily: 6am-8pm",
    location: "Nyabugogo",
    category: ["market", "food", "clothing"],
  },
  {
    id: 12,
    name: "Rwanda Art Museum Shop",
    type: "art",
    area: "Kanombe",
    icon: "fas fa-museum",
    description:
      "Museum shop offering art books, prints, and reproductions of works in the Rwanda Art Museum collection.",
    hours: "Tue-Sun: 9am-5pm",
    location: "Kanombe",
    category: ["art", "souvenir"],
  },
  {
    id: 13,
    name: "Bourbon Coffee Shop & Store",
    type: "food",
    area: "Multiple Locations",
    icon: "fas fa-coffee",
    description:
      "Rwanda's premier coffee chain with several locations. Sells premium Rwandan coffee beans and brewing equipment.",
    hours: "Daily: 7am-10pm",
    location: "Citywide",
    category: ["food", "souvenir"],
  },
  {
    id: 14,
    name: "Kimihurura Fabric Market",
    type: "clothing",
    area: "Kimihurura",
    icon: "fas fa-vest",
    description:
      "Specialized market for traditional and modern fabrics. Tailors available for custom clothing orders.",
    hours: "Mon-Sat: 8am-6pm",
    location: "Kimihurura",
    category: ["clothing", "market"],
  },
  {
    id: 15,
    name: "Mamba Club Grocery",
    type: "food",
    area: "Kicukiro",
    icon: "fas fa-carrot",
    description:
      "Well-stocked grocery with a focus on organic and locally-sourced produce. Includes a deli and bakery.",
    hours: "Daily: 7am-9pm",
    location: "Kicukiro",
    category: ["food", "market"],
  },
  {
    id: 16,
    name: "Rwanda Craftworks",
    type: "craft",
    area: "Remera",
    icon: "fas fa-hammer",
    description:
      "Workshop and store featuring handmade furniture, home decor, and accessories by local craftsmen.",
    hours: "Mon-Sat: 9am-5pm",
    location: "Remera",
    category: ["craft", "art"],
  },
  {
    id: 17,
    name: "Kigali Heights Shopping Mall",
    type: "market",
    area: "Kimihurura",
    icon: "fas fa-shopping-cart",
    description:
      "Modern shopping mall with international brands, restaurants, cinema, and a supermarket.",
    hours: "Daily: 9am-9pm",
    location: "Kimihurura",
    category: ["market", "clothing", "food"],
  },
  {
    id: 18,
    name: "Ikirezi Perfumery & Shop",
    type: "souvenir",
    area: "Kacyiru",
    icon: "fas fa-spray-can-sparkles",
    description:
      "Unique shop selling essential oils and perfumes made from Rwandan botanicals. Offers perfume-making workshops.",
    hours: "Mon-Fri: 9am-5pm",
    location: "Kacyiru",
    category: ["souvenir", "craft"],
  },
  {
    id: 19,
    name: "City Market",
    type: "market",
    area: "City Center",
    icon: "fas fa-city",
    description:
      "Traditional market in the heart of Kigali, offering fresh produce, meats, spices, and household items.",
    hours: "Daily: 7am-7pm",
    location: "City Center",
    category: ["market", "food"],
  },
  {
    id: 20,
    name: "Rwanda Fashion Week Boutique",
    type: "clothing",
    area: "Nyarutarama",
    icon: "fas fa-vest-patches",
    description:
      "Showcases collections from Rwanda Fashion Week designers. High-end contemporary African fashion.",
    hours: "Tue-Sat: 10am-6pm",
    location: "Nyarutarama",
    category: ["clothing", "art"],
  },
];
