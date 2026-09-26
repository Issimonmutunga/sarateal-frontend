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

const GROUP_LABELS: Record<string, string | undefined> = {
  workspace: undefined,
  scores: APP_SECTIONS.scores,
  matches: APP_SECTIONS.matches,
  log: APP_SECTIONS.log,
};

const GROUP_ORDER = ["workspace", "scores", "matches", "log"];

export function AppNav({ activeTab, onSelect }: AppNavProps) {
  return (
    <nav className="app-nav" aria-label="Workspace navigation">
      {GROUP_ORDER.map((group) => {
        const items = WORKSPACE_NAV.filter((item) => item.group === group);
        const label = GROUP_LABELS[group];

        return (
          <div className="app-nav-group" key={group}>
            {label !== undefined && <span className="app-nav-group-label">{label}</span>}
            {items.map((item) => (
              <NavButton
                key={item.id}
                id={item.id as Tab}
                label={item.label}
                isActive={activeTab === item.id}
                onSelect={onSelect}
                quiet={!item.primary}
              />
            ))}
          </div>
        );
      })}

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