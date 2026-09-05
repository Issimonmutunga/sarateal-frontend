const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Log real records",
    description: "Supply, demand and price entries from your market.",
  },
  {
    number: "02",
    title: "The surface scores",
    description: "Every market–product cell gets an opportunity and a confidence score.",
  },
  {
    number: "03",
    title: "Act on matches",
    description: "Strong entries become matches you can pursue end to end.",
  },
];

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
      <p className="workflow-note">
        Every score comes from real data you log or live forecasts — empty data shows as low
        confidence, never as a guess.
      </p>
    </aside>
  );
}

export function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Market access · fair prices · smarter decisions</p>
          <h1>Food supply intelligence for farmers and buyers.</h1>
          <p className="hero-text">
            Sarateal turns supplier supply, buyer demand, prices and weather signals into a clear,
            actionable picture of every market opportunity.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#/app">
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