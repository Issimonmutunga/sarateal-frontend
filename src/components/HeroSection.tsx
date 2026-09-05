import { HERO, LIVE_SNIPPET, ROLE_CTAS } from "../lib/seo";
import type { UserRole } from "../lib/db";
import { saveRole } from "../lib/db";

function goWithRole(role: UserRole, tab: string) {
  void saveRole(role).catch(() => {
    // Persistence of role is best-effort; navigation still proceeds.
  });
  window.location.hash = `#/app/${tab}`;
}

function LiveSignalCard() {
  return (
    <aside className="live-signal-card" aria-label="Live market signal">
      <div className="live-signal-head">
        <span className="eyebrow">{LIVE_SNIPPET.eyebrow}</span>
        <span className={`signal-chip ${LIVE_SNIPPET.signalLevel}`}>{LIVE_SNIPPET.signal}</span>
      </div>
      <p className="live-signal-route">{LIVE_SNIPPET.route}</p>
      <p className="live-signal-note">{LIVE_SNIPPET.note}</p>
      <p className="live-signal-updated">{LIVE_SNIPPET.updated}</p>
    </aside>
  );
}

function RoleCtas() {
  return (
    <section className="role-ctas" id="role" aria-label="Choose how you want to use Sarateal" data-reveal>
      <div className="section-heading">
        <p className="eyebrow">How you'll use it</p>
        <h2>Start with your role</h2>
        <p className="section-subnote">
          Pick what describes you and Sarateal will open the right place to begin.
        </p>
      </div>
      <div className="role-grid">
        {ROLE_CTAS.map((cta) => (
          <button
            type="button"
            className="role-card"
            key={cta.id}
            onClick={() => goWithRole(cta.id, cta.tab)}
            data-reveal
          >
            <h3>{cta.title}</h3>
            <p>{cta.body}</p>
            <span className="role-card-action">{cta.action}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{HERO.eyebrow}</p>
          <h1>{HERO.headline}</h1>
          <p className="hero-text">{HERO.text}</p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="/app">
              Open workspace
            </a>
            <a className="btn btn-secondary" href="#method">
              How it works
            </a>
          </div>
        </div>

        <LiveSignalCard />
      </div>

      <RoleCtas />
    </section>
  );
}
