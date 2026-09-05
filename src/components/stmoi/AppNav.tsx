import type { UserRole } from "../../lib/db";
import type { Tab } from "./STMOIWorkspace";

interface AppNavProps {
  role: UserRole | null;
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

const ALL_TABS: Array<{ id: Tab; label: string }> = [
  { id: "enter", label: "Entry forms" },
  { id: "surface", label: "Opportunity surface" },
  { id: "matches", label: "Matches" },
  { id: "signals", label: "Live signals" },
  { id: "insights", label: "Insights" },
  { id: "data", label: "Data & export" },
  { id: "sensitivity", label: "Sensitivity" },
];

const PRIMARY_BY_ROLE: Record<Exclude<UserRole, null>, Tab[]> = {
  farmer: ["enter", "surface", "matches"],
  buyer: ["enter", "surface", "matches"],
  observer: ["surface", "matches", "insights"],
};

const ADVANCED = ["signals", "insights", "data", "sensitivity"] as Tab[];

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

export function AppNav({ role, activeTab, onSelect }: AppNavProps) {
  const label = (tab: Tab) => ALL_TABS.find((entry) => entry.id === tab)?.label ?? tab;

  if (role === null) {
    return (
      <nav className="app-nav" aria-label="Workspace navigation">
        <span className="app-nav-group">Workspace</span>
        {ALL_TABS.map((tab) => (
          <NavButton
            key={tab.id}
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onSelect={onSelect}
          />
        ))}
      </nav>
    );
  }

  const primary = PRIMARY_BY_ROLE[role];
  const advanced = ADVANCED.filter((tab) => !primary.includes(tab));

  return (
    <nav className="app-nav" aria-label="Workspace navigation">
      <span className="app-nav-group">Primary</span>
      {primary.map((id) => (
        <NavButton
          key={id}
          id={id}
          label={label(id)}
          isActive={activeTab === id}
          onSelect={onSelect}
        />
      ))}
      <span className="app-nav-group">Advanced</span>
      {advanced.map((id) => (
        <NavButton
          key={id}
          id={id}
          label={label(id)}
          isActive={activeTab === id}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}