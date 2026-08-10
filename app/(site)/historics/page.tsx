"use client";

import { useState } from "react";

interface Place {
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

const placesData: Place[] = [
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
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg/800px-King%27s_Palace%2C_Nyanza%2C_Rwanda.jpg",
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
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Rwanda_National_Museum.jpg/1024px-Rwanda_National_Museum.jpg",
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
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Kandt_House_Museum_of_Natural_History.jpg/800px-Kandt_House_Museum_of_Natural_History.jpg",
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
    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Murambi_Genocide_Memorial.jpg/800px-Murambi_Genocide_Memorial.jpg",
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
    img: "https://live.staticflickr.com/65535/48598424266_5548657685_b.jpg",
    lat: -1.9536,
    lng: 30.0965,
  },
];

export default function HistoricsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const openModalById = (id: number) => {
    const place = placesData.find((p) => p.id === id);
    if (place) setSelectedPlace(place);
  };

  const openModal = (place: Place) => setSelectedPlace(place);
  const closeModal = () => setSelectedPlace(null);

  const visiblePlaces = placesData.filter(
    (place) => filter === "all" || place.category === filter
  );

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/historic.css" />

      <div className="parallax-hero">
        <div className="hero-content reveal">
          <span className="tag-line">Visit Rwanda</span>
          <h1>
            Explore Our <br />
            <span className="highlight">Heritage Sites</span>
          </h1>
          <p>
            Discover museums, palaces, and memorials that shape our nation.
            <br />
            Plan your journey today.
          </p>
        </div>
      </div>

      <div className="rwanda-history-container">
        <div className="spotlight-section reveal">
          <div className="section-header">
            <h2>Must-Visit Destinations</h2>
            <p>Top-rated cultural sites chosen by travelers.</p>
          </div>

          <div className="spotlight-wrapper">
            <div className="spotlight-card" onClick={() => openModalById(2)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3dVglEND80F2pSPiGUhR2sWYnDYE3YQI9Qg&s"
                className="spotlight-bg"
                alt="King's Palace Nyanza"
              />
              <div className="spotlight-overlay">
                <span className="badge">Cultural Gem</span>
                <h3>King&apos;s Palace Nyanza</h3>
              </div>
            </div>
            <div className="spotlight-card" onClick={() => openModalById(1)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.assetzen.net/i/j6wGs3oQ8F9T/w:1165/h:480/q:70.jpg"
                className="spotlight-bg"
                alt="Kigali Memorial"
              />
              <div className="spotlight-overlay">
                <span className="badge">Top Rated</span>
                <h3>Kigali Memorial</h3>
              </div>
            </div>
            <div className="spotlight-card" onClick={() => openModalById(3)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtVPPx_9JKRP7XUEBektwuKCRBAGnyeGYO5w&s"
                className="spotlight-bg"
                alt="Ethnographic Museum"
              />
              <div className="spotlight-overlay">
                <span className="badge">Best Museum</span>
                <h3>Ethnographic Museum</h3>
              </div>
            </div>
            <div className="spotlight-card" onClick={() => openModalById(4)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQw7xCExDEsN-Ux3fUMuhfwYkugmneZDAx7XQ&s"
                className="spotlight-bg"
                alt="Kandt House Museum"
              />
              <div className="spotlight-overlay">
                <span className="badge">History</span>
                <h3>Kandt House Museum</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="section-divider reveal">
          <h2>Find Your Next Stop</h2>
          <div className="filter-tabs">
            <button
              className={`tab${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}
            >
              Show All
            </button>
            <button
              className={`tab${filter === "Memorial" ? " active" : ""}`}
              onClick={() => setFilter("Memorial")}
            >
              Memorials
            </button>
            <button
              className={`tab${filter === "Museum" ? " active" : ""}`}
              onClick={() => setFilter("Museum")}
            >
              Museums
            </button>
          </div>
        </div>

        <div className="places-grid" id="places-grid">
          {visiblePlaces.map((place) => (
            <div
              key={place.id}
              className="spotlight-card"
              style={{ flex: "none", height: "300px" }}
              onClick={() => openModal(place)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={place.img} alt={place.name} className="spotlight-bg" />
              <div className="spotlight-overlay">
                <span className="badge" style={{ fontSize: "0.7rem" }}>
                  {place.category}
                </span>
                <h3 style={{ fontSize: "1.5rem" }}>{place.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedPlace && (
        <div
          id="site-modal"
          className="modal-overlay"
          style={{ display: "flex" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="modal-card">
            <div className="modal-visuals">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img id="modal-img" src={selectedPlace.img} alt="Place Image" />
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
              <div className="modal-badges">
                <span id="modal-cat-badge" className="badge-blur">
                  {selectedPlace.category}
                </span>
              </div>
            </div>
            <div className="modal-details">
              <div className="modal-header-row">
                <h2 id="modal-title">{selectedPlace.name}</h2>
                <div className="rating-box">
                  <i className="fas fa-star text-warning"></i> <span>4.8</span>
                </div>
              </div>
              <div className="status-row">
                <span className="status-pill open">
                  <i className="fas fa-clock"></i> Open Now
                </span>
                <span className="status-pill location">
                  <i className="fas fa-map-pin"></i>{" "}
                  <span id="modal-loc">{selectedPlace.location}</span>
                </span>
              </div>
              <hr className="divider" />
              <div className="modal-description">
                <h3>About this place</h3>
                <p id="modal-desc">{selectedPlace.desc}</p>
              </div>
              <div className="info-box">
                <div className="info-row">
                  <div className="icon-box">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div>
                    <strong>Opening Hours</strong>
                    <p id="modal-hours">{selectedPlace.hours}</p>
                  </div>
                </div>
              </div>
              <div className="map-action-area">
                <div id="mini-map"></div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`}
                  id="modal-directions"
                  target="_blank"
                  className="btn-action"
                >
                  <div className="btn-text">
                    <span>Get Directions</span>
                    <small>Open in Google Maps</small>
                  </div>
                  <div className="btn-icon">
                    <i className="fas fa-location-arrow"></i>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
