import { API_BASE_URL } from "../lib/config";

const quickLinks = [
  {
    label: "API Docs",
    href: `${API_BASE_URL}/docs`,
  },
  {
    label: "Health",
    href: `${API_BASE_URL}/health`,
  },
  {
    label: "Markets",
    href: `${API_BASE_URL}/markets`,
  },
  {
    label: "County Weather",
    href: `${API_BASE_URL}/county-weather/forecast?county=Nairobi&forecast_days=1`,
  },
];

export function QuickLinks() {
  return (
    <section className="section-block">
      <div className="section-heading">
        <p className="eyebrow">Quick test links</p>
        <h2>Try the deployed API</h2>
      </div>

      <div className="link-grid">
        {quickLinks.map((link) => (
          <a href={link.href} target="_blank" rel="noreferrer" key={link.label}>
            {link.label}
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}