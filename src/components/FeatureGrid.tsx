const featureCards = [
  {
    title: "Market Prices",
    description: "Track produce prices and compare market movement.",
  },
  {
    title: "Supply & Demand",
    description: "Connect available farmer supply to buyer demand.",
  },
  {
    title: "Weather Risk",
    description: "Check county and market weather signals for decisions.",
  },
  {
    title: "Verified Locations",
    description: "Use cached and verified coordinates for trusted lookup.",
  },
];

export function FeatureGrid() {
  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">What it does</p>
        <h2>One backend for market coordination</h2>
      </div>

      <div className="feature-grid">
        {featureCards.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}