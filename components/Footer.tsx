import Link from "next/link";

// Ported from legacy include/footer.php. Broken .html links repointed to
// the real Next.js routes.
export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 col-md-6 mb-4">
            <Link href="/" className="footer-brand">
              <i className="fas fa-map-location-dot"></i> Visit<span>Rwanda</span>
            </Link>
            <p className="footer-desc">
              The official guide to the Land of a Thousand Hills. We help you find
              the best stays, historic sites, and safe travel routes.
            </p>
            <div className="social-links">
              <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
              <a href="#" title="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" title="YouTube"><i className="fab fa-youtube"></i></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <h5 className="footer-title">Explore</h5>
            <ul className="footer-links">
              <li><Link href="/homes">Stays &amp; Hotels</Link></li>
              <li><Link href="/historics">Culture &amp; History</Link></li>
              <li><Link href="/wonders">Nature &amp; Hiking</Link></li>
              <li><Link href="/map">Transport Info</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-6 mb-4">
            <h5 className="footer-title">Company</h5>
            <ul className="footer-links">
              <li><Link href="/about">About Us</Link></li>
              <li><a href="#">Contact Support</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><Link href="/admin">Admin login</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6 mb-4">
            <h5 className="footer-title">Weekly Travel Tips</h5>
            <p className="small text-muted">Join 10,000+ travelers getting local guides.</p>
            <form className="newsletter-form">
              <input type="email" placeholder="Email address" required />
              <button type="submit" className="btn-subscribe">Subscribe</button>
            </form>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <div className="copyright">
            &copy; 2026 Visit Rwanda Project. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
