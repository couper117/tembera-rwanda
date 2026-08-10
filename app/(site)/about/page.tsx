// Ported from legacy pages/about.php. Inline <style> moved to
// /public/assets/css/about.css and scoped under .about-page.
export default function AboutPage() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/assets/css/about.css" />

      <div className="about-page">
        <header className="hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1>
              We Are <br />
              Visit Rwanda.
            </h1>
            <p>Bridging the gap between culture, technology, and exploration.</p>
          </div>
        </header>

        <section className="story-grid">
          <div className="story-text">
            <h2>Our Mission</h2>
            <p>
              Rwanda is known as the &ldquo;Land of a Thousand Hills,&rdquo; but
              for many travelers and locals alike, discovering the hidden gems
              within those hills can be a challenge.
            </p>
            <p>
              Our mission is to democratize discovery. We use open data and modern
              mapping technology to highlight everything from the smallest local
              coffee shop to the grandest national park, ensuring that the beauty
              of Rwanda is accessible to everyone.
            </p>
          </div>
          <div className="story-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1643367750096-0f9215fdd0ae?q=80&w=1074&auto=format&fit=crop"
              alt="Rwanda Landscape"
            />
          </div>
        </section>

        <section className="values-section">
          <div className="section-header">
            <h2>Why We Exist</h2>
            <div className="underline"></div>
          </div>

          <div className="card-grid">
            <div className="value-card">
              <div className="icon-box">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <h3>Smart Navigation</h3>
              <p>
                We replace confusion with clarity. Our real-time maps help you
                navigate Kigali&apos;s vibrant streets and the countryside&apos;s
                winding roads with confidence.
              </p>
            </div>
            <div className="value-card">
              <div className="icon-box">
                <i className="fas fa-heart"></i>
              </div>
              <h3>Local Culture</h3>
              <p>
                We don&apos;t just show you tourist traps. We connect you to local
                churches, markets, and communities that define the true spirit of
                Rwanda.
              </p>
            </div>
            <div className="value-card">
              <div className="icon-box">
                <i className="fas fa-code"></i>
              </div>
              <h3>Open Technology</h3>
              <p>
                Built on modern web standards using Leaflet and OpenStreetMap,
                ensuring that our data is free, fast, and constantly evolving.
              </p>
            </div>
            <div className="value-card">
              <div className="icon-box">
                <i className="fas fa-eye"></i>
              </div>
              <h3>Future Vision</h3>
              <p>
                We envision a digitally connected Rwanda where every business, no
                matter how small, can be discovered by the world.
              </p>
            </div>
          </div>
        </section>

        <section className="stats-bar">
          <div className="stat-item">
            <h3>30+</h3>
            <p>Provinces Mapped</p>
          </div>
          <div className="stat-item">
            <h3>150+</h3>
            <p>Hidden Gems</p>
          </div>
          <div className="stat-item">
            <h3>10k+</h3>
            <p>Happy Travelers</p>
          </div>
        </section>
      </div>
    </>
  );
}
