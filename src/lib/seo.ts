export const SITE = {
  name: "Sarateal",
  url: "https://sarateal-frontend.vercel.app",
  tagline: "Food supply intelligence for farmers and buyers.",
  description:
    "Sarateal turns supply, demand, prices and weather signals into a clear picture of every market opportunity.",
};

export type RoutePath = "/" | "/app" | "/developers" | "/about";

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
  "/about": {
    title: "About Sarateal — STMOI",
    description:
      "How Sarateal scores every market-product-time cell with an opportunity score and a separate confidence score, and the five market signals behind the Spatiotemporal Market Opportunity Index.",
  },
};

export const HERO = {
  eyebrow: "Market intelligence",
  headline: "Got / Looking for supplies?",
  text: "Real market data.\nClear opportunities.",
  primaryCta: { label: "I have produce to sell", href: "#/app/enter?kind=supply" },
  secondaryCta: { label: "I'm looking to buy", href: "#/app/enter?kind=demand" },
};

export const NAV: Array<{ label: string; href: string; route?: "home" | "app" | "about"; tab?: string }> = [
  { label: "Home", href: "/", route: "home" },
  { label: "Markets", href: "#/app/markets", tab: "markets" },
  { label: "Opportunity", href: "#/app/opportunity", tab: "opportunity" },
  { label: "Matches", href: "#/app/matches", tab: "matches" },
  { label: "Signals", href: "#/app/signals", tab: "signals" },
  { label: "About", href: "/about", route: "about" },
];

export const GLOBAL_CTAS = {
  addRecord: { label: "Add record", href: "#/app/enter" },
  search: { label: "Search markets", href: "#/app/opportunity" },
  notifications: { label: "Matches", href: "#/app/matches" },
};

export const METHOD_SECTION = {
  eyebrow: "Methodology",
  heading: "How it works",
  subnote: "Real records only — scored into opportunity and confidence.",
};

export const METHOD_STEPS: Array<{ number: string; title: string; body: string }> = [
  {
    number: "01",
    title: "Data",
    body: "You log supply, demand and prices.",
  },
  {
    number: "02",
    title: "Sarateal",
    body: "The engine scores opportunity and confidence.",
  },
  {
    number: "03",
    title: "Signals",
    body: "Strong cells surface as matches.",
  },
];

