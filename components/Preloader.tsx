"use client";

import { useEffect, useState } from "react";

// Ported from legacy include/preloader.php. The curtain slide-up and DOM
// removal are driven by React state instead of inline <script>.
export default function Preloader() {
  const [loaded, setLoaded] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const slideUp = setTimeout(() => setLoaded(true), 3000);
    const remove = setTimeout(() => setGone(true), 3900);
    return () => {
      clearTimeout(slideUp);
      clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div id="preloader" className={loaded ? "loaded" : ""}>
      <div className="loader-content">
        <h1 className="loader-text">
          <span>Visit</span>
          <span className="stroke-text">Rwanda</span>
        </h1>
        <div className="loader-line"></div>
      </div>
    </div>
  );
}
