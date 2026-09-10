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
  headline: "Know where\nfood is needed.",
  text: "Real market data.\nClear opportunities.",
  primaryCta: { label: "I have produce to sell", href: "#/app/supply" },
  secondaryCta: { label: "I'm looking to buy", href: "#/app/demand" },
  exploreCta: { label: "Explore markets →", href: "#/app/markets" },
  map: {
    label: "Live opportunity surface — Kenya",
    legend: ["High opportunity", "Medium", "Low confidence"],
  },
};

export const NAV: Array<{ label: string; href: string; route?: "home" | "app" | "about"; tab?: string }> = [
  { label: "Home", href: "/", route: "home" },
  { label: "Markets", href: "#/app/markets", tab: "markets" },
  { label: "Opportunity", href: "#/app/opportunity", tab: "opportunity" },
  { label: "Matches", href: "#/app/matches", tab: "matches" },
  { label: "Signals", href: "#/app/signals", tab: "signals" },
  { label: "About", href: "/about", route: "about" },
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
  ],
  cta: "View opportunity →",
  note: "",
};

export const GLOBAL_CTAS = {
  addRecord: { label: "Add record", href: "#/app/enter" },
  search: { label: "Search markets", href: "#/app/opportunity" },
  notifications: { label: "Matches", href: "#/app/matches" },
};

export const METHOD_SECTION = {
  eyebrow: "Methodology",
  heading: "How it works",
  subnote: "",
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

export const LIVE_SNIPPET = {
  eyebrow: "Live signal",
  headline: "Today's opportunity",
  route: "Maize · Nakuru → Nairobi",
  signal: "High opportunity",
  signalLevel: "is-strong-entry" as const,
  note: "Unmet demand backed by price and weather evidence",
  updated: "Updated moments ago from real records",
};

export const ROLE_SECTION = {
  heading: "What are you looking for?",
  subnote: "Start with what you need.",
};

export const ROLE_CTAS: Array<{
  id: "farmer" | "buyer" | "observer";
  icon: "exchange" | "sack" | "explore";
  title: string;
  body: string;
  action: string;
  tab: "supply" | "demand" | "opportunity" | "enter";
}> = [
  {
    id: "farmer",
    icon: "exchange",
    title: "Sell produce",
    body: "Find markets where demand is ready.",
    action: "Find where to sell →",
    tab: "supply",
  },
  {
    id: "buyer",
    icon: "sack",
    title: "Source produce",
    body: "Find suppliers where supply is ready.",
    action: "Find what to buy →",
    tab: "demand",
  },
  {
    id: "observer",
    icon: "explore",
    title: "Explore markets",
    body: "Browse live market signals.",
    action: "View markets →",
    tab: "opportunity",
  },
];

export const ABOUT = {
  eyebrow: "About Sarateal",
  heading: "Sarateal",
  subheading: "Spatiotemporal Market Opportunity Index",
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
      symbol: "→",
      body: "A plain interpretation of O and C that separates a well-supported opportunity from an interesting but poorly observed one.",
    },
  ],
  signalIntro:
    "Sarateal combines five dimensions. Each captures a different reason why a market may or may not be attractive.",
  signals: [
    {
      number: "01",
      title: "Supply–demand imbalance",
      body: "Does observed demand exceed observed supply? A market with unmet demand can be an opportunity for a new supplier or entrant. Missing records are never read as zero — they lower confidence instead.",
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
    extra: "Only components with real evidence participate. Their weights are renormalized over what is actually available, so missing data is never silently converted into a zero score.",
    formula: "O = Σ wₖSₖ ÷ Σ wₖ",
  },
  confidence: {
    heading: "Confidence is a separate calculation",
    extra:
      "The question isn't only “how attractive is the market?” but “how much evidence supports that conclusion?” Each component carries its own evidence score from the number of observations, their recency, data quality, spatial coverage, and diversity of contributors.",
    formula: "C = Σ wₖCₖ ÷ Σ wₖ",
    factors: ["Observations", "Recency", "Quality", "Spatial coverage", "Diversity"],
  },
  entry: {
    heading: "The entry signal",
    body: "O and C are deliberately kept apart, then read together.",
    grid: [
      { o: "High opportunity", c: "High confidence", label: "Strong entry signal", tone: "strong" },
      { o: "High opportunity", c: "Low confidence", label: "Promising but unverified", tone: "promising" },
      { o: "Low opportunity", c: "High confidence", label: "Confirmed weak market", tone: "weak" },
      { o: "Low opportunity", c: "Low confidence", label: "Insufficient basis", tone: "thin" },
    ],
  },
  dataPrinciple: {
    heading: "The data principle",
    body: "Sarateal is built on real observations rather than fabricated completeness. Supply, demand, prices, and market outcomes come from real records; location and weather may come from live public sources. Missing information is left missing — it is never replaced with invented values, and sparse data simply flows into the confidence assessment.",
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
