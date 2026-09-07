import { ABOUT } from "../lib/seo";
import { SaratealLogo } from "./SaratealLogo";

export function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero" data-reveal>
        <span className="eyebrow" aria-hidden="true">
          {ABOUT.eyebrow}
        </span>
        <h1>
          <SaratealLogo size="hero" />
        </h1>
        <p className="about-subheading">{ABOUT.subheading}</p>
        <blockquote className="about-question">“{ABOUT.question}”</blockquote>
        <div className="about-intro">
          {ABOUT.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="about-ctas">
          <a className="btn btn-primary" href="/app">
            Open the workspace
          </a>
          <a className="btn btn-secondary" href="/developers">
            For developers
          </a>
        </div>
      </section>

      <section className="about-block" data-reveal>
        <h2>What Sarateal produces</h2>
        <p className="section-subnote">For every market, product, and time period, three related outputs.</p>
        <div className="about-outputs">
          {ABOUT.outputs.map((output) => (
            <div className="about-output" key={output.label}>
              <span className="about-symbol" aria-hidden="true">
                {output.symbol}
              </span>
              <h3>{output.label}</h3>
              <p>{output.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-block" data-reveal>
        <h2>The five signals behind opportunity</h2>
        <p className="section-subnote">{ABOUT.signalIntro}</p>
        <ol className="about-signals">
          {ABOUT.signals.map((signal) => (
            <li className="about-signal" key={signal.number}>
              <span className="about-signal-number">{signal.number}</span>
              <span className="about-signal-body">
                <strong>{signal.title}</strong>
                <span>{signal.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-block about-merge" data-reveal>
        <div className="about-column">
          <h2>{ABOUT.combine.heading}</h2>
          <code className="about-formula">{ABOUT.combine.formula}</code>
          <p>{ABOUT.combine.extra}</p>
        </div>
        <div className="about-column">
          <h2>{ABOUT.confidence.heading}</h2>
          <code className="about-formula">{ABOUT.confidence.formula}</code>
          <div className="about-tags">
            {ABOUT.confidence.factors.map((factor) => (
              <span className="signal-chip is-strong-entry" key={factor}>
                {factor}
              </span>
            ))}
          </div>
          <p>{ABOUT.confidence.extra}</p>
        </div>
      </section>

      <section className="about-block" data-reveal>
        <h2>{ABOUT.entry.heading}</h2>
        <p className="section-subnote">{ABOUT.entry.body}</p>
        <div className="about-entry-grid">
          {ABOUT.entry.grid.map((cell) => (
            <div className={`about-entry-cell is-${cell.tone}`} key={cell.label}>
              <div className="about-entry-meta">
                <span>{cell.o}</span>
                <span>{cell.c}</span>
              </div>
              <strong>{cell.label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="about-block about-principle" data-reveal>
        <h2>{ABOUT.dataPrinciple.heading}</h2>
        <p>{ABOUT.dataPrinciple.body}</p>
      </section>

      <section className="about-block" data-reveal>
        <h2>{ABOUT.distinctive.heading}</h2>
        <ul className="about-distinctive">
          {ABOUT.distinctive.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="cta-band about-cta" data-reveal>
        <h2>{ABOUT.cta.heading}</h2>
        {ABOUT.cta.subnote && <p className="section-subnote">{ABOUT.cta.subnote}</p>}
        <a className="btn btn-primary" href="/app">
          Open the workspace
        </a>
      </section>
    </div>
  );
}