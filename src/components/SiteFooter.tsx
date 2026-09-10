import { API_BASE_URL } from "../lib/config";
import { AppIcon } from "./AppIcon";

function FooterLink({ href, icon, label }: { href: string; icon: "home" | "pin" | "target" | "bell" | "box" | "cart" | "tag" | "upload" | "book" | "code" | "mail" | "info"; label: string }) {
  const external = href.startsWith("http");

  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>
      <AppIcon name={icon} size={20} />
      <span>{label}</span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-col">
            <span className="footer-heading">Workspace</span>
            <FooterLink href="#/app/overview" icon="home" label="Overview" />
            <FooterLink href="#/app/markets" icon="pin" label="Markets" />
            <FooterLink href="#/app/opportunity" icon="target" label="Opportunity" />
            <FooterLink href="#/app/matches" icon="bell" label="Matches" />
          </div>
          <div className="footer-col">
            <span className="footer-heading">Data</span>
            <FooterLink href="#/app/supply" icon="box" label="Supply" />
            <FooterLink href="#/app/demand" icon="cart" label="Demand" />
            <FooterLink href="#/app/prices" icon="tag" label="Prices" />
            <FooterLink href="#/app/exports" icon="upload" label="Exports" />
          </div>
          <div className="footer-col">
            <span className="footer-heading">Developers</span>
            <FooterLink href="/about" icon="info" label="About Sarateal" />
            <FooterLink href="/developers" icon="code" label="API overview" />
            <FooterLink href={`${API_BASE_URL}/docs`} icon="book" label="API documentation" />
            <FooterLink href="https://www.simonmapper.co.ke" icon="mail" label="Contact developer" />
          </div>
        </nav>
      </div>

      <div className="footer-legal">
        <span>
          © {new Date().getFullYear()} <span className="legal-brand">Sarateal</span>
        </span>
        <span>Real records only.</span>
      </div>
    </footer>
  );
}