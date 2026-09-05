interface SiteHeaderProps {
  route: "home" | "app" | "developers";
}

const NAV_ITEMS: Array<{ route: "home" | "app" | "developers"; href: string; label: string }> = [
  { route: "home", href: "#/", label: "Product" },
  { route: "app", href: "#/app", label: "The app" },
  { route: "developers", href: "#/developers", label: "Developers" },
];

export function SiteHeader({ route }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="Sarateal home">
        <span className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 21v-7a8 8 0 0 1 16 0v7" />
            <path d="M2 21h20" />
            <path d="M12 4v10" />
            <path d="M8 7h8" />
          </svg>
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

      <a className="btn btn-primary btn-sm" href="#/app">
        Open the app
      </a>
    </header>
  );
}