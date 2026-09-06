export const SITE = {
  name: "Sarateal",
  url: "https://sarateal-frontend.vercel.app",
  tagline: "Food supply intelligence for farmers and buyers.",
  description:
    "Sarateal turns supplier supply, buyer demand, prices and weather signals into a clear, actionable picture of every market opportunity.",
};

export type RoutePath = "/" | "/app" | "/developers";

export const ROUTE_META: Record<RoutePath, { title: string; description: string }> = {
  "/": {
    title: "Sarateal — Food supply intelligence",
    description: SITE.description,
  },
  "/app": {
    title: "Workspace — Sarateal",
    description:
      "A market-intelligence workspace: log real supply, demand and price records, and Sarateal scores every market-product cell with an opportunity (O) and confidence (C) score, then turns strong entries into actionable matches.",
  },
  "/developers": {
    title: "Sarateal API — Developers",
    description:
      "A read-only REST API for market reference data and live weather-signal forecasts. No API key required.",
  },
};

export const HERO = {
  eyebrow: "Market access · fair prices · smarter decisions",
  headline: "Know where the market is moving.",
  text: "Sarateal connects supply, demand, prices and weather signals to reveal where agricultural opportunities are emerging.",
  primaryCta: { label: "Explore markets", href: "#/app/markets" },
  secondaryCta: { label: "See how it works", href: "#method" },
  map: {
    label: "Live opportunity surface — Kenya",
    legend: ["High opportunity", "Medium", "Low confidence"],
  },
};

export const NAV: Array<{ label: string; href: string; route?: "home" | "app"; tab?: string }> = [
  { label: "Overview", href: "/", route: "home" },
  { label: "Markets", href: "#/app/markets", tab: "markets" },
  { label: "Opportunity", href: "#/app/opportunity", tab: "opportunity" },
  { label: "Matches", href: "#/app/matches", tab: "matches" },
  { label: "Signals", href: "#/app/signals", tab: "signals" },
];

export const MOBILE_NAV: Array<{ label: string; href: string }> = [
  { label: "Home", href: "/" },
  { label: "Markets", href: "#/app/markets" },
  { label: "Opportunity", href: "#/app/opportunity" },
  { label: "Matches", href: "#/app/matches" },
  { label: "More", href: "#/app/insights" },
];

export const ENGINE_FLOW = {
  data: { label: "Data", items: ["Supply", "Demand", "Prices", "Weather"] },
  engine: { label: "Sarateal engine", items: ["Real records", "O & C scoring", "Entry-signal rule"] },
  signals: { label: "Signals", items: ["Opportunity", "Confidence", "Market imbalance"] },
  action: { label: "Action", items: ["Match", "Contact", "Move product"] },
};

export const DASHBOARD_PREVIEW = {
  eyebrow: "Product preview",
  heading: "Market opportunity",
  route: "Maize · Nairobi",
  chips: [
    { label: "Opportunity", value: "87" },
    { label: "Confidence", value: "92" },
  ],
  rows: [
    { label: "Supply", value: "1,240 bags" },
    { label: "Demand", value: "1,890 bags" },
    { label: "Price", value: "KSh 4,850" },
    { label: "Weather risk", value: "Low" },
  ],
  cta: "View opportunity →",
  note: "Illustrative cell. Log real records and the score is computed from them.",
};

export const STATS_LABELS: Array<{ id: "markets" | "products" | "supply" | "demand" | "price" | "weather"; label: string; suffix?: string }> = [
  { id: "markets", label: "Markets" },
  { id: "products", label: "Products" },
  { id: "supply", label: "Supply records" },
  { id: "demand", label: "Demand records" },
  { id: "price", label: "Price records" },
  { id: "weather", label: "Weather signals" },
];

export const GLOBAL_CTAS = {
  addRecord: { label: "Add record", href: "#/app/enter" },
  search: { label: "Search markets", href: "#/app/opportunity" },
  notifications: { label: "Matches", href: "#/app/matches" },
};

export const METHOD_SECTION = {
  eyebrow: "Methodology",
  heading: "How the app works",
  subnote:
    "Sarateal only scores real records. It turns local supply, demand and price signals into an opportunity surface, then keeps the matching and reporting local to your browser.",
};

export const METHOD_STEPS: Array<{ number: string; title: string; body: string }> = [
  {
    number: "01",
    title: "Log real records",
    body: "Add supply, demand and price entries from counties and markets you know.",
  },
  {
    number: "02",
    title: "Score the surface",
    body: "Opportunity and confidence are computed separately for every market-product cell.",
  },
  {
    number: "03",
    title: "Act on the signal",
    body: "Strong entries become matches, insights and follow-up actions.",
  },
];

export const LIVE_SNIPPET = {
  eyebrow: "Live signal",
  headline: "Today's opportunity",
  route: "Maize · Nakuru → Nairobi",
  signal: "High opportunity",
  signalLevel: "is-strong-entry" as const,
  note: "Cross-market supply meeting 3.2× unmet demand, backed by price and weather evidence.",
  updated: "Updated moments ago from real records",
};

export const ROLE_CTAS: Array<{
  id: "farmer" | "buyer" | "observer";
  title: string;
  body: string;
  action: string;
  tab: "supply" | "demand" | "opportunity" | "enter";
}> = [
  {
    id: "farmer",
    title: "I have produce to sell",
    body: "Log your supply and see where demand is unmet, so you sell where buyers are ready.",
    action: "Find where to sell",
    tab: "supply",
  },
  {
    id: "buyer",
    title: "I'm sourcing produce",
    body: "Log what you need and see which counties can reliably supply it, before you commit.",
    action: "Find what to buy",
    tab: "demand",
  },
  {
    id: "observer",
    title: "I just want to see market data",
    body: "Browse live opportunity, confidence and market signals without logging anything.",
    action: "Explore the data",
    tab: "opportunity",
  },
];

export const OVERVIEW_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Real records, not guesses",
    body: "Every score traces back to records you log or live forecasts. Empty data shows as low confidence — never as a confident guess.",
  },
  {
    title: "One score, two numbers",
    body: "Opportunity (O) says how much is on the table. Confidence (C) says how much evidence backs it. The entry-signal rule combines them only when both are strong.",
  },
  {
    title: "From surface to doorstep deal",
    body: "Strong cells become matches you can contact, agree and close — with the same records driving market-wide insights.",
  },
  {
    title: "Runs in your browser",
    body: "No sign-up, no server. Your records stay local and your decisions are private.",
  },
];

export const OVERVIEW_SECTION = {
  eyebrow: "Overview",
  heading: "A lightweight market coordination platform",
  subnote:
    "Counties, products, markets, prices and weather signals stay in one browser-first workflow.",
};

export const APP_WORKSPACE = {
  intro:
    "One continuous market-intelligence workspace: the map, records, signals, opportunity score and matches are different views of the same data. Scores come from real records you log, or live forecast data — empty data shows as low confidence, never as a guess.",
  tabs: [
    "Overview",
    "Markets",
    "Opportunity",
    "Matches",
    "Signals",
    "Insights",
    "Supply",
    "Demand",
    "Prices",
    "Exports",
    "Sensitivity",
  ],
};

export const APP_SECTIONS = {
  workspace: "Workspace",
  data: "Data",
  analysis: "Analysis",
  system: "System",
};

export const WORKSPACE_NAV: Array<{
  id: string;
  label: string;
  group: "workspace" | "data" | "analysis" | "system";
}> = [
  { id: "overview", label: "Overview", group: "workspace" },
  { id: "markets", label: "Markets", group: "workspace" },
  { id: "opportunity", label: "Opportunity", group: "workspace" },
  { id: "matches", label: "Matches", group: "workspace" },
  { id: "signals", label: "Signals", group: "workspace" },
  { id: "insights", label: "Insights", group: "workspace" },
  { id: "supply", label: "Supply", group: "data" },
  { id: "demand", label: "Demand", group: "data" },
  { id: "prices", label: "Prices", group: "data" },
  { id: "exports", label: "Exports", group: "data" },
  { id: "sensitivity", label: "Sensitivity", group: "analysis" },
];

export const SETTINGS_INTRO =
  "Profile, role and workspace-level preferences for this browser. Settings are stored locally in IndexedDB and never leave your device.";

export const CTA_BAND = {
  eyebrow: "Get started",
  heading: "Turn your market records into decisions.",
  subnote:
    "The workspace runs entirely in your browser — log real entries, score the surface, and track matches. No sign-up required.",
};

export const API_ENDPOINTS: Array<{ path: string; description: string }> = [
  { path: "/markets", description: "Reference markets with county coordinates." },
  { path: "/products", description: "Product list with default units." },
  { path: "/counties", description: "County reference data with coordinates." },
  { path: "/weather/forecast", description: "Per-coordinate weather risk signals." },
  { path: "/county-weather/forecast", description: "Weather risk for a county." },
  { path: "/market-weather/forecast", description: "Weather risk for a market." },
];

export const DEVELOPERS_PAGE = {
  eyebrow: "For developers",
  heading: "Sarateal API",
  subnote:
    "A read-only REST API for market reference data and real weather-signal forecasts. All responses are plain JSON. No API key is required today.",
};
