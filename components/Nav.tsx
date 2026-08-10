"use client";

import Link from "next/link";
import { useState } from "react";

// Ported from legacy include/nav.php. Bootstrap's collapse/dropdown JS is
// replaced with React state so we don't have to ship bootstrap.bundle.js.
export default function Nav() {
  const [open, setOpen] = useState(false); // mobile menu
  const [dropdown, setDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) =>
    setDropdown((cur) => (cur === name ? null : name));

  return (
    <nav className="navbar navbar-expand-lg fixed-top">
      <div className="container">
        <Link className="navbar-brand" href="/">
          <span className="brand-text">
            Tem<span className="brand-highlight">bera</span>
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="fas fa-bars"></span>
        </button>

        <div className={`collapse navbar-collapse${open ? " show" : ""}`} id="mainNav">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" href="/">
                <i className="fas fa-home"></i> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/homes">
                <i className="fas fa-bed"></i> Stays
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/restaurants">
                <i className="fas fa-utensils"></i> Dining
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/churches">
                <i className="fa-solid fa-church"></i> Churches
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/map">
                <i className="fa-solid fa-map"></i> Map
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/about">
                <i className="fa-regular fa-newspaper"></i> About us
              </Link>
            </li>

            <li className={`nav-item dropdown${dropdown === "discover" ? " show" : ""}`}>
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown("discover");
                }}
              >
                <i className="fas fa-compass"></i> Discover
              </a>
              <ul className={`dropdown-menu fade-up${dropdown === "discover" ? " show" : ""}`}>
                <li>
                  <Link className="dropdown-item" href="/historics">
                    <i className="fas fa-landmark"></i> Historics &amp; Museums
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/wonders">
                    <i className="fas fa-tree"></i> Parks &amp; Nature
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/playground">
                    <i className="fas fa-futbol"></i> Arenas &amp; Events
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/gyms">
                    <i className="fa-solid fa-dumbbell"></i> Gym
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/wonders">
                    <i className="fa-brands fa-pagelines"></i> Wonders
                  </Link>
                </li>
              </ul>
            </li>

            <li className={`nav-item dropdown${dropdown === "services" ? " show" : ""}`}>
              <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  toggleDropdown("services");
                }}
              >
                <i className="fas fa-info-circle"></i> Services
              </a>
              <ul className={`dropdown-menu fade-up${dropdown === "services" ? " show" : ""}`}>
                <li>
                  <Link className="dropdown-item" href="/map">
                    <i className="fas fa-hospital"></i> Hospitals
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/shops">
                    <i className="fas fa-store"></i> Shops &amp; Markets
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" href="/map">
                    <i className="fas fa-money-bill-wave"></i> Banks &amp; ATMs
                  </Link>
                </li>
              </ul>
            </li>

            <li className="nav-item ms-lg-2">
              <Link className="btn-book" href="/booking">
                Plan Trip <i className="fas fa-arrow-right"></i>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
