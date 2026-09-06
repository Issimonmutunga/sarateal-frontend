import { useEffect, useState } from "react";

import { useLiveDexie } from "../hooks/useDexie";
import { db, getRole, saveRole, type UserRole } from "../lib/db";
import { openAppTab } from "../lib/hash";
import { GLOBAL_CTAS, MOBILE_NAV, NAV } from "../lib/seo";

interface SiteHeaderProps {
  route: "home" | "app" | "developers";
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

type IconName = "search" | "bell" | "user" | "home" | "pin" | "target" | "grid" | "plus";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    search:
      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bell:
      '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    user:
      '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
    home:
      '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/>',
    pin:
      '<path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11Z"/><circle cx="12" cy="10" r="3"/>',
    target:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    grid:
      '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths[name] }}
    />
  );
}

function activeHash(): string {
  return window.location.hash;
}

export function SiteHeader({ route }: SiteHeaderProps) {
  const [hash, setHash] = useState<string>(() => activeHash());
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

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

  const path = window.location.pathname;
  const isAppHash = hash.startsWith("#/app");
  const onHome = (path === "/" || path === "") && !isAppHash;
  const inApp = route === "app" || isAppHash;
  const badge = openMatches ?? 0;

  const switchRole = (next: UserRole) => {
    setRole(next);
    void saveRole(next);
    openAppTab(ROLE_DEFAULT_TAB[next]);
    setProfileOpen(false);
  };

  const navActive = (item: { route?: string; tab?: string }): boolean => {
    if (item.route === "home") {
      return onHome;
    }

    if (item.tab === "overview") {
      return inApp && !isAppHash;
    }

    return hash === `#/app/${item.tab}`;
  };

  const mobileActive = (href: string): boolean =>
    href === "/" ? onHome : href === "#/app/overview" ? inApp && !isAppHash : hash === href;

  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Sarateal home">
        <span className="brand-mark" aria-hidden="true">
          <img src="/favicon.svg" alt="" width="38" height="38" />
        </span>
        <span>Sarateal</span>
      </a>

      <nav className="site-nav" aria-label="Main navigation">
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
          <Icon name="search" />
        </a>
        <a
          className="icon-button"
          href={GLOBAL_CTAS.notifications.href}
          aria-label={`${GLOBAL_CTAS.notifications.label} — ${badge} open`}
        >
          <Icon name="bell" />
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
            <Icon name="user" />
          </button>
          {profileOpen && (
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
              <a className="role-menu-link" href="/developers">
                Developers
              </a>
            </span>
          )}
        </span>
        <a className="btn btn-primary btn-sm add-record" href={GLOBAL_CTAS.addRecord.href}>
          <Icon name="plus" />
          {GLOBAL_CTAS.addRecord.label}
        </a>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {MOBILE_NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={mobileActive(item.href) ? "is-active" : undefined}
          >
            <span className="mobile-nav-icon">
              {item.label === "Home" ? (
                <Icon name="home" />
              ) : item.label === "Markets" ? (
                <Icon name="pin" />
              ) : item.label === "Opportunity" ? (
                <Icon name="target" />
              ) : item.label === "Matches" ? (
                <Icon name="bell" />
              ) : (
                <Icon name="grid" />
              )}
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}