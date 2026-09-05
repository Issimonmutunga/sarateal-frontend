import { HERO, WORKFLOW_NOTE, WORKFLOW_STEPS } from "../lib/seo";

function WorkflowPanel() {
  return (
    <aside className="workflow-panel" aria-label="How Sarateal works">
      <div className="workflow-head">
        <span className="eyebrow">The engine</span>
        <h2>From records to action</h2>
      </div>
      <ol className="workflow-steps">
        {WORKFLOW_STEPS.map((step) => (
          <li key={step.number}>
            <span className="workflow-number">{step.number}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="workflow-note">{WORKFLOW_NOTE}</p>
    </aside>
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
              Open the app
            </a>
            <a className="btn btn-secondary" href="#features">
              See how it works
            </a>
          </div>
        </div>

        <WorkflowPanel />
      </div>
    </section>
  );
}