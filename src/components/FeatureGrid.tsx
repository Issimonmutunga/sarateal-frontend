import { METHOD_SECTION, METHOD_STEPS } from "../lib/seo";

export function FeatureGrid() {
  return (
    <section className="about-block" id="method" data-reveal>
      <h2>{METHOD_SECTION.heading}</h2>
      <p className="section-subnote">{METHOD_SECTION.subnote}</p>

      <ol className="about-signals">
        {METHOD_STEPS.map((step) => (
          <li className="about-signal" key={step.number}>
            <span className="about-signal-number">{step.number}</span>
            <span className="about-signal-body">
              <strong>{step.title}</strong>
              <span>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}