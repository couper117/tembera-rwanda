import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { TravelCategory } from "@prisma/client";

// The legacy homepage hard-coded these cards. They now come from Postgres
// (the `travel_categories` table managed at /admin). If the DB is unreachable
// we fall back to the original static set so the page still renders.
const FALLBACK: Pick<
  TravelCategory,
  "title" | "description" | "imageUrl" | "pageLink" | "iconClass" | "ctaText"
>[] = [
  {
    title: "History & Museums",
    description: "Explore the Kings' Palaces, Genocide Memorials, and Art Museums.",
    imageUrl:
      "https://images.unsplash.com/photo-1728288578026-6ef60d0fb202?q=80&w=1198&auto=format&fit=crop",
    pageLink: "historics",
    iconClass: "fas fa-landmark",
    ctaText: "View 9 Sites",
  },
  {
    title: "Stays & Homes",
    description: "From luxury hotels in Kigali to eco-lodges in the volcanoes.",
    imageUrl:
      "https://images.unsplash.com/photo-1667504320745-eade6c25e053?q=80&w=1170&auto=format&fit=crop",
    pageLink: "homes",
    iconClass: "fas fa-bed",
    ctaText: "Find Accommodation",
  },
  {
    title: "Nature & Activities",
    description: "Gorilla trekking, canopy walks, and Lake Kivu boat rides.",
    imageUrl:
      "https://images.unsplash.com/photo-1676102818778-7dedb5cdad46?q=80&w=987&auto=format&fit=crop",
    pageLink: "wonders",
    iconClass: "fas fa-hiking",
    ctaText: "See Activities",
  },
  {
    title: "Churches",
    description: "Find a church to go to on your stay.",
    imageUrl:
      "https://images.unsplash.com/photo-1620763935115-3e08804489ca?q=80&w=687&auto=format&fit=crop",
    pageLink: "churches",
    iconClass: "fas fa-church",
    ctaText: "Churches",
  },
];

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    const rows = await prisma.travelCategory.findMany({ orderBy: { id: "asc" } });
    return rows.length ? rows : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <>
      <header className="landing-hero">
        <div className="hero-bg-zoom"></div>
        <div className="hero-overlay-gradient"></div>
        <div className="hero-content-center reveal">
          <span className="pill-badge">The Land of a Thousand Hills</span>
          <h1>
            Experience <br /> The <span className="highlight">Remarkable</span>
          </h1>
          <p>
            Your all-in-one pocket guide to Rwanda. From the misty Virunga
            mountains to the vibrant heartbeat of Kigali.
          </p>
          <div className="hero-buttons">
            <a href="#explore" className="btn-primary-lg">
              Start Exploring <i className="fas fa-arrow-down"></i>
            </a>
          </div>
        </div>
      </header>

      <section className="intro-section" id="about">
        <div className="container reveal">
          <div className="intro-grid">
            <div className="intro-text">
              <h2>More Than Just A Destination</h2>
              <p>
                Rwanda is a story of resilience, beauty, and rebirth. Ranked as
                one of the safest countries in the world, we offer a travel
                experience that blends luxury eco-tourism with deep cultural
                heritage.
              </p>
              <p>
                This app helps you navigate it all—finding the best{" "}
                <strong>Museums</strong>, the coziest <strong>Homes</strong>, and
                the safest <strong>Transport</strong>.
              </p>
            </div>
            <div className="intro-stats">
              <div className="stat-box">
                <h3>1k+</h3>
                <p>Hills to Climb</p>
              </div>
              <div className="stat-box">
                <h3>4</h3>
                <p>National Parks</p>
              </div>
              <div className="stat-box">
                <h3>26°C</h3>
                <p>Perfect Weather</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="explore-grid-section" id="explore">
        <div className="container">
          <div className="section-header center-text reveal">
            <h2>Plan Your Journey</h2>
            <p>Select a category to begin your adventure.</p>
          </div>

          <div className="category-grid">
            {categories.map((cat, i) => (
              <Link
                key={cat.pageLink || i}
                href={`/${cat.pageLink}`}
                className="category-card reveal"
              >
                <div className="cat-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cat.imageUrl} alt={cat.title} />
                </div>
                <div className="cat-content">
                  <div className="icon-circle">
                    <i className={cat.iconClass}></i>
                  </div>
                  <h3>{cat.title}</h3>
                  <p>{cat.description}</p>
                  <span className="link-text">
                    {cat.ctaText} <i className="fas fa-arrow-right"></i>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-bg"></div>
        <div className="cta-content reveal">
          <h2>Ready to visit Rwanda?</h2>
          <p>Download the full itinerary or book your flight today.</p>
          <Link className="btn-white-lg" href="/booking">
            Book Now
          </Link>
        </div>
      </section>
    </>
  );
}
