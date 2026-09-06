import { ENGINE_FLOW, METHOD_SECTION, METHOD_STEPS, OVERVIEW_POINTS, OVERVIEW_SECTION } from "../lib/seo";

const FLOW_STAGES = [
  { stage: ENGINE_FLOW.data },
  { stage: ENGINE_FLOW.engine },
  { stage: ENGINE_FLOW.signals },
  { stage: ENGINE_FLOW.action },
];

export function FeatureGrid() {
  return (
    <section className="feature-section" id="method">
      <div className="section-heading">
        <p className="eyebrow">{METHOD_SECTION.eyebrow}</p>
        <h2>{METHOD_SECTION.heading}</h2>
      </div>

      <div className="flow-band" data-reveal>
        {FLOW_STAGES.map(({ stage }, index) => (
          <div className="flow-stage" key={stage.label}>
            <span className="flow-stage-index">0{index + 1}</span>
            <span className="flow-stage-label">{stage.label}</span>
            <ul>
              {stage.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
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

      <div className="overview-band" data-reveal>
        <p className="eyebrow">{OVERVIEW_SECTION.eyebrow}</p>
        <h3>{OVERVIEW_SECTION.heading}</h3>
        <p>{OVERVIEW_SECTION.subnote}</p>
      </div>

      <div className="overview-grid">
        {OVERVIEW_POINTS.map((item) => (
          <article className="overview-point" key={item.title} data-reveal>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}