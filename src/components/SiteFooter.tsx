import { API_BASE_URL } from "../lib/config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 21v-7a8 8 0 0 1 16 0v7" />
              <path d="M2 21h20" />
              <path d="M12 4v10" />
              <path d="M8 7h8" />
            </svg>
          </span>
          <div>
            <strong>Sarateal</strong>
            <p>Food supply intelligence for farmers and buyers.</p>
          </div>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-col">
            <span className="footer-heading">Product</span>
            <a href="#/">Home</a>
            <a href="#/app">The app</a>
          </div>
          <div className="footer-col">
            <span className="footer-heading">Developers</span>
            <a href="#/developers">API overview</a>
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