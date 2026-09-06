import { Suspense, lazy } from "react";

import { HERO, ROLE_CTAS } from "../lib/seo";
import type { UserRole } from "../lib/db";
import { saveRole } from "../lib/db";
import { openAppTab } from "../lib/hash";

const HeroMap = lazy(() => import("./HeroMap").then((module) => ({ default: module.HeroMap })));

function goWithRole(role: UserRole, tab: string) {
  void saveRole(role).catch(() => {
    // Persistence of role is best-effort; navigation still proceeds.
  });
  openAppTab(tab);
}

function RoleCtas() {
  return (
    <section className="role-ctas" id="role" data-reveal>
      <div className="section-heading">
        <p className="eyebrow">Your goal</p>
        <h2>Choose what you want to accomplish</h2>
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
    <section className="hero" id="hero" data-reveal>
      <div className="hero-layout">
        <div className="hero-copy">
          <p className="eyebrow">{HERO.eyebrow}</p>
          <h1>{HERO.headline}</h1>
          <p className="hero-text lede">{HERO.text}</p>

          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href={HERO.primaryCta.href}>
              {HERO.primaryCta.label} →
            </a>
            <a className="btn btn-secondary btn-lg" href={HERO.secondaryCta.href}>
              {HERO.secondaryCta.label}
            </a>
            <a className="text-link hero-explore" href={HERO.exploreCta.href}>
              {HERO.exploreCta.label}
            </a>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="hero-map" aria-label={HERO.map.label}>
              <div className="hero-map-head">
                <p className="eyebrow">Live market surface</p>
                <span className="hero-map-route">Loading markets…</span>
              </div>
              <div className="skeleton-block hero-map-skeleton" />
              <div className="map-legend">
                {HERO.map.legend.map((item) => (
                  <span key={item} className="signal-chip is-strong-entry">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          }
        >
          <HeroMap />
        </Suspense>
      </div>

      <RoleCtas />
    </section>
  );
}