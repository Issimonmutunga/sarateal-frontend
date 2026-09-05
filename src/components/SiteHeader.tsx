interface SiteHeaderProps {
  route: "home" | "app" | "developers";
}

const NAV_ITEMS: Array<{ route: "home" | "app" | "developers"; href: string; label: string }> = [
  { route: "home", href: "/", label: "Overview" },
  { route: "app", href: "/app", label: "Workspace" },
  { route: "developers", href: "/developers", label: "Developers" },
];

export function SiteHeader({ route }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Sarateal home">
        <span className="brand-mark" aria-hidden="true">
          <img src="/favicon.svg" alt="" width="38" height="38" />
        </span>
        <span>Sarateal</span>
      </a>

      <nav className="site-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.route}
            href={item.href}
            className={route === item.route ? "is-active" : undefined}
            aria-current={route === item.route ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <a className="btn btn-primary btn-sm" href="/app">
        Open workspace
      </a>
    </header>
  );
}
