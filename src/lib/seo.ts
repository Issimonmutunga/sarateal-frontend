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
    title: "The opportunity engine — Sarateal",
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
  headline: "Food supply intelligence for farmers and buyers.",
  text: SITE.description,
};

export const WORKFLOW_STEPS: Array<{ number: string; title: string; description: string }> = [
  {
    number: "01",
    title: "Log real records",
    description: "Supply, demand and price entries from your market.",
  },
  {
    number: "02",
    title: "The surface scores",
    description: "Every market–product cell gets an opportunity and a confidence score.",
  },
  {
    number: "03",
    title: "Act on matches",
    description: "Strong entries become matches you can pursue end to end.",
  },
];

export const WORKFLOW_NOTE =
  "Every score comes from real data you log or live forecasts — empty data shows as low confidence, never as a guess.";

export const FEATURES: Array<{ title: string; description: string }> = [
  {
    title: "Market prices",
    description: "Track produce prices and compare movement across markets.",
  },
  {
    title: "Supply & demand",
    description: "Connect available farmer supply directly to buyer demand.",
  },
  {
    title: "Weather risk",
    description: "County and market weather signals inform seasonal decisions.",
  },
  {
    title: "Verified locations",
    description: "County and market coordinates resolved from trusted registries.",
  },
];

export const FEATURE_SECTION = {
  eyebrow: "What it does",
  heading: "One backend for market coordination",
  subnote:
    "Counties, products, markets, prices and weather signals unified in one lightweight agricultural market platform.",
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

export const CTA_BAND = {
  eyebrow: "Get started",
  heading: "Turn your market records into decisions.",
  subnote:
    "The app runs entirely in your browser — log real entries, score the surface, and track matches. No sign-up required.",
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