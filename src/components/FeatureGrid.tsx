import { EDITORIAL, FEATURE_SECTION } from "../lib/seo";

export function FeatureGrid() {
  return (
    <section className="feature-section" id="how">
      <div className="section-heading">
        <p className="eyebrow">{FEATURE_SECTION.eyebrow}</p>
        <h2>{FEATURE_SECTION.heading}</h2>
        <p className="section-subnote">{FEATURE_SECTION.subnote}</p>
      </div>

      <div className="editorial-grid">
        {EDITORIAL.map((item) => (
          <article className="editorial-block" key={item.title} data-reveal>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
