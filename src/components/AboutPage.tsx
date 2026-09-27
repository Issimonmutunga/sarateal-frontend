import { lazy, Suspense } from "react";

import { ABOUT } from "../lib/seo";
import { SaratealLogo } from "./SaratealLogo";

const Formula = lazy(() => import("./Formula").then((module) => ({ default: module.Formula })));

const OUTPUT_ICONS: Record<string, string> = {
  records:
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
  sources:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15.4 15.4 0 0 1 0 18 15.4 15.4 0 0 1 0-18z"/>',
  open: '<circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="1.2"/>',
};

const GRID_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
    <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
  </svg>
);

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
                {output.symbol === "grid" ? GRID_ICON : output.symbol}
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
          <Suspense fallback={<span className="about-formula">O = Σ wₖSₖ ÷ Σ wₖ</span>}>
            <Formula tex={ABOUT.combine.formula} />
          </Suspense>
          <p className="about-formula-legend">{ABOUT.combine.legend}</p>
          <p>{ABOUT.combine.extra}</p>
        </div>
        <div className="about-column">
          <h2>{ABOUT.confidence.heading}</h2>
          <Suspense fallback={<span className="about-formula">C = Σ wₖCₖ ÷ Σ wₖ</span>}>
            <Formula tex={ABOUT.confidence.formula} />
          </Suspense>
          <p className="about-formula-legend">{ABOUT.confidence.legend}</p>
          <div className="about-tags">
            {ABOUT.confidence.factors.map((factor) => (
              <span className="about-factor" key={factor.name} title={factor.hint}>
                {factor.name}
              </span>
            ))}
          </div>
          <p>{ABOUT.confidence.extra}</p>
        </div>
      </section>

      <section className="about-block" data-reveal>
        <h2>{ABOUT.entry.heading}</h2>
        <p className="section-subnote">{ABOUT.entry.body}</p>
        <div className="about-quadrant">
          <p className="quadrant-x-caption">
            {ABOUT.entry.axes.confidence} — High on the left, Low on the right
          </p>
          <div className="quadrant-row">
            <div className="quadrant-y-caption" aria-hidden="true">
              <span className="q-y-hint">High</span>
              <span className="q-y-label">{ABOUT.entry.axes.opportunity}</span>
              <span className="q-y-hint">Low</span>
            </div>
            <div className="about-entry-grid">
              {ABOUT.entry.grid.map((cell) => (
                <div className={`about-entry-cell is-${cell.tone}`} key={cell.label}>
                  <strong>{cell.label}</strong>
                  <span className="about-entry-action">{cell.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-block about-principle" data-reveal>
        <div className="about-principle-copy">
          <h2>{ABOUT.dataPrinciple.heading}</h2>
          <p>{ABOUT.dataPrinciple.body}</p>
        </div>
        <div className="about-principle-parts">
          {ABOUT.dataPrinciple.parts.map((part) => (
            <div className="about-principle-part" key={part.label}>
              <span className="about-principle-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: OUTPUT_ICONS[part.icon] }}
                />
              </span>
              <span className="about-principle-part-copy">
                <strong>{part.label}</strong>
                <span>{part.body}</span>
              </span>
            </div>
          ))}
        </div>
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
        <div className="about-cta-actions">
          <a className="btn btn-primary" href="/app">
            Open the workspace
          </a>
          <a className="about-cta-secondary" href="#/app/enter">
            or add your first record
          </a>
        </div>
      </section>
    </div>
  );
}