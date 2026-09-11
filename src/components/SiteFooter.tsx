export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-legal footer-min">
        <span>
          © {new Date().getFullYear()} <span className="legal-brand">Sarateal</span>
        </span>
        <a
          className="footer-contact"
          href="https://www.simonmapper.co.ke"
          target="_blank"
          rel="noreferrer"
        >
          Contact developer
        </a>
      </div>
    </footer>
  );
}