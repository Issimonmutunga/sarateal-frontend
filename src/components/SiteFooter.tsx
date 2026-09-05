import { API_BASE_URL } from "../lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true">
            <img src="/favicon.svg" alt="" width="34" height="34" />
          </span>
          <div>
            <strong>Sarateal</strong>
            <p>Food supply intelligence for farmers and buyers.</p>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-col">
            <span className="footer-heading">Product</span>
            <a href="/">Home</a>
            <a href="/app">The app</a>
          </div>
          <div className="footer-col">
            <span className="footer-heading">Developers</span>
            <a href="/developers">API overview</a>
            <a href={`${API_BASE_URL}/docs`} target="_blank" rel="noreferrer">
              API documentation ↗
            </a>
          </div>
        </nav>
      </div>

      <div className="footer-legal">
        <span>© {new Date().getFullYear()} Sarateal</span>
        <span>Real records only — no simulated market data.</span>
      </div>
    </footer>
  );
}
