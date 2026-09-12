import { Suspense, lazy } from "react";

import { HERO } from "../lib/seo";

const HeroMap = lazy(() =>
  import("./HeroMap").then((module) => ({ default: module.HeroMap })),
);

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

export function HeroSection() {
  return (
    <section className="home-hero" id="hero" data-reveal>
      <div className="home-hero-map" aria-hidden="false">
        <Suspense fallback={<div className="home-hero-map-canvas" />}>
          <HeroMap />
        </Suspense>
      </div>

      <div className="home-hero-scrim" aria-hidden="true" />

      <div className="home-hero-copy">
        <h1>
          <Lines text={HERO.headline} />
        </h1>

        <div className="about-ctas">
          <a className="btn btn-primary" href={HERO.primaryCta.href}>
            {HERO.primaryCta.label}
          </a>
          <a className="btn btn-secondary" href={HERO.secondaryCta.href}>
            {HERO.secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}