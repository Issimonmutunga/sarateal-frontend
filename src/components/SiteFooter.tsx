import type { Route } from "../lib/journey";
import { FOOTER_LINKS } from "../lib/seo";
import { SaratealLogo } from "./SaratealLogo";

interface SiteFooterProps {
  route: Route;
}

export function SiteFooter({ route }: SiteFooterProps) {
  return (
    <footer className={`site-footer journey-footer${route === "app" ? " is-app" : ""}`}>
      <div className="journey-footer-inner">
        {route !== "app" && (
          <div className="journey-footer-brand">
            <a href="/" aria-label="Sarateal home page">
              <SaratealLogo size="footer" />
            </a>
            <p>Know where to sell. Know where to buy.</p>
          </div>
        )}

        <nav className="journey-footer-nav" aria-label="Footer navigation">
          {FOOTER_LINKS.map((group) => (
            <div className="journey-footer-col" key={group.heading}>
              <span className="journey-footer-heading">{group.heading}</span>
              {group.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>

      <div className="journey-footer-legal">
        <span>© {new Date().getFullYear()} Sarateal</span>
        <span>Your records stay on your device.</span>
      </div>
    </footer>
  );
}
