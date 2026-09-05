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
      "Log real supply, demand and price records, and Sarateal scores every market-product cell with an opportunity (O) and confidence (C) score, then turns strong entries into actionable matches.",
  },
  "/developers": {
    title: "Sarateal API — Developers",
    description:
      "A read-only REST API for market reference data and live weather-signal forecasts. No API key required.",
  },
};

export const HERO = {
  eyebrow: "Market access · fair prices · smarter decisions",
  headline: "Know where food is. Know where it's needed.",
  text: SITE.description,
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
  tab: "enter" | "surface" | "insights";
}> = [
  {
    id: "farmer",
    title: "I have produce to sell",
    body: "Log your supply and see where demand is unmet, so you sell where buyers are ready.",
    action: "Find where to sell",
    tab: "enter",
  },
  {
    id: "buyer",
    title: "I'm sourcing produce",
    body: "Log what you need and see which counties can reliably supply it, before you commit.",
    action: "Find what to buy",
    tab: "enter",
  },
  {
    id: "observer",
    title: "I just want to see market data",
    body: "Browse live opportunity, confidence and market signals without logging anything.",
    action: "Explore the data",
    tab: "insights",
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
    "Two separate scores per market–product cell — opportunity (O) and confidence (C) — combined only through the entry-signal rule. Every score comes from real records you log, or live forecast data. Empty data shows as low confidence, never as a guess.",
  tabs: [
    "Entry forms",
    "Opportunity surface",
    "Matches",
    "Data & export",
    "Live signals",
    "Insights",
    "Sensitivity",
  ],
};

export const APP_SECTIONS = {
  primary: "Workspace",
  advanced: "Advanced",
};

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
