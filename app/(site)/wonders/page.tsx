"use client";

import { useState } from "react";

interface Wonder {
  name: string;
  type: string;
  desc: string;
  img: string;
}

const wonders: Wonder[] = [
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

const filters: { label: string; value: string }[] = [
  { label: "All Wonders", value: "all" },
  { label: "National Parks", value: "National Park" },
  { label: "Lakes & Rivers", value: "Water" },
  { label: "Wildlife", value: "Wildlife" },
];

export default function WondersPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedWonder, setSelectedWonder] = useState<Wonder | null>(null);

  const visibleWonders = wonders.filter(
    (w) => activeFilter === "all" || w.type === activeFilter
  );

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/wonders.css" />

      <header className="wonders-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <span className="tagline">Explore the Remarkable</span>
          <h1>
            Rwanda <span className="green-text">Wonders</span>
          </h1>
          <p>
            From the home of the mountain gorillas to the shores of the Great
            Rift Valley.
          </p>
        </div>
      </header>

      <main className="container">
        <div className="filter-bar">
          {filters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn${activeFilter === f.value ? " active" : ""}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="wonders-grid" id="wondersGrid">
          {visibleWonders.map((w) => (
            <div
              key={w.name}
              className="wonder-card fade-in"
              onClick={() => setSelectedWonder(w)}
            >
              <div className="card-img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={w.img} alt={w.name} />
                <div className="card-overlay">
                  <h3>{w.name}</h3>
                  <span>{w.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div
        id="wonderModal"
        className={`modal-overlay${selectedWonder ? " active" : ""}`}
        onClick={() => setSelectedWonder(null)}
      >
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="close-x" onClick={() => setSelectedWonder(null)}>
            &times;
          </button>
          <div className="modal-split">
            <div
              className="modal-img"
              id="modalImg"
              style={
                selectedWonder
                  ? { backgroundImage: `url(${selectedWonder.img})` }
                  : undefined
              }
            ></div>
            <div className="modal-info">
              <h2 id="modalTitle">{selectedWonder?.name}</h2>
              <span className="modal-tag" id="modalTag">
                {selectedWonder?.type}
              </span>
              <p id="modalDesc">{selectedWonder?.desc}</p>
              <div className="modal-action">
                <a href="transport" className="btn-book">
                  Plan Transport
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
