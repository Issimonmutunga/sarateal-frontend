interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FEATURES: Array<{ title: string; description: string; icon: React.ReactNode }> = [
  {
    title: "Market prices",
    description: "Track produce prices and compare movement across markets.",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 4 4 8-8" />
        <path d="M15 8h5v5" />
      </svg>
    ),
  },
  {
    title: "Supply & demand",
    description: "Connect available farmer supply directly to buyer demand.",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9l3-3 4 4 6-6" />
        <path d="M14 4h3v3" />
        <path d="M4 15l3 3 4-4 6 6" />
        <path d="M14 20h3v-3" />
      </svg>
    ),
  },
  {
    title: "Weather risk",
    description: "County and market weather signals inform seasonal decisions.",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 12a5 5 0 0 0-9.2-2.5A4 4 0 0 0 8.5 18H17a4 4 0 0 0 0-6z" />
        <path d="M12 2v2" />
        <path d="M4 8H2" />
        <path d="M22 8h-2" />
      </svg>
    ),
  },
  {
    title: "Verified locations",
    description: "County and market coordinates resolved from trusted registries.",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
  },
] satisfies Feature[];

export function FeatureGrid() {
  return (
    <section className="feature-section" id="features">
      <div className="section-heading">
        <p className="eyebrow">What it does</p>
        <h2>One backend for market coordination</h2>
        <p className="section-subnote">
          Counties, products, markets, prices and weather signals unified in one lightweight
          agricultural market platform.
        </p>
      </div>

      <div className="feature-grid">
        {FEATURES.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}