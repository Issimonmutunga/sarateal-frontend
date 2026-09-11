import { useEffect, useState } from "react";

import { useLiveDexie } from "../hooks/useDexie";
import { db, getRole, saveRole, type UserRole } from "../lib/db";
import { openAppTab } from "../lib/hash";
import { GLOBAL_CTAS, NAV } from "../lib/seo";
import { AppIcon } from "./AppIcon";
import { SaratealLogo } from "./SaratealLogo";

interface SiteHeaderProps {
  route: "home" | "app" | "developers" | "about";
}

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  observer: "Observer",
};

const ROLE_DEFAULT_TAB: Record<UserRole, string> = {
  farmer: "supply",
  buyer: "demand",
  observer: "opportunity",
};

function activeHash(): string {
  return window.location.hash;
}

export function SiteHeader({ route }: SiteHeaderProps) {
  const [hash, setHash] = useState<string>(() => activeHash());
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { value: openMatches } = useLiveDexie(
    () => db.matches.filter((match) => match.status === "open" && !match.dismissed).count(),
    [],
  );

  useEffect(() => {
    const onHash = () => setHash(activeHash());

    window.addEventListener("hashchange", onHash);

    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    void getRole().then(setRole);
  }, []);

  useEffect(() => {
    if (!menuOpen && !moreOpen && !profileOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMoreOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, moreOpen, profileOpen]);

  const path = window.location.pathname;
  const isAppHash = hash.startsWith("#/app");
  const onHome = (path === "/" || path === "") && !isAppHash;
  const inApp = route === "app" || isAppHash;
  const badge = openMatches ?? 0;
  const activeTab = inApp ? (hash.match(/^#\/app\/([a-z]+)/)?.[1] ?? null) : null;
  const appOverview = inApp && activeTab === null;

  const MORE_TABS = new Set([
    "opportunity",
    "signals",
    "supply",
    "demand",
    "prices",
    "insights",
    "exports",
    "sensitivity",
    "settings",
  ]);
  const moreActive = inApp && activeTab !== null && MORE_TABS.has(activeTab);

  const MORE_GROUPS: Array<{
    label: string;
    items: Array<{ label: string; href: string }>;
  }> = [
    {
      label: "Find",
      items: [
        { label: "Opportunity", href: "#/app/opportunity" },
        { label: "Signals", href: "#/app/signals" },
        { label: "Supply", href: "#/app/supply" },
        { label: "Demand", href: "#/app/demand" },
        { label: "Prices", href: "#/app/prices" },
        { label: "Insights", href: "#/app/insights" },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Export & data", href: "#/app/exports" },
        { label: "Sensitivity", href: "#/app/sensitivity" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", href: "#/app/settings" },
        { label: "About Sarateal", href: "/about" },
        { label: "Developers", href: "/developers" },
      ],
    },
  ];

  const switchRole = (next: UserRole) => {
    setRole(next);
    void saveRole(next);
    openAppTab(ROLE_DEFAULT_TAB[next]);
    setProfileOpen(false);
    setMenuOpen(false);
  };

  // One authoritative active item per breakpoint: the current route wins,
  // so `/about#/app/matches` can never light up two nav entries at once.
  const navActive = (item: { route?: string; tab?: string }): boolean => {
    if (item.route === "home") {
      return onHome;
    }

    if (item.route === "about") {
      return window.location.pathname === "/about";
    }

    if (item.route === "developers") {
      return window.location.pathname === "/developers";
    }

    if (item.tab === "overview") {
      return appOverview;
    }

    return route === "app" && item.tab !== undefined && item.tab === activeTab;
  };

  const mobileHomeActive = onHome || appOverview || activeTab === "overview";

  const mobileActive = (href: string): boolean =>
    href === "/" ? mobileHomeActive : href === "#/app/overview" ? appOverview : hash === href;

  return (
    <>
    <header className="site-header">
      <div className="header-inner">
      <a className="brand" href="/" aria-label="Sarateal home">
        <SaratealLogo size="nav" />
      </a>

      <nav className={`site-nav${inApp ? " is-app" : ""}`} aria-label="Main navigation">
        {NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={navActive(item) ? "is-active" : undefined}
            aria-current={navActive(item) ? "page" : undefined}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="header-actions">
        <a className="icon-button" href={GLOBAL_CTAS.search.href} aria-label={GLOBAL_CTAS.search.label}>
          <AppIcon name="search" />
        </a>
        <a
          className="icon-button"
          href={GLOBAL_CTAS.notifications.href}
          aria-label={`${GLOBAL_CTAS.notifications.label} — ${badge} open`}
        >
          <AppIcon name="bell" />
          {badge > 0 && (
            <span className="notif-dot" aria-hidden="true">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </a>
        <span className="role-menu">
          <button
            type="button"
            className="icon-button"
            aria-label="Profile and role"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((value) => !value)}
          >
            <AppIcon name="user" />
          </button>
          {profileOpen && (
            <>
              <button
                type="button"
                className="menu-sheet-backdrop role-menu-backdrop"
                aria-label="Close profile"
                onClick={() => setProfileOpen(false)}
              />
              <span className="role-menu-pop">
                <span className="role-menu-title">Profile</span>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    className={`role-option${role === candidate ? " is-active" : ""}`}
                    onClick={() => switchRole(candidate)}
                  >
                    {ROLE_LABELS[candidate]}
                  </button>
                ))}
                <a className="role-menu-link" href="/about">
                  About Sarateal
                </a>
                <a className="role-menu-link" href="/developers">
                  Developers
                </a>
              </span>
            </>
          )}
        </span>
        <a className="btn btn-primary btn-sm add-record" href={GLOBAL_CTAS.addRecord.href}>
          <AppIcon name="plus" />
          {GLOBAL_CTAS.addRecord.label}
        </a>
        <button
          type="button"
          className="icon-button menu-toggle"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <AppIcon name="menu" />
        </button>
      </div>
      </div>
      </header>

      {menuOpen && (
        <div className="menu-sheet-layer" role="presentation">
          <button
            type="button"
            className="menu-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="menu-sheet" role="dialog" aria-label="Menu">
            <div className="menu-sheet-head">
              <SaratealLogo size="nav" />
              <button
                type="button"
                className="menu-sheet-close"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <AppIcon name="x" />
              </button>
            </div>
            <div className="menu-sheet-body">
              <div className="menu-section">
                <span className="menu-section-label">Profile</span>
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    className={`role-option${role === candidate ? " is-active" : ""}`}
                    onClick={() => switchRole(candidate)}
                  >
                    {ROLE_LABELS[candidate]}
                  </button>
                ))}
              </div>
              <div className="menu-section">
                <span className="menu-section-label">Navigate</span>
                {NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={navActive(item) ? "is-active" : undefined}
                    aria-current={navActive(item) ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="menu-section">
                <span className="menu-section-label">Sections</span>
                {MORE_GROUPS.map((group) => (
                  <div className="menu-group" key={group.label}>
                    <span className="menu-group-label">{group.label}</span>
                    {group.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {route === "app" && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
        <a
          className={mobileActive("/") ? "is-active" : undefined}
          href="/"
          aria-current={mobileActive("/") ? "page" : undefined}
        >
          <span className="mobile-nav-icon">
            <AppIcon name="home" />
          </span>
          <span>Home</span>
        </a>

        <a
          className={mobileActive("#/app/markets") ? "is-active" : undefined}
          href="#/app/markets"
          aria-current={mobileActive("#/app/markets") ? "page" : undefined}
        >
          <span className="mobile-nav-icon">
            <AppIcon name="pin" />
          </span>
          <span>Markets</span>
        </a>

        <a className="mobile-add" href="#/app/enter" aria-label="Add a record">
          <span className="mobile-add-inner" aria-hidden="true">
            <AppIcon name="plus" />
          </span>
          <span>Add</span>
        </a>

        <a
          className={mobileActive("#/app/matches") ? "is-active" : undefined}
          href="#/app/matches"
          aria-current={mobileActive("#/app/matches") ? "page" : undefined}
        >
          <span className="mobile-nav-icon">
            <AppIcon name="bell" />
            {badge > 0 && (
              <span className="notif-dot mobile-badge" aria-hidden="true">
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          <span>Matches</span>
        </a>

        <button
          type="button"
          className={`more-button${moreActive || moreOpen ? " is-active" : ""}`}
          aria-label="More"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((value) => !value)}
        >
          <span className="mobile-nav-icon">
            <AppIcon name="grid" />
          </span>
          <span>More</span>
        </button>
      </nav>
      )}

      {route === "app" && moreOpen && (
        <div className="more-sheet-layer" role="presentation">
          <button
            type="button"
            className="more-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="more-sheet" role="dialog" aria-label="More">
            <div className="more-sheet-head">
              <p className="more-sheet-title">Explore</p>
              <button
                type="button"
                className="more-sheet-close"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
              >
                <AppIcon name="plus" />
              </button>
            </div>
            <div className="more-sheet-groups">
              {MORE_GROUPS.map((group) => (
                <section className="more-group" key={group.label}>
                  <span className="more-group-label">{group.label}</span>
                  <div className="more-group-grid">
                    {group.items.map((item) => (
                      <a
                        key={item.label}
                        className="more-sheet-item"
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}