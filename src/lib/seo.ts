export const SITE = {
  name: "Sarateal",
  url: "https://sarateal-frontend.vercel.app",
  tagline: "Food supply intelligence for farmers and buyers.",
  description:
    "Sarateal turns supply, demand, prices and weather signals into a clear picture of every market opportunity.",
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
      "A market-intelligence workspace: log real records and Sarateal scores every cell with opportunity (O) and confidence (C).",
  },
  "/developers": {
    title: "Sarateal API — Developers",
    description:
      "A read-only REST API for market reference data and live weather-signal forecasts. No API key required.",
  },
};

export const HERO = {
  eyebrow: "Market intelligence",
  headline: "Know where food is needed.",
  text: "Real supply, demand and price records — scored into clear market opportunities.",
  primaryCta: { label: "I have produce to sell", href: "#/app/supply" },
  secondaryCta: { label: "I'm looking to buy", href: "#/app/demand" },
  exploreCta: { label: "Explore markets →", href: "#/app/markets" },
  map: {
    label: "Live opportunity surface — Kenya",
    legend: ["High opportunity", "Medium", "Low confidence"],
  },
};

export const NAV: Array<{ label: string; href: string; route?: "home" | "app"; tab?: string }> = [
  { label: "Home", href: "/", route: "home" },
  { label: "Markets", href: "#/app/markets", tab: "markets" },
  { label: "Opportunity", href: "#/app/opportunity", tab: "opportunity" },
  { label: "Matches", href: "#/app/matches", tab: "matches" },
  { label: "Signals", href: "#/app/signals", tab: "signals" },
];

export const MOBILE_NAV: Array<{ id: string; label: string; href: string }> = [
  { id: "home", label: "Home", href: "/" },
  { id: "markets", label: "Markets", href: "#/app/markets" },
  { id: "add", label: "Add", href: "#/app/enter" },
  { id: "matches", label: "Matches", href: "#/app/matches" },
  { id: "more", label: "More", href: "#/app/insights" },
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
  note: "",
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
  subnote: "",
};

export const METHOD_STEPS: Array<{ number: string; title: string; body: string }> = [
  {
    number: "01",
    title: "Log real records",
    body: "Supply, demand and price entries.",
  },
  {
    number: "02",
    title: "Score the surface",
    body: "O and C for every market–product cell.",
  },
  {
    number: "03",
    title: "Act on the signal",
    body: "Strong entries become matches.",
  },
];

export const LIVE_SNIPPET = {
  eyebrow: "Live signal",
  headline: "Today's opportunity",
  route: "Maize · Nakuru → Nairobi",
  signal: "High opportunity",
  signalLevel: "is-strong-entry" as const,
  note: "Unmet demand backed by price and weather evidence",
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
    body: "Sell where demand is ready.",
    action: "Find where to sell",
    tab: "supply",
  },
  {
    id: "buyer",
    title: "I'm sourcing produce",
    body: "Buy where supply is ready.",
    action: "Find what to buy",
    tab: "demand",
  },
  {
    id: "observer",
    title: "I just want to see market data",
    body: "Watch live scores — no records needed.",
    action: "Explore the data",
    tab: "opportunity",
  },
];

export const OVERVIEW_POINTS: Array<{ title: string; body: string }> = [
  {
    title: "Real records, not guesses",
    body: "Every score traces to records you log — never a guess.",
  },
  {
    title: "One score, two numbers",
    body: "O is opportunity. C is confidence. Both must be strong.",
  },
  {
    title: "From surface to deal",
    body: "Strong cells become matches and market-wide insights.",
  },
  {
    title: "Runs in your browser",
    body: "No sign-up, no server. Your records stay private.",
  },
];

export const OVERVIEW_SECTION = {
  eyebrow: "Overview",
  heading: "A lightweight market coordination platform",
  subnote: "Counties, products, markets, prices and weather — one browser-first workflow.",
};

export const APP_WORKSPACE = {
  intro:
    "One workspace — map, records, signals and scores from the same real data.",
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
  workspace: "Find",
  secondary: "More",
  data: "More",
  analysis: "More",
  system: "System",
};

export const WORKSPACE_NAV: Array<{
  id: string;
  label: string;
  group: "workspace" | "data" | "analysis" | "system";
  primary?: boolean;
}> = [
  { id: "overview", label: "Home", group: "workspace", primary: true },
  { id: "markets", label: "Markets", group: "workspace", primary: true },
  { id: "opportunity", label: "Opportunity", group: "workspace", primary: true },
  { id: "matches", label: "Matches", group: "workspace", primary: true },
  { id: "signals", label: "Signals", group: "workspace", primary: true },
  { id: "insights", label: "Insights", group: "workspace" },
  { id: "supply", label: "Supply", group: "data" },
  { id: "demand", label: "Demand", group: "data" },
  { id: "prices", label: "Prices", group: "data" },
  { id: "exports", label: "Export & data", group: "data" },
  { id: "sensitivity", label: "Sensitivity", group: "analysis" },
];

export const SETTINGS_INTRO = "";

export const CTA_BAND = {
  eyebrow: "Get started",
  heading: "Turn your market records into decisions.",
  subnote: "",
};

export const API_ENDPOINTS: Array<{ path: string; description: string }> = [
  { path: "/markets", description: "Markets with coordinates." },
  { path: "/products", description: "Product list." },
  { path: "/counties", description: "County reference data." },
  { path: "/weather/forecast", description: "Weather risk per coordinate." },
  { path: "/county-weather/forecast", description: "Weather risk per county." },
  { path: "/market-weather/forecast", description: "Weather risk per market." },
];

export const DEVELOPERS_PAGE = {
  eyebrow: "For developers",
  heading: "Sarateal API",
  subnote: "A read-only JSON API. No key required.",
};
