import { useEffect, useState } from "react";

import { useLiveDexie } from "../hooks/useDexie";
import { useReturningUser } from "../hooks/useReturningUser";
import { db, getRole, saveRole, type UserRole } from "../lib/db";
import {
  PRIMARY_SECTIONS,
  openHelp,
  ROLE_COPY,
  ROLE_EVENT,
  ROLE_ORDER,
  sectionById,
  sectionFor,
  sectionHref,
  tabFromHash,
  type Route,
  type SectionId,
} from "../lib/journey";
import { AppIcon } from "./AppIcon";
import { HelpDialog } from "./HelpDialog";
import { SaratealLogo } from "./SaratealLogo";

interface SiteHeaderProps {
  route: Route;
}

export function SiteHeader({ route }: SiteHeaderProps) {
  const [hash, setHash] = useState<string>(() => window.location.hash);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { value: openMatches } = useLiveDexie(
    () => db.matches.filter((match) => match.status === "open" && !match.dismissed).count(),
    [],
  );

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    const onRole = () => void getRole().then(setRole);

    window.addEventListener("hashchange", onHash);
    window.addEventListener(ROLE_EVENT, onRole);
    void getRole().then(setRole);

    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener(ROLE_EVENT, onRole);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen && !profileOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, profileOpen]);

  const inApp = route === "app";
  const returning = useReturningUser();
  const activeTab = inApp ? (tabFromHash(hash) ?? "overview") : null;
  const activeSection: SectionId | null = activeTab ? sectionFor(activeTab).id : null;
  const badge = openMatches ?? 0;
  const badgeText = badge > 9 ? "9+" : String(badge);

  const switchRole = (next: UserRole) => {
    setRole(next);
    void saveRole(next).then(() => window.dispatchEvent(new Event(ROLE_EVENT)));
    setProfileOpen(false);
    setMenuOpen(false);
  };

  const sectionLink = (id: SectionId, className?: string, onClick?: () => void, short = false) => {
    const section = sectionById(id);
    const isActive = activeSection === id;

    return (
      <a
        key={id}
        href={inApp ? sectionHref(id) : `/app${sectionHref(id)}`}
        className={[className, isActive ? "is-active" : ""].filter(Boolean).join(" ") || undefined}
        aria-current={isActive ? "page" : undefined}
        onClick={onClick}
      >
        <span className="nav-icon">
          <AppIcon name={section.icon} />
          {id === "deals" && badge > 0 && (
            <span className="notif-dot" aria-label={`${badge} new`}>
              {badgeText}
            </span>
          )}
        </span>
        <span>{short ? (section.shortLabel ?? section.label) : section.label}</span>
      </a>
    );
  };

  const roleChoices = (
    <div className="role-choices" role="group" aria-label="I am…">
      {ROLE_ORDER.map((candidate) => (
        <button
          key={candidate}
          type="button"
          className={`role-option${role === candidate ? " is-active" : ""}`}
          onClick={() => switchRole(candidate)}
          aria-pressed={role === candidate}
        >
          <AppIcon name={ROLE_COPY[candidate].icon} size={16} />
          {ROLE_COPY[candidate].label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <header className={`site-header${inApp ? " is-app" : ""}`}>
        <div className="header-inner">
          <a className="brand" href="/" aria-label="Sarateal home page" title="Sarateal home page">
            <SaratealLogo size="nav" />
          </a>

          {inApp ? (
            <nav className="app-topnav" aria-label="Main navigation">
              {PRIMARY_SECTIONS.map((id) => sectionLink(id))}
            </nav>
          ) : (
            <nav className="site-nav marketing-nav" aria-label="Main navigation">
              <button type="button" className="nav-text-button" onClick={openHelp}>
                How it works
              </button>
              <a href="/about" className={route === "about" ? "is-active" : undefined}>
                About
              </a>
              <a href="/developers" className={route === "developers" ? "is-active" : undefined}>
                Developers
              </a>
            </nav>
          )}

          <div className="header-actions">
            {inApp ? (
              <>
                <button type="button" className="icon-button" aria-label="Help: how Sarateal works" title="Help" onClick={openHelp}>
                  <AppIcon name="help" />
                </button>
                <span className="role-menu">
                  <button
                    type="button"
                    className="role-chip"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    onClick={() => setProfileOpen((value) => !value)}
                  >
                    <AppIcon name="user" size={16} />
                    <span>{role ? ROLE_COPY[role].short : "Profile"}</span>
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
                        <span className="role-menu-title">I am…</span>
                        {roleChoices}
                        <span className="role-menu-note">
                          No account needed. This only changes what Home suggests.
                        </span>
                        <a className="role-menu-link" href="#/app/settings" onClick={() => setProfileOpen(false)}>
                          Settings
                        </a>
                        <a className="role-menu-link is-plain" href="/">
                          Sarateal home page
                        </a>
                      </span>
                    </>
                  )}
                </span>
                <a className="btn btn-primary btn-sm add-record" href="#/app/enter">
                  <AppIcon name="plus" />
                  Add
                </a>
              </>
            ) : (
              <a className="btn btn-primary btn-sm open-app" href="/app">
                {returning ? "Go to my workspace" : "Open the app"}
              </a>
            )}
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
          <button type="button" className="menu-sheet-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="menu-sheet" role="dialog" aria-label="Menu">
            <div className="menu-sheet-head">
              <SaratealLogo size="nav" />
              <button type="button" className="menu-sheet-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <AppIcon name="x" />
              </button>
            </div>
            <div className="menu-sheet-body">
              {inApp && (
                <div className="menu-section">
                  <span className="menu-section-label">I am…</span>
                  {roleChoices}
                </div>
              )}
              <div className="menu-section">
                <span className="menu-section-label">Go to</span>
                {PRIMARY_SECTIONS.map((id) => (
                  <div className="menu-group" key={id}>
                    {sectionLink(id, "menu-section-link", () => setMenuOpen(false))}
                    {inApp &&
                      sectionById(id).tabs.length > 1 &&
                      sectionById(id).tabs.map((tab) => (
                        <a
                          key={tab.id}
                          className={`menu-sub-link${activeTab === tab.id ? " is-active" : ""}`}
                          href={`#/app/${tab.id}`}
                          onClick={() => setMenuOpen(false)}
                        >
                          {tab.label}
                        </a>
                      ))}
                  </div>
                ))}
              </div>
              <div className="menu-section">
                <span className="menu-section-label">More</span>
                <a className="menu-plain-link" href="/">
                  Sarateal home page
                </a>
                {!inApp && (
                  <a className="menu-plain-link" href="/app">
                    {returning ? "Go to my workspace" : "Open the app"}
                  </a>
                )}
                <button
                  type="button"
                  className="menu-plain-link"
                  onClick={() => {
                    setMenuOpen(false);
                    openHelp();
                  }}
                >
                  How it works
                </button>
                {inApp && (
                  <a className="menu-plain-link" href="#/app/settings" onClick={() => setMenuOpen(false)}>
                    Settings
                  </a>
                )}
                <a className="menu-plain-link" href="/about">
                  About Sarateal
                </a>
                <a className="menu-plain-link" href="/developers">
                  Developers
                </a>
                <a className="menu-plain-link" href="/terms">
                  Terms of use
                </a>
                <a className="menu-plain-link" href="/privacy">
                  Privacy policy
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {inApp && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {sectionLink("home", undefined, undefined, true)}
          {sectionLink("explore", undefined, undefined, true)}
          <a className="mobile-add" href="#/app/enter" aria-label="Add a record">
            <span className="mobile-add-inner" aria-hidden="true">
              <AppIcon name="plus" />
            </span>
            <span>Add</span>
          </a>
          {sectionLink("deals", undefined, undefined, true)}
          {sectionLink("records", undefined, undefined, true)}
        </nav>
      )}

      <HelpDialog />
    </>
  );
}
