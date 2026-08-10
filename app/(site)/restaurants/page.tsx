"use client";

import { useState, useEffect } from "react";

interface Place {
  name: string;
  rate: string;
  quote: string;
  img: string;
  lat: number;
  lng: number;
}

const places: Place[] = [
  { name: "Inzora Rooftop", rate: "4.8", quote: "Unbeatable views. Try the house-made granola.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085", lat: -1.9439, lng: 30.0675 },
  { name: "Question Coffee", rate: "4.9", quote: "A masterpiece of Rwandan coffee culture.", img: "https://images.unsplash.com/photo-1542332213-31f87348057f", lat: -1.9482, lng: 30.0912 },
  { name: "Soy Asian Table", rate: "4.7", quote: "Exquisite Asian fusion in a modern garden setting.", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19", lat: -1.9441, lng: 30.0892 },
  { name: "The Bistro", rate: "4.9", quote: "Elegance on a plate. Top-tier service.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4", lat: -1.9455, lng: 30.0611 },
  { name: "Rubia Roasters", rate: "4.8", quote: "Clean, modern design with precision roasts.", img: "https://images.unsplash.com/photo-1442512595331-e89e73853f31", lat: -1.9515, lng: 30.0824 },
  { name: "Pili Pili", rate: "4.7", quote: "Poolside vibes and the best grilled tilapia.", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836", lat: -1.9322, lng: 30.1245 },
  { name: "Repub Lounge", rate: "4.8", quote: "Authentic flavors with a view of the city lights.", img: "https://images.unsplash.com/photo-1552566626-52f8b828add9", lat: -1.9501, lng: 30.0622 },
  { name: "Poivre Noir", rate: "4.6", quote: "French-Belgian fusion with a cozy, artistic vibe.", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de", lat: -1.9460, lng: 30.0600 },
  { name: "Meze Fresh", rate: "4.5", quote: "The best Mexican burritos in Kigali. Fast and fresh.", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47", lat: -1.9490, lng: 30.0630 },
  { name: "Camellia Tea", rate: "4.4", quote: "A bustling local favorite for tea and quick bites.", img: "https://images.unsplash.com/photo-1576489022157-76984da21907", lat: -1.9440, lng: 30.0620 },
];

const heroSlides = places.slice(0, 5);

function mapHref(p: Place): string {
  return `map.php?name=${encodeURIComponent(p.name)}&lat=${p.lat}&lng=${p.lng}`;
}

export default function RestaurantsPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [modal, setModal] = useState<Place | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const showSlide = (index: number) => setCurrentSlide(index);
  const toggleMore = () => setIsExpanded((prev) => !prev);
  const openModal = (p: Place) => setModal(p);
  const closeModal = () => setModal(null);

  return (
    <div className="restaurants-page">
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/restaurants.css" />

      <section className="hero">
        <div id="heroSlider">
          {heroSlides.map((p, i) => (
            <div
              key={p.name}
              className={`slide ${i === currentSlide ? "active" : ""}`}
              style={{ backgroundImage: `url('${p.img}?q=80&w=2000')` }}
            >
              <div className="content">
                <h1>{p.name}</h1>
                <a href={mapHref(p)} className="route-trigger">
                  📍 GET DIRECTIONS
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="dots" id="heroDots">
          {heroSlides.map((p, i) => (
            <div
              key={p.name}
              className={`dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => showSlide(i)}
            />
          ))}
        </div>
      </section>

      <main className="container">
        <div className="section-header">
          <div>
            <p>TASTE OF KIGALI</p>
            <h2>Popular Dining</h2>
          </div>
          <button className="toggle-btn" id="toggleBtn" onClick={toggleMore}>
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        </div>
        <div className="grid" id="placesGrid">
          {places.map((p, i) => {
            const shown = i < 4 || isExpanded;
            return (
              <div
                key={p.name}
                className={`card ${shown ? "visible reveal" : ""}`}
                onClick={() => openModal(p)}
              >
                <div className="card-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${p.img}?w=600`} alt={p.name} />
                </div>
                <div className="card-info">
                  <h3>{p.name}</h3>
                  <p>Kigali, Rwanda</p>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <div
        className={`modal-overlay ${modal ? "active" : ""}`}
        id="modalOverlay"
        onClick={closeModal}
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div
            className="modal-left"
            id="modalImg"
            style={modal ? { backgroundImage: `url(${modal.img}?w=1000)` } : undefined}
          />
          <div className="modal-right">
            <button className="close-btn" onClick={closeModal}>
              ✕
            </button>
            <h2 className="modal-title" id="modalTitle">
              {modal?.name}
            </h2>
            <div className="modal-meta" id="modalRating">
              {modal ? `★ ${modal.rate} Rating` : ""}
            </div>

            <div className="quote-box" id="modalQuote">
              {modal ? `“${modal.quote}”` : ""}
            </div>

            <div
              className="info-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "15px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span style={{ color: "#777" }}>Atmosphere</span>
              <span style={{ fontWeight: 700, color: "var(--black-matte)" }}>
                Excellent
              </span>
            </div>
            <div
              className="info-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "15px 0",
                marginBottom: "20px",
              }}
            >
              <span style={{ color: "#777" }}>Service</span>
              <span style={{ fontWeight: 700, color: "var(--black-matte)" }}>
                5-Star
              </span>
            </div>

            <a
              href={modal ? mapHref(modal) : "#"}
              className="modal-route-btn"
              id="modalLink"
            >
              Route Directly <i className="fas fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
