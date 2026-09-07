import { Suspense, lazy } from "react";

import { HERO, ROLE_SECTION, ROLE_CTAS } from "../lib/seo";
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

function Lines({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <span key={index}>
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

function RoleCtas() {
  return (
    <section className="role-ctas" id="role" data-reveal>
      <div className="role-heading">
        <h2>{ROLE_SECTION.heading}</h2>
        <p>{ROLE_SECTION.subnote}</p>
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
            <span className="role-card-icon" aria-hidden="true">
              {cta.icon}
            </span>
            <span className="role-card-main">
              <span className="role-card-title">{cta.title}</span>
              <span className="role-card-desc">{cta.body}</span>
              <span className="role-card-action">{cta.action}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function HeroSection() {
  return (
    <>
    <section className="hero" id="hero" data-reveal>
      <div className="hero-layout">
        <div className="hero-copy">
          <h1>
            <Lines text={HERO.headline} />
          </h1>
          <p className="hero-text lede">
            <Lines text={HERO.text} />
          </p>

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
    </section>

    <RoleCtas />
    </>
  );
}