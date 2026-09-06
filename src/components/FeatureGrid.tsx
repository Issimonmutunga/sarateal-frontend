import { METHOD_SECTION, METHOD_STEPS } from "../lib/seo";

export function FeatureGrid() {
  return (
    <section className="feature-section" id="method">
      <div className="section-heading">
        <h2>{METHOD_SECTION.heading}</h2>
      </div>

      <ol className="method-list">
        {METHOD_STEPS.map((step) => (
          <li className="method-step" key={step.number} data-reveal>
            <span className="method-number">{step.number}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}