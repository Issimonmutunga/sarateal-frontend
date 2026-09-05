import { FEATURES, FEATURE_SECTION } from "../lib/seo";

type Feature = (typeof FEATURES)[number] & { icon: React.ReactNode };

const FEATURE_ICONS: Record<(typeof FEATURES)[number]["title"], React.ReactNode> = {
  "Market prices": (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M15 8h5v5" />
    </svg>
  ),
  "Supply & demand": (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9l3-3 4 4 6-6" />
      <path d="M14 4h3v3" />
      <path d="M4 15l3 3 4-4 6 6" />
      <path d="M14 20h3v-3" />
    </svg>
  ),
  "Weather risk": (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 12a5 5 0 0 0-9.2-2.5A4 4 0 0 0 8.5 18H17a4 4 0 0 0 0-6z" />
      <path d="M12 2v2" />
      <path d="M4 8H2" />
      <path d="M22 8h-2" />
    </svg>
  ),
  "Verified locations": (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
};

const FEATURES_WITH_ICONS: Feature[] = FEATURES.map((feature) => ({
  ...feature,
  icon: FEATURE_ICONS[feature.title],
}));

export function FeatureGrid() {
  return (
    <section className="feature-section" id="features">
      <div className="section-heading">
        <p className="eyebrow">{FEATURE_SECTION.eyebrow}</p>
        <h2>{FEATURE_SECTION.heading}</h2>
        <p className="section-subnote">{FEATURE_SECTION.subnote}</p>
      </div>

      <div className="feature-grid">
        {FEATURES_WITH_ICONS.map((feature) => (
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