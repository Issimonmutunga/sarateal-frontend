// One source of truth for how a person moves through the workspace.
// Twelve tools collapse into four plain-language sections; anything that
// used to be its own sidebar entry now lives as a tab inside a section.

import type { IconName } from "../components/AppIcon";
import type { UserRole } from "./db";

export type Tab =
  | "overview"
  | "markets"
  | "opportunity"
  | "matches"
  | "signals"
  | "insights"
  | "supply"
  | "demand"
  | "prices"
  | "exports"
  | "sensitivity"
  | "enter"
  | "settings";

export type SectionId = "home" | "explore" | "deals" | "records" | "settings" | "add";

export interface SectionTab {
  id: Tab;
  label: string;
}

export interface Section {
  id: SectionId;
  label: string;
  shortLabel?: string;
  icon: IconName;
  title: string;
  sub: string;
  tabs: SectionTab[];
}

export const SECTIONS: Section[] = [
  {
    id: "home",
    label: "Home",
    icon: "home",
    title: "Home",
    sub: "Your next steps and best opportunities.",
    tabs: [{ id: "overview", label: "Home" }],
  },
  {
    id: "explore",
    label: "Opportunities",
    shortLabel: "Explore",
    icon: "target",
    title: "Opportunities",
    sub: "Where to sell or buy — based on real records.",
    tabs: [
      { id: "opportunity", label: "Map" },
      { id: "insights", label: "Top picks" },
      { id: "markets", label: "All markets" },
      { id: "signals", label: "Weather & changes" },
    ],
  },
  {
    id: "deals",
    label: "My deals",
    shortLabel: "Deals",
    icon: "bell",
    title: "My deals",
    sub: "Good opportunities land here. Track each one from first contact to a closed deal.",
    tabs: [{ id: "matches", label: "Deals" }],
  },
  {
    id: "records",
    label: "Records",
    icon: "book",
    title: "Records",
    sub: "Everything logged in this browser.",
    tabs: [
      { id: "supply", label: "For sale" },
      { id: "demand", label: "Wanted" },
      { id: "prices", label: "Prices" },
      { id: "exports", label: "Backup & restore" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: "user",
    title: "Settings",
    sub: "Your profile and preferences.",
    tabs: [
      { id: "settings", label: "Profile" },
      { id: "sensitivity", label: "Scoring rules (advanced)" },
    ],
  },
  {
    id: "add",
    label: "Add",
    icon: "plus",
    title: "Add a record",
    sub: "",
    tabs: [{ id: "enter", label: "Add" }],
  },
];

export const PRIMARY_SECTIONS: SectionId[] = ["home", "explore", "deals", "records"];

export const ALL_TABS: Tab[] = SECTIONS.flatMap((section) => section.tabs.map((tab) => tab.id));

export function sectionFor(tab: Tab): Section {
  return SECTIONS.find((section) => section.tabs.some((entry) => entry.id === tab)) ?? SECTIONS[0];
}

export function sectionById(id: SectionId): Section {
  return SECTIONS.find((section) => section.id === id) ?? SECTIONS[0];
}

export function sectionHref(id: SectionId): string {
  return `#/app/${sectionById(id).tabs[0].id}`;
}

export function tabFromHash(hash: string): Tab | null {
  const match = /^#\/app\/([a-z]+)/.exec(hash);

  if (!match) {
    return null;
  }

  return ALL_TABS.find((tab) => tab === match[1]) ?? null;
}

export function roleFromHash(hash: string): UserRole | null {
  const match = /[?&]role=(farmer|buyer|observer)/.exec(hash);

  return match ? (match[1] as UserRole) : null;
}

export const ROLE_COPY: Record<UserRole, { label: string; short: string; body: string; icon: IconName }> = {
  farmer: {
    label: "I sell produce",
    short: "Seller",
    body: "Farmer, trader or co-op. Find where buyers need what you grow.",
    icon: "box",
  },
  buyer: {
    label: "I buy produce",
    short: "Buyer",
    body: "Shop, school, processor or trader. Find where to source supply.",
    icon: "cart",
  },
  observer: {
    label: "I'm just looking",
    short: "Explorer",
    body: "Browse markets, prices and opportunities. No records needed.",
    icon: "search",
  },
};

export const ROLE_ORDER: UserRole[] = ["farmer", "buyer", "observer"];

export const ROLE_EVENT = "sarateal:role";
export const HELP_EVENT = "sarateal:help";

export function openHelp(): void {
  window.dispatchEvent(new Event(HELP_EVENT));
}
