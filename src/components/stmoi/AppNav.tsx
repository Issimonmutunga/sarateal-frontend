import { APP_SECTIONS, WORKSPACE_NAV } from "../../lib/seo";
import type { Tab } from "./STMOIWorkspace";

interface AppNavProps {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

const GROUP_ORDER = ["workspace", "data", "analysis", "system"] as const;

function NavButton({
  id,
  label,
  isActive,
  onSelect,
}: {
  id: Tab;
  label: string;
  isActive: boolean;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      className={`tab-button${isActive ? " is-active" : ""}`}
      onClick={() => onSelect(id)}
    >
      {label}
    </button>
  );
}

export function AppNav({ activeTab, onSelect }: AppNavProps) {
  const byGroup = (group: (typeof GROUP_ORDER)[number]) =>
    WORKSPACE_NAV.filter((item) => item.group === group);

  return (
    <nav className="app-nav" aria-label="Workspace navigation">
      {GROUP_ORDER.map((group) => {
        const items = byGroup(group);

        if (items.length === 0) {
          return null;
        }

        return (
          <div className="app-nav-group" key={group}>
            <span className="app-nav-group-label">{APP_SECTIONS[group]}</span>
            {items.map((item) => (
              <NavButton
                key={item.id}
                id={item.id as Tab}
                label={item.label}
                isActive={activeTab === item.id}
                onSelect={onSelect}
              />
            ))}
          </div>
        );
      })}
      <div className="app-nav-group">
        <span className="app-nav-group-label">{APP_SECTIONS.system}</span>
        <NavButton
          id="settings"
          label="Settings"
          isActive={activeTab === "settings"}
          onSelect={onSelect}
        />
        <a className="tab-button tab-link" href="/developers">
          Developers
        </a>
      </div>
    </nav>
  );
}