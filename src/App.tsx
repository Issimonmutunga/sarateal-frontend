import "./App.css";

import { BackendStatusCard } from "./components/BackendStatusCard";
import { FeatureGrid } from "./components/FeatureGrid";
import { QuickLinks } from "./components/QuickLinks";
import { API_BASE_URL } from "./lib/config";

function App() {
  return (
    <main className="app-shell">
      <section className="hero">
        <nav className="topbar" aria-label="Main navigation">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              🌿
            </span>
            <span>Sarateal</span>
          </div>
          <a href={API_BASE_URL} target="_blank" rel="noreferrer">
            Backend live
          </a>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              Market access. Fair prices. Smarter decisions.
            </p>
            <h1>Food supply intelligence for farmers and buyers.</h1>
            <p className="hero-text">
              Sarateal connects farmer supply, buyer demand, prices, tenders,
              weather signals, and trusted location data into one lightweight
              agricultural market platform.
            </p>

            <div className="hero-actions">
              <a
                className="primary-action"
                href={`${API_BASE_URL}/docs`}
                target="_blank"
                rel="noreferrer"
              >
                Explore API
              </a>
              <a
                className="secondary-action"
                href={`${API_BASE_URL}/health`}
                target="_blank"
                rel="noreferrer"
              >
                Check status
              </a>
            </div>
          </div>

          <BackendStatusCard />
        </div>
      </section>

      <FeatureGrid />
      <QuickLinks />
    </main>
  );
}

export default App;