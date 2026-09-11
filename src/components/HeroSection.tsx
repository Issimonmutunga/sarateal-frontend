import { HERO } from "../lib/seo";

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
    <section className="about-hero" id="hero" data-reveal>
      <span className="eyebrow" aria-hidden="true">
        {HERO.eyebrow}
      </span>
      <h1>
        <Lines text={HERO.headline} />
      </h1>
      <p className="about-subheading">{HERO.text}</p>

      <div className="about-ctas">
        <a className="btn btn-primary" href={HERO.primaryCta.href}>
          {HERO.primaryCta.label}
        </a>
        <a className="btn btn-secondary" href={HERO.secondaryCta.href}>
          {HERO.secondaryCta.label}
        </a>
      </div>
    </section>
  );
}