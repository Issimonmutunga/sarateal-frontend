import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  API_ENDPOINTS,
  APP_WORKSPACE,
  CTA_BAND,
  DASHBOARD_PREVIEW,
  DEVELOPERS_PAGE,
  ENGINE_FLOW,
  HERO,
  LIVE_SNIPPET,
  METHOD_SECTION,
  METHOD_STEPS,
  ROLE_CTAS,
  ROUTE_META,
  SITE,
  type RoutePath,
} from "../src/lib/seo";

const DIST = join(import.meta.dirname, "..", "dist");

const esc = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ld = (data: unknown): string => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const BRAND_SVG = '<span class="brand-mark" aria-hidden="true"><img src="/favicon.svg" alt="" width="38" height="38" /></span>';

function headerMarkup(): string {
  return [
    '<header class="site-header">',
    `<a class="brand" href="/" aria-label="Sarateal home">${BRAND_SVG}<span>Sarateal</span></a>`,
    '<nav class="site-nav" aria-label="Main navigation">',
    '<a href="/">Overview</a>',
    '<a href="#/app/markets">Markets</a>',
    '<a href="#/app/opportunity">Opportunity</a>',
    '<a href="#/app/matches">Matches</a>',
    '<a href="#/app/signals">Signals</a>',
    "</nav>",
    '<a class="btn btn-primary btn-sm add-record" href="#/app/enter">＋ Add record</a>',
    "</header>",
  ].join("\n      ");
}

function footerMarkup(): string {
  return [
    '<footer class="site-footer">',
    '<div class="footer-inner">',
    `<div class="footer-brand">${BRAND_SVG}<div><strong>Sarateal</strong><p>${esc(SITE.tagline)}</p></div></div>`,
    '<nav class="footer-nav" aria-label="Footer navigation">',
    '<div class="footer-col"><span class="footer-heading">Workspace</span><a href="#/app/overview">Overview</a><a href="#/app/markets">Markets</a><a href="#/app/opportunity">Opportunity</a><a href="#/app/matches">Matches</a></div>',
    '<div class="footer-col"><span class="footer-heading">Data</span><a href="#/app/supply">Supply</a><a href="#/app/demand">Demand</a><a href="#/app/prices">Prices</a><a href="#/app/exports">Exports</a></div>',
    '<div class="footer-col"><span class="footer-heading">Developers</span><a href="/developers">API overview</a></div>',
    "</nav>",
    "</div>",
    `<div class="footer-legal"><span>© ${new Date().getFullYear()} Sarateal</span><span>Real records only — no simulated market data.</span></div>`,
    "</footer>",
  ].join("\n      ");
}

function homeMain(): string {
  const roleCards = ROLE_CTAS.map(
    (cta) =>
      `<button type="button" class="role-card static-card"><h3>${esc(cta.title)}</h3><p>${esc(cta.body)}</p><span class="role-card-action">${esc(cta.action)}</span></button>`,
  ).join("\n            ");

  const methodSteps = METHOD_STEPS.map(
    (step) =>
      `<li class="method-step"><span class="method-number">${esc(step.number)}</span><div><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p></div></li>`,
  ).join("\n            ");

  const flowStages = [
    { label: ENGINE_FLOW.data.label, items: ENGINE_FLOW.data.items },
    { label: ENGINE_FLOW.engine.label, items: ENGINE_FLOW.engine.items },
    { label: ENGINE_FLOW.signals.label, items: ENGINE_FLOW.signals.items },
    { label: ENGINE_FLOW.action.label, items: ENGINE_FLOW.action.items },
  ]
    .map(
      (stage) =>
        `<div class="flow-stage"><span class="flow-stage-label">${esc(stage.label)}</span><ul>${stage.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>`,
    )
    .join('<span class="flow-arrow" aria-hidden="true">→</span>');

  const previewRows = DASHBOARD_PREVIEW.rows
    .map(
      (row) =>
        `<div class="preview-row"><span>${esc(row.label)}</span><strong>${esc(row.value)}</strong></div>`,
    )
    .join("");

  const previewChips = DASHBOARD_PREVIEW.chips
    .map(
      (chip) =>
        `<span class="preview-chip"><span>${esc(chip.label)}</span><strong>${esc(chip.value)}</strong></span>`,
    )
    .join("");

  return [
    '<main class="app-shell">',
    '<section class="hero" id="hero">',
    '<div class="hero-layout">',
    '<div class="hero-copy">',
    `<p class="eyebrow">${esc(HERO.eyebrow)}</p>`,
    `<h1>${esc(HERO.headline)}</h1>`,
    `<p class="hero-text lede">${esc(HERO.text)}</p>`,
    '<div class="hero-actions">',
    `<a class="btn btn-primary" href="${esc(HERO.primaryCta.href)}">${esc(HERO.primaryCta.label)} →</a>`,
    `<a class="btn btn-secondary" href="${esc(HERO.secondaryCta.href)}">${esc(HERO.secondaryCta.label)}</a>`,
    "</div>",
    "</div>",
    '<div class="hero-map">',
    '<div class="hero-map-title">',
    `<p class="eyebrow">${esc(LIVE_SNIPPET.eyebrow)} · <strong>${esc(LIVE_SNIPPET.signal)}</strong></p>`,
    `<p class="hero-map-route">${esc(LIVE_SNIPPET.route)}</p>`,
    "</div>",
    '<div class="hero-map-contour" aria-hidden="true"></div>',
    '<div class="map-legend">',
    ...HERO.map.legend.map((item) => `<span class="signal-chip is-strong-entry">${esc(item)}</span>`),
    "</div>",
    `<p class="hero-map-note">${esc(LIVE_SNIPPET.note)}</p>`,
    "</div>",
    "</div>",
    "</section>",
    '<section class="role-ctas" id="role">',
    '<div class="section-heading">',
    '<p class="eyebrow">How you\'ll use it</p>',
    "<h2>Start with your role</h2>",
    "<p class=\"section-subnote\">Pick what describes you and Sarateal will open the right place to begin.</p>",
    "</div>",
    `<div class="role-grid">${roleCards}</div>`,
    "</section>",
    '<section class="feature-section" id="method">',
    '<div class="section-heading">',
    `<p class="eyebrow">${esc(METHOD_SECTION.eyebrow)}</p>`,
    `<h2>${esc(METHOD_SECTION.heading)}</h2>`,
    `<p class="section-subnote">${esc(METHOD_SECTION.subnote)}</p>`,
    "</div>",
    `<div class="flow-band">${flowStages}</div>`,
    `<ol class="method-list">${methodSteps}</ol>`,
    "</section>",
    '<section class="preview-section" id="preview" data-reveal="true">',
    '<div class="preview-copy">',
    `<p class="eyebrow">${esc(DASHBOARD_PREVIEW.eyebrow)}</p>`,
    `<h2>${esc(DASHBOARD_PREVIEW.heading)}</h2>`,
    `<p class="section-subnote">${esc(DASHBOARD_PREVIEW.note)}</p>`,
    `<a class="text-link" href="${esc(HERO.primaryCta.href)}">${esc(DASHBOARD_PREVIEW.cta)}</a>`,
    "</div>",
    '<div class="preview-dash">',
    `<p class="preview-dash-route">${esc(DASHBOARD_PREVIEW.route)}</p>`,
    `<div class="preview-chips">${previewChips}</div>`,
    `<div class="preview-rows">${previewRows}</div>`,
    "</div>",
    "</section>",
    '<section class="cta-band">',
    `<p class="eyebrow">${esc(CTA_BAND.eyebrow)}</p>`,
    `<h2>${esc(CTA_BAND.heading)}</h2>`,
    `<p class="section-subnote">${esc(CTA_BAND.subnote)}</p>`,
    '<a class="btn btn-primary" href="/app">Open workspace</a>',
    "</section>",
    "</main>",
  ].join("\n      ");
}

function appMain(): string {
  const groups = ["Workspace", "Data", "Analysis", "System"];

  return [
    '<main class="app-shell">',
    '<section class="workspace section-block">',
    '<div class="section-heading">',
    "<h1>Market intelligence workspace</h1>",
    `<p class="section-subnote">${esc(APP_WORKSPACE.intro)}</p>`,
    "</div>",
    '<nav class="workspace-sidebar" aria-label="Workspace navigation">',
    ...groups.map(
      (group) =>
        `<span class="ws-group">${esc(group)}</span>` +
        APP_WORKSPACE.tabs
          .slice(0, 0) // placeholder; nav is rendered client-side
          .map(() => "")
          .join(""),
    ),
    `<span class="ws-group">Sections</span>` +
      APP_WORKSPACE.tabs
        .map((tab) => `<span class="ws-item static-tab">${esc(tab)}</span>`)
        .join(""),
    "</nav>",
    `<p>${esc(APP_WORKSPACE.intro)}</p>`,
    `  <ul>${APP_WORKSPACE.tabs.map((tab) => `<li>${esc(tab)}</li>`).join("")}</ul>`,
    "</section>",
    "</main>",
  ].join("\n      ");
}

function developersMain(): string {
  const endpointItems = API_ENDPOINTS.map(
    (endpoint) =>
      `<li class="endpoint-row"><code>${esc(endpoint.path)}</code><span>${esc(endpoint.description)}</span></li>`,
  ).join("\n        ");

  return [
    '<main class="app-shell">',
    '<div class="developers-page">',
    '<div class="section-heading">',
    `<p class="eyebrow">${esc(DEVELOPERS_PAGE.eyebrow)}</p>`,
    `<h1>${esc(DEVELOPERS_PAGE.heading)}</h1>`,
    `<p class="section-subnote">${esc(DEVELOPERS_PAGE.subnote)}</p>`,
    "</div>",
    '<h2 class="api-heading">Endpoints</h2>',
    `<ul class="endpoint-list">${endpointItems}</ul>`,
    "</div>",
    "</main>",
  ].join("\n      ");
}

function buildPage(opts: {
  path: RoutePath;
  mainMarkup: string;
  jsonLd: string;
}): string {
  const meta = ROUTE_META[opts.path];
  const url = `${SITE.url}${opts.path === "/" ? "/" : opts.path}`;

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    '    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..1000;1,9..40,300..1000&display=swap" rel="stylesheet" />',
    '    <meta name="theme-color" content="#F3EFE4" />',
    `    <meta name="description" content="${esc(meta.description)}" />`,
    `    <title>${esc(meta.title)}</title>`,
    `    <link rel="canonical" href="${url}" />`,
    `    <meta property="og:type" content="website" />`,
    '    <meta property="og:site_name" content="Sarateal" />',
    `    <meta property="og:title" content="${esc(meta.title)}" />`,
    `    <meta property="og:description" content="${esc(meta.description)}" />`,
    `    <meta property="og:url" content="${url}" />`,
    '    <meta name="twitter:card" content="summary" />',
    `    <meta name="twitter:title" content="${esc(meta.title)}" />`,
    `    <meta name="twitter:description" content="${esc(meta.description)}" />`,
    "",
    ...opts.jsonLd.split("\n").map((line) => `    ${line}`),
    "",
    "    " + SCRIPT_TAG,
    "    " + STYLESHEET_TAG,
    "  </head>",
    "  <body>",
    "    <div id=\"root\">",
    `      <div class="site">`,
    `        ${headerMarkup()}`,
    `        ${opts.mainMarkup}`,
    `        ${footerMarkup()}`,
    "      </div>",
    "    </div>",
    "  </body>",
    "</html>",
    "",
  ].join("\n");
}

function homeJsonLd(): string {
  const org = {
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: `${SITE.url}/favicon.svg`,
  };
  const website = {
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    inLanguage: "en",
  };
  return ld([{ "@context": "https://schema.org", "@graph": [org, website] }]);
}

function appJsonLd(): string {
  return ld({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Market intelligence workspace",
    url: `${SITE.url}/app`,
    description: ROUTE_META["/app"].description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: APP_WORKSPACE.tabs,
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
  });
}

function developersJsonLd(): string {
  return ld([
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Sarateal API",
      url: `${SITE.url}/developers`,
      description: ROUTE_META["/developers"].description,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
      about: { "@type": "Organization", name: SITE.name, url: SITE.url },
    },
  ]);
}

function robotsTxt(): string {
  const users = [
    "User-agent: *",
    "Disallow:",
    "",
    "# Major AI crawlers — explicitly allowed.",
    "User-agent: ClaudeBot",
    "Allow: /",
    "",
    "User-agent: GPTBot",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "User-agent: ChatGPT-User",
    "Allow: /",
    "",
    "User-agent: PerplexityBot",
    "Allow: /",
    "",
    "User-agent: Google-Extended",
    "Allow: /",
    "",
    "User-agent: Googlebot",
    "Allow: /",
    "",
    "User-agent: Bingbot",
    "Allow: /",
    "",
    "User-agent: Applebot",
    "Allow: /",
    "",
    `Sitemap: ${SITE.url}/sitemap.xml`,
    "",
  ].join("\n");
  return users;
}

function sitemapXml(): string {
  const lastmod = new Date().toISOString().slice(0, 10);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${SITE.url}/</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>`,
    `  <url><loc>${SITE.url}/app</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    `  <url><loc>${SITE.url}/developers</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    "</urlset>",
    "",
  ].join("\n");
}

function llmsTxt(): string {
  const endpointLines = API_ENDPOINTS.map((endpoint) => `- [\`GET ${endpoint.path}\`](${SITE.url}/developers) — ${endpoint.description}`).join("\n");
  return [
    "# Sarateal",
    "",
    `> ${SITE.tagline}`,
    "",
    `${SITE.description}`,
    "",
    "## Key pages",
    "",
    `- [Home](${SITE.url}/): ${SITE.description}`,
    `- [Market intelligence workspace](${SITE.url}/app): Log real supply, demand and price records in your browser and get an opportunity (O) and confidence (C) score per market-product cell, with tracked matches end to end.`,
    `- [Sarateal API](${SITE.url}/developers): Read-only REST API for market reference data and weather-signal forecasts, no API key required.`,
    "",
    "## The STMOI methodology",
    "",
    "The Spatiotemporal Market Opportunity Index scores every market-product cell from real evidence only. Opportunity (O) and confidence (C) are computed separately and combined only through a 2x2 entry-signal rule (strong entry / promising / avoid / insufficient data). Empty data shows as low confidence, never as a simulated guess.",
    "",
    "## API endpoints",
    "",
    endpointLines,
    "",
  ].join("\n");
}

const built = readFileSync(join(DIST, "index.html"), "utf8");

const scriptMatch = built.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
const styleMatch = built.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);

if (scriptMatch === null || styleMatch === null) {
  throw new Error("Prerender: could not locate built asset tags in dist/index.html.");
}

const SCRIPT_TAG = `<script type="module" crossorigin src="${scriptMatch[1]}"></script>`;
const STYLESHEET_TAG = `<link rel="stylesheet" crossorigin href="${styleMatch[1]}">`;

writeFileSync(join(DIST, "index.html"), buildPage({ path: "/", mainMarkup: homeMain(), jsonLd: homeJsonLd() }), "utf8");
writeFileSync(join(DIST, "app.html"), buildPage({ path: "/app", mainMarkup: appMain(), jsonLd: appJsonLd() }), "utf8");
writeFileSync(join(DIST, "developers.html"), buildPage({ path: "/developers", mainMarkup: developersMain(), jsonLd: developersJsonLd() }), "utf8");

writeFileSync(join(DIST, "robots.txt"), robotsTxt(), "utf8");
writeFileSync(join(DIST, "sitemap.xml"), sitemapXml(), "utf8");
writeFileSync(join(DIST, "llms.txt"), llmsTxt(), "utf8");

for (const file of ["index.html", "app.html", "developers.html"]) {
  const html = readFileSync(join(DIST, file), "utf8");
  if (!html.includes('<div id="root">') || html.includes("<div id=\"root\"></div>")) {
    throw new Error(`Prerender: ${file} root is empty after generation.`);
  }
}

console.log("Prerender complete: index.html, app.html, developers.html, robots.txt, sitemap.xml, llms.txt");