export const ABOUT = {
  eyebrow: "About Sarateal",
  heading: "Sarateal",
  subheading: "Spatiotemporal Market Opportunity Index (STMOI)",
  question:
    "Where, for which product, and at what time is there a real opportunity to enter an agricultural market?",
  intro: [
    "Supply, demand, prices, weather, location, and competition usually live as separate pieces of information. Looked at in isolation, none of them tells a farmer, trader, buyer, or business whether entering a particular market is attractive.",
    "Sarateal brings those signals together into a single market-opportunity assessment that changes with place and time. Its output is deliberately not one number: it separates how attractive a market appears from how much evidence supports that assessment.",
  ],
  outputs: [
    {
      label: "Opportunity score",
      symbol: "O",
      body: "How attractive does the available evidence suggest the market is?",
    },
    {
      label: "Confidence score",
      symbol: "C",
      body: "How strong and reliable is the evidence behind that assessment?",
    },
    {
      label: "Entry signal",
      symbol: "grid",
      body: "A plain interpretation of O and C that separates a well-supported opportunity from an interesting but poorly observed one.",
    },
  ],
  signalIntro:
    "Sarateal combines five dimensions. Each captures a different reason why a market may or may not be attractive.",
  signals: [
    {
      number: "01",
      title: "Supply–demand imbalance",
      body: "Does observed demand exceed observed supply? A market with unmet demand can be an opportunity for a new supplier or entrant.",
    },
    {
      number: "02",
      title: "Price opportunity",
      body: "Is the price environment attractive? Price is read in relation to its trend, to economically connected markets, and to volatility.",
    },
    {
      number: "03",
      title: "Spatial accessibility",
      body: "How reachable is the market? A gravity-style model weighs market attractiveness against travel time, so strong demand behind an expensive journey scores differently.",
    },
    {
      number: "04",
      title: "Seasonal timing",
      body: "The same market can be attractive in one month and not the next. Supply, demand, price, and weather seasonality are combined over place, product, and time.",
    },
    {
      number: "05",
      title: "Competition",
      body: "A busy market may already be well served. Nearby competitors count far more than distant ones, weighted by accessibility rather than merely counted.",
    },
  ],
  combine: {
    heading: "Combining the signals",
    extra: "Only signals with real evidence participate. Weights are renormalized over what is actually available.",
    formula: "O = \\frac{\\sum_k w_k S_k}{\\sum_k w_k}",
    legend: "Sk is the score for each signal, and wk is its weight. Only signals with real data are included.",
  },
  confidence: {
    heading: "Confidence is a separate calculation",
    extra:
      "The question isn't only “how attractive is the market?” but “how much evidence supports that conclusion?” Each component carries its own evidence score from the number of observations, their recency, data quality, spatial coverage, and diversity of contributors.",
    formula: "C = \\frac{\\sum_k w_k C_k}{\\sum_k w_k}",
    legend: "Ck is the score for each confidence component.",
    factors: [
      { name: "Observations", hint: "The number of records behind the score." },
      { name: "Recency", hint: "How fresh the records are." },
      { name: "Quality", hint: "How reliable the data is." },
      { name: "Spatial coverage", hint: "How much of the market–product area the data covers." },
      { name: "Diversity", hint: "How many different contributors the data comes from." },
    ],
  },
  entry: {
    heading: "The entry signal",
    body: "O and C are deliberately kept apart, then read together.",
    axes: { opportunity: "Opportunity", confidence: "Confidence" },
    grid: [
      {
        label: "Strong entry signal",
        tone: "strong",
        action: "Strong entry signal: worth acting on.",
      },
      {
        label: "Promising but unverified",
        tone: "promising",
        action: "Promising but unverified: collect more records before committing.",
      },
      {
        label: "Confirmed weak market",
        tone: "weak",
        action: "Confirmed weak market: look elsewhere.",
      },
      {
        label: "Insufficient basis",
        tone: "thin",
        action: "Insufficient basis: gather evidence first.",
      },
    ],
  },
  dataPrinciple: {
    heading: "The data principle",
    body: "Sarateal is built on real observations rather than fabricated completeness. Supply, demand, prices, and market outcomes come from real records; location and weather may come from live public sources. Missing information is left missing — it is never replaced with invented values, and sparse data simply flows into the confidence assessment.",
    parts: [
      {
        label: "Real records",
        body: "Supply, demand, prices, outcomes.",
        icon: "records",
      },
      {
        label: "Live public sources",
        body: "Location, weather.",
        icon: "sources",
      },
      {
        label: "Never invented",
        body: "Gaps lower confidence.",
        icon: "open",
      },
    ],
  },
  distinctive: {
    heading: "What is distinctive",
    items: [
      "Opportunity and confidence stay separate instead of being multiplied into one score.",
      "Missing observations reduce confidence rather than automatically reducing opportunity.",
      "The index is explicitly spatiotemporal: market × product × time.",
      "The system gets more empirically informed as genuine market outcomes accumulate — it never fabricates data to compensate for gaps.",
    ],
  },
  cta: {
    heading: "See the index in action",
    subnote: "Open the workspace and score a market-product cell from real records.",
  },
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
  workspace: "Home",
  secondary: "More",
  data: "Log",
  analysis: "Scores",
  system: "Tools",
  scores: "Scores",
  matches: "Matches",
  log: "Log",
  tools: "Tools",
};

export const WORKSPACE_NAV: Array<{
  id: string;
  label: string;
  group: "workspace" | "scores" | "matches" | "log" | "analysis" | "system";
  primary?: boolean;
}> = [
  { id: "overview", label: "Home", group: "workspace", primary: true },
  { id: "opportunity", label: "Opportunity", group: "scores", primary: true },
  { id: "markets", label: "Markets", group: "scores" },
  { id: "insights", label: "Insights", group: "scores" },
  { id: "signals", label: "Signals", group: "scores" },
  { id: "sensitivity", label: "Scoring rules", group: "scores" },
  { id: "matches", label: "Matches", group: "matches", primary: true },
  { id: "enter", label: "Add a record", group: "log", primary: true },
  { id: "supply", label: "Supply", group: "log" },
  { id: "demand", label: "Demand", group: "log" },
  { id: "prices", label: "Prices", group: "log" },
  { id: "exports", label: "Your data", group: "log" },
];

export const CTA_BAND = {
  eyebrow: "",
  heading: "Turn records into decisions.",
  subnote: "Your records stay in this browser. No sign-up, no server.",
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
