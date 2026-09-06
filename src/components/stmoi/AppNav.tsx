import { useState } from "react";

import { APP_SECTIONS, WORKSPACE_NAV } from "../../lib/seo";
import type { Tab } from "./STMOIWorkspace";

interface AppNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

function NavButton({
  id,
  label,
  isActive,
  onSelect,
  quiet,
}: {
  id: Tab;
  label: string;
  isActive: boolean;
  onSelect: (tab: Tab) => void;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      className={`tab-button${isActive ? " is-active" : ""}${quiet ? " is-quiet" : ""}`}
      onClick={() => onSelect(id)}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </button>
  );
}

export function AppNav({ activeTab, onSelect }: AppNavProps) {
  const [moreOpen, setMoreOpen] = useState(
    ["insights", "supply", "demand", "prices", "exports", "sensitivity"].includes(activeTab),
  );

  const primary = WORKSPACE_NAV.filter((item) => item.primary);
  const secondary = WORKSPACE_NAV.filter((item) => !item.primary);

  const toggleMore = () => {
    const opening = !moreOpen;

    setMoreOpen(opening);

    if (opening && ["insights", "supply", "demand", "prices", "exports", "sensitivity"].includes(activeTab)) {
      onSelect(activeTab);
      return;
    }

    if (opening) {
      onSelect("insights");
    }
  };

  return (
    <nav className="app-nav" aria-label="Workspace navigation">
      <span className="app-nav-group-label app-nav-section-label">{APP_SECTIONS.workspace}</span>
      {primary.map((item) => (
        <NavButton
          key={item.id}
          id={item.id as Tab}
          label={item.label}
          isActive={activeTab === item.id}
          onSelect={onSelect}
        />
      ))}

      <button
        type="button"
        className={`tab-button is-more${moreOpen ? " is-active" : ""}`}
        onClick={toggleMore}
        aria-expanded={moreOpen}
      >
        {APP_SECTIONS.secondary}
        <span className="more-caret" aria-hidden="true">
          {moreOpen ? "−" : "+"}
        </span>
      </button>

      {moreOpen && (
        <div className="app-nav-sub">
          {secondary.map((item) => (
            <NavButton
              key={item.id}
              id={item.id as Tab}
              label={item.label}
              isActive={activeTab === item.id}
              onSelect={onSelect}
              quiet
            />
          ))}
        </div>
      )}

      <div className="app-nav-system">
        <NavButton
          id="settings"
          label="Settings"
          isActive={activeTab === "settings"}
          onSelect={onSelect}
          quiet
        />
        <a className="tab-button tab-link is-quiet" href="/developers">
          Developers
        </a>
      </div>
    </nav>
  );
}