import type { Section, Tab } from "../../lib/journey";

interface SectionTabsProps {
  section: Section;
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}

export function SectionTabs({ section, activeTab, onSelect }: SectionTabsProps) {
  return (
    <div className="section-tabs" role="tablist" aria-label={`${section.label} views`}>
      {section.tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`section-tab${activeTab === tab.id ? " is-active" : ""}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
