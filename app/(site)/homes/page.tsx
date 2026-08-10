"use client";

import { useMemo, useState } from "react";

interface Listing {
  id: number;
  title: string;
  type: string;
  price: number;
  rating: string;
  location: string;
  img: string;
  desc: string;
  isSuperhost: boolean;
}

const titles = [
  "Serena Heights",
  "Kigali View Apt",
  "The Retreat",
  "Urban Loft",
  "Green Hills Villa",
  "Downtown Suite",
  "Lake Kivu Resort",
  "Nyarutarama Home",
  "Zen Garden",
  "Skyline Hotel",
];

const types = [
  "Hotel",
  "Apartment",
  "Hotel",
  "Apartment",
  "Villa",
  "Apartment",
  "Hotel",
  "Villa",
  "Apartment",
  "Hotel",
];

const images = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
];

// Deterministic pseudo-random generator so server and client render identically.
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateListings(): Listing[] {
  const list: Listing[] = [];
  for (let i = 0; i < 50; i++) {
    const tIndex = i % 10;
    const imgIndex = i % 5;

    const price = 50 + Math.floor(seededRandom(i * 2 + 1) * 250);
    const rating = (4.0 + seededRandom(i * 2 + 2)).toFixed(2);

    list.push({
      id: i,
      title: titles[tIndex] + " " + (i + 1),
      type: types[tIndex],
      price: price,
      rating: rating,
      location: "Kigali, Rwanda",
      img: images[imgIndex],
      desc:
        "Experience world-class service and comfort. Located in the heart of the city, this " +
        types[tIndex] +
        " offers stunning views, modern amenities, and easy access to local attractions.",
      isSuperhost: parseFloat(rating) > 4.8,
    });
  }
  return list;
}

export default function HomesPage() {
  const [listings] = useState<Listing[]>(() => generateListings());
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Listing | null>(null);

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      if (filter === "all") return true;
      if (filter === "Luxury" && item.price > 200) return true;
      if (item.type === filter) return true;
      return false;
    });
  }, [listings, filter]);

  const scrollToGrid = () => {
    document
      .getElementById("listings-grid")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const closeModal = () => setSelected(null);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/homes.css" />

      <div className="parallax-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content reveal">
          <span className="tag-line">Stay in Style</span>
          <h1>
            Find Your <br />
            <span className="highlight">Home Away From Home</span>
          </h1>
          <p>
            From luxury hotels to cozy apartments.
            <br />
            Experience Rwanda like a local.
          </p>

          <div className="hero-search-bar">
            <div className="search-item">
              <label>Location</label>
              <input type="text" placeholder="Kigali, Rwanda" />
            </div>
            <div className="search-item">
              <label>Check in</label>
              <input type="date" />
            </div>
            <div className="search-item">
              <label>Type</label>
              <select
                id="hero-type-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Any Type</option>
                <option value="Hotel">Hotels</option>
                <option value="Apartment">Apartments</option>
                <option value="Villa">Villas</option>
              </select>
            </div>
            <button className="btn-search" onClick={scrollToGrid}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="homes-container">
        <div className="category-scroll-wrapper">
          <div className="category-tabs">
            <button
              className={"cat-btn" + (filter === "all" ? " active" : "")}
              onClick={() => setFilter("all")}
            >
              <i className="fas fa-th"></i> <span>All</span>
            </button>
            <button
              className={"cat-btn" + (filter === "Hotel" ? " active" : "")}
              onClick={() => setFilter("Hotel")}
            >
              <i className="fas fa-hotel"></i> <span>Hotels</span>
            </button>
            <button
              className={"cat-btn" + (filter === "Apartment" ? " active" : "")}
              onClick={() => setFilter("Apartment")}
            >
              <i className="fas fa-building"></i> <span>Apartments</span>
            </button>
            <button
              className={"cat-btn" + (filter === "Villa" ? " active" : "")}
              onClick={() => setFilter("Villa")}
            >
              <i className="fas fa-home"></i> <span>Villas</span>
            </button>
            <button
              className={"cat-btn" + (filter === "Luxury" ? " active" : "")}
              onClick={() => setFilter("Luxury")}
            >
              <i className="fas fa-gem"></i> <span>Luxe</span>
            </button>
          </div>
        </div>

        <div className="section-header">
          <h2>50+ Places to Stay</h2>
          <p>Top rated listings based on guest reviews.</p>
        </div>

        <div className="listings-grid" id="listings-grid">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="stay-card fade-in"
              onClick={() => setSelected(item)}
            >
              <div className="card-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.title} />
                <button
                  className="wishlist-btn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <i className="far fa-heart"></i>
                </button>
                {item.isSuperhost && (
                  <span className="superhost-badge">Guest Favorite</span>
                )}
              </div>
              <div className="card-details">
                <div className="card-row">
                  <h3 className="card-title">{item.title}</h3>
                  <div className="card-rating">
                    <i className="fas fa-star"></i> {item.rating}
                  </div>
                </div>
                <p className="card-loc text-muted">
                  {item.type} in {item.location}
                </p>
                <p className="card-dates text-muted">Oct 22 - 27</p>
                <div className="card-price">
                  <strong>${item.price}</strong>{" "}
                  <span className="text-muted">night</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        id="stay-modal"
        className="modal-overlay"
        style={{ display: selected ? "flex" : "none" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="modal-card">
          <button className="close-btn" onClick={closeModal}>
            <i className="fas fa-times"></i>
          </button>

          <div className="modal-gallery">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="modal-img" src={selected?.img ?? ""} alt="Stay Image" />
            <div className="gallery-badge" id="modal-type">
              {selected?.type}
            </div>
          </div>

          <div className="modal-content-scroll">
            <div className="modal-header">
              <div>
                <h2 id="modal-title">{selected?.title}</h2>
                <span className="modal-location">
                  <i className="fas fa-map-marker-alt"></i>{" "}
                  <span id="modal-loc">{selected?.location}</span>
                </span>
              </div>
              <div className="modal-price-box">
                <span className="price-big" id="modal-price">
                  ${selected?.price}
                </span>
                <span className="price-period">/ night</span>
              </div>
            </div>

            <div className="rating-row">
              <i className="fas fa-star text-star"></i>{" "}
              <span id="modal-rating">{selected?.rating}</span> ·{" "}
              <span className="reviews">128 Reviews</span> ·{" "}
              <span className="superhost">🏆 Superhost</span>
            </div>

            <hr className="divider" />

            <div className="modal-desc">
              <h3>About this place</h3>
              <p id="modal-desc">{selected?.desc}</p>
            </div>

            <div className="amenities-grid">
              <h3>What this place offers</h3>
              <div className="amenities-list">
                <div className="amenity">
                  <i className="fas fa-wifi"></i> Fast Wifi
                </div>
                <div className="amenity">
                  <i className="fas fa-swimming-pool"></i> Pool
                </div>
                <div className="amenity">
                  <i className="fas fa-parking"></i> Free Parking
                </div>
                <div className="amenity">
                  <i className="fas fa-tv"></i> 4K TV
                </div>
                <div className="amenity">
                  <i className="fas fa-snowflake"></i> AC
                </div>
                <div className="amenity">
                  <i className="fas fa-utensils"></i> Kitchen
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <div className="total-price">
                <span>Total (3 nights)</span>
                <strong id="modal-total">
                  ${selected ? selected.price * 3 : 0}
                </strong>
              </div>
              <button className="btn-reserve">Reserve</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
