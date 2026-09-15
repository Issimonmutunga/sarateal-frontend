export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-legal footer-min">
        <span>
          © {new Date().getFullYear()} <span className="legal-brand">Sarateal</span>
        </span>
      </div>
    </footer>
  );
}