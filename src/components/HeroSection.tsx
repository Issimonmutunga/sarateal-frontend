import { HERO } from "../lib/seo";
import { AppIcon } from "./AppIcon";
import { HomeBackdrop } from "./HomeBackdrop";

const HOME_SLIDES = [{ src: "/home/slide-1.avif", alt: "" }];

function Lines({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className="hero-line">
          {line}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function HeroSection() {
  return (
    <>
      <div className="home-hero-map" aria-hidden="false">
        <HomeBackdrop slides={HOME_SLIDES} />
      </div>

      <section className="home-hero" id="hero" data-reveal>
        <div className="home-hero-copy">
          <h1>
            <Lines text={HERO.headline} />
          </h1>

          <p className="home-hero-text">{HERO.text}</p>

          <div className="about-ctas hero-paths">
            <a className="btn btn-primary" href={HERO.primaryCta.href}>
              {HERO.primaryCta.label}
            </a>
            <a className="btn btn-secondary" href={HERO.secondaryCta.href}>
              {HERO.secondaryCta.label}
            </a>
          </div>
          <a className="hero-tertiary" href={HERO.tertiaryCta.href}>
            {HERO.tertiaryCta.label} →
          </a>

          <ul className="hero-assurances">
            {HERO.assurances.map((item) => (
              <li key={item}>
                <AppIcon name="check" size={14} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}