import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import katex from "katex";

import {
  ABOUT,
  API_ENDPOINTS,
  APP_WORKSPACE,
  DEVELOPERS_PAGE,
  FOOTER_LINKS,
  HERO,
  ROUTE_META,
  SITE,
  type RoutePath,
} from "../src/lib/seo";
import { LEGAL_CONTACT, PRIVACY, TERMS, type LegalDoc } from "../src/lib/legal";

const DIST = join(import.meta.dirname, "..", "dist");

const esc = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ld = (data: unknown): string => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

const BRAND_MARKUP = (sizeClass: "is-nav" | "is-footer" | "is-hero") =>
  `<span class="sarateal-logo ${sizeClass}">Sarateal</span>`;

function headerMarkup(): string {
  return [
    '<header class="site-header">',
    '<div class="header-inner">',
    `<a class="brand" href="/" aria-label="Sarateal home page">${BRAND_MARKUP("is-nav")}</a>`,
    '<nav class="site-nav marketing-nav" aria-label="Main navigation">',
    '<a href="/about">About</a>',
    '<a href="/developers">Developers</a>',
    "</nav>",
    '<div class="header-actions"><a class="btn btn-primary btn-sm open-app" href="/app">Open the app</a></div>',
    "</div>",
    "</header>",
  ].join("\n      ");
}

function footerMarkup(): string {
  const cols = FOOTER_LINKS.map(
    (group) =>
      `<div class="journey-footer-col"><span class="journey-footer-heading">${esc(group.heading)}</span>${group.links
        .map((link) => `<a href="${esc(link.href)}">${esc(link.label)}</a>`)
        .join("")}</div>`,
  ).join("");

  return [
    '<footer class="site-footer journey-footer">',
    '<div class="journey-footer-inner">',
    `<div class="journey-footer-brand"><a href="/" aria-label="Sarateal home page">${BRAND_MARKUP("is-footer")}</a><p>Know where to sell. Know where to buy.</p></div>`,
    `<nav class="journey-footer-nav" aria-label="Footer navigation">${cols}</nav>`,
    "</div>",
    `<div class="journey-footer-legal"><span>© ${new Date().getFullYear()} Sarateal</span><span>Your records stay on your device.</span></div>`,
    "</footer>",
  ].join("\n      ");
}

function legalMain(doc: LegalDoc): string {
  const summary = doc.summary.map((line) => `<li>${esc(line)}</li>`).join("");
  const sections = doc.sections
    .map(
      (section) =>
        `<section class="legal-section"><h2>${esc(section.heading)}</h2>${section.body
          .map((paragraph) => `<p>${esc(paragraph)}</p>`)
          .join("")}${section.list ? `<ul>${section.list.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}</section>`,
    )
    .join("");

  return [
    '<main class="app-shell">',
    '<article class="legal-page">',
    '<a class="legal-back" href="/">← Sarateal home page</a>',
    `<header class="legal-head"><h1>${esc(doc.title)}</h1><p class="legal-updated">Last updated ${esc(doc.updated)}</p></header>`,
    `<section class="legal-summary"><h2>In short</h2><ul>${summary}</ul></section>`,
    sections,
    `<section class="legal-section"><h2>Questions</h2><p>If something here is unclear, please <a href="${esc(LEGAL_CONTACT.url)}">${esc(LEGAL_CONTACT.label)}</a>.</p></section>`,
    "</article>",
    "</main>",
  ].join("\n      ");
}

function legalJsonLd(doc: LegalDoc): string {
  return ld([
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: doc.title,
      url: `${SITE.url}${doc.path}`,
      description: ROUTE_META[doc.path].description,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
    },
  ]);
}

function homeMain(): string {
  return [
    '<main class="app-shell home-shell">',
    '<div class="home-hero-map" aria-hidden="false">',
    '<div class="home-backdrop is-single">',
    '<img class="home-backdrop-slide is-front" src="/home/slide-1.avif" alt="" loading="eager" fetchpriority="high" draggable="false" />',
    "</div>",
    "</div>",
    '<section class="home-hero" id="hero">',
    '<div class="home-hero-copy">',
    `<h1>${esc(HERO.headline).replace(/\n/g, "<br />")}</h1>`,
    `<p class="home-hero-text">${esc(HERO.text)}</p>`,
    '<div class="about-ctas hero-paths">',
    `<a class="btn btn-primary" href="${esc(HERO.primaryCta.href)}">${esc(HERO.primaryCta.label)}</a>`,
    `<a class="btn btn-secondary" href="${esc(HERO.secondaryCta.href)}">${esc(HERO.secondaryCta.label)}</a>`,
    "</div>",
    "</div>",
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

function aboutMain(): string {
  const GRID_SVG =
    '<span class="about-symbol"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.5"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5"/></svg></span>';

  const PRINCIPLE_ICONS: Record<string, string> = {
    records:
      '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    sources:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15.4 15.4 0 0 1 0 18 15.4 15.4 0 0 1 0-18z"/>',
    open: '<circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="1.2"/>',
  };

  const outputs = ABOUT.outputs
    .map(
      (output) =>
        `<div class="about-output">${output.symbol === "grid" ? GRID_SVG : `<span class="about-symbol">${esc(output.symbol)}</span>`}<h3>${esc(output.label)}</h3><p>${esc(output.body)}</p></div>`,
    )
    .join("\n            ");

  const signals = ABOUT.signals
    .map(
      (signal) =>
        `<li class="about-signal"><span class="about-signal-number">${esc(signal.number)}</span><span class="about-signal-body"><strong>${esc(signal.title)}</strong><span>${esc(signal.body)}</span></span></li>`,
    )
    .join("\n            ");

  const entryCells = ABOUT.entry.grid
    .map(
      (cell) =>
        `<div class="about-entry-cell is-${esc(cell.tone)}"><strong>${esc(cell.label)}</strong><span class="about-entry-action">${esc(cell.action)}</span></div>`,
    )
    .join("\n            ");

  const distinctive = ABOUT.distinctive.items.map((item) => `<li>${esc(item)}</li>`).join("\n          ");

  const factors = ABOUT.confidence.factors
    .map(
      (factor) =>
        `<span class="about-factor" title="${esc(factor.hint)}">${esc(factor.name)}</span>`,
    )
    .join("");

  const principleParts = ABOUT.dataPrinciple.parts
    .map(
      (part) =>
        `<div class="about-principle-part"><span class="about-principle-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PRINCIPLE_ICONS[part.icon]}</svg></span><span class="about-principle-part-copy"><strong>${esc(part.label)}</strong><span>${esc(part.body)}</span></span></div>`,
    )
    .join("\n          ");

  const formula = (tex: string) =>
    `<span class="about-formula">${katex.renderToString(tex, { throwOnError: false })}</span>`;

  return [
    '<main class="app-shell">',
    '<div class="about-page">',
    '<section class="about-hero">',
    '<span class="eyebrow">About Sarateal</span>',
    `<h1>${esc(ABOUT.title)}</h1>`,
    `<p class="about-subheading">${esc(ABOUT.subheading)}</p>`,
    `<blockquote class="about-question">“${esc(ABOUT.question)}”</blockquote>`,
    `<div class="about-intro">${ABOUT.intro.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`,
    '<div class="about-ctas"><a class="btn btn-primary" href="/app">Open the workspace</a><a class="btn btn-secondary" href="/developers">For developers</a></div>',
    "</section>",
    '<section class="about-block">',
    "<h2>What Sarateal produces</h2>",
    '<p class="section-subnote">For every market, product, and time period, three related outputs.</p>',
    `<div class="about-outputs">${outputs}</div>`,
    "</section>",
    '<section class="about-block">',
    "<h2>The five signals behind opportunity</h2>",
    `<p class="section-subnote">${esc(ABOUT.signalIntro)}</p>`,
    `<ol class="about-signals">${signals}</ol>`,
    "</section>",
    '<section class="about-block about-merge">',
    '<div class="about-column">',
    `<h2>${esc(ABOUT.combine.heading)}</h2>`,
    formula(ABOUT.combine.formula),
    `<p class="about-formula-legend">${esc(ABOUT.combine.legend)}</p>`,
    `<p>${esc(ABOUT.combine.extra)}</p>`,
    "</div>",
    '<div class="about-column">',
    `<h2>${esc(ABOUT.confidence.heading)}</h2>`,
    formula(ABOUT.confidence.formula),
    `<p class="about-formula-legend">${esc(ABOUT.confidence.legend)}</p>`,
    `<div class="about-tags">${factors}</div>`,
    `<p>${esc(ABOUT.confidence.extra)}</p>`,
    "</div>",
    "</section>",
    '<section class="about-block">',
    `<h2>${esc(ABOUT.entry.heading)}</h2>`,
    `<p class="section-subnote">${esc(ABOUT.entry.body)}</p>`,
    '<div class="about-quadrant">',
    `<p class="quadrant-x-caption">${esc(ABOUT.entry.axes.confidence)} — High on the left, Low on the right</p>`,
    '<div class="quadrant-row">',
    `<div class="quadrant-y-caption" aria-hidden="true"><span class="q-y-hint">High</span><span class="q-y-label">${esc(ABOUT.entry.axes.opportunity)}</span><span class="q-y-hint">Low</span></div>`,
    `<div class="about-entry-grid">${entryCells}</div>`,
    "</div>",
    "</div>",
    "</section>",
    '<section class="about-block about-principle">',
    '<div class="about-principle-copy">',
    `<h2>${esc(ABOUT.dataPrinciple.heading)}</h2>`,
    `<p>${esc(ABOUT.dataPrinciple.body)}</p>`,
    "</div>",
    `<div class="about-principle-parts">${principleParts}</div>`,
    "</section>",
    '<section class="about-block">',
    `<h2>${esc(ABOUT.distinctive.heading)}</h2>`,
    `<ul class="about-distinctive">${distinctive}</ul>`,
    "</section>",
    '<section class="cta-band about-cta">',
    `<h2>${esc(ABOUT.cta.heading)}</h2>`,
    `<p class="section-subnote">${esc(ABOUT.cta.subnote)}</p>`,
    '<div class="about-cta-actions"><a class="btn btn-primary" href="/app">Open the workspace</a><a class="about-cta-secondary" href="#/app/enter">or add your first record</a></div>',
    "</section>",
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

function aboutJsonLd(): string {
  return ld([
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: ABOUT.heading,
      url: `${SITE.url}/about`,
      description: ROUTE_META["/about"].description,
      inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
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
    `  <url><loc>${SITE.url}/about</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
    `  <url><loc>${SITE.url}/developers</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    `  <url><loc>${SITE.url}/terms</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
    `  <url><loc>${SITE.url}/privacy</loc><lastmod>${lastmod}</lastmod><changefreq>yearly</changefreq><priority>0.3</priority></url>`,
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
writeFileSync(join(DIST, "about.html"), buildPage({ path: "/about", mainMarkup: aboutMain(), jsonLd: aboutJsonLd() }), "utf8");
writeFileSync(join(DIST, "terms.html"), buildPage({ path: "/terms", mainMarkup: legalMain(TERMS), jsonLd: legalJsonLd(TERMS) }), "utf8");
writeFileSync(join(DIST, "privacy.html"), buildPage({ path: "/privacy", mainMarkup: legalMain(PRIVACY), jsonLd: legalJsonLd(PRIVACY) }), "utf8");

writeFileSync(join(DIST, "robots.txt"), robotsTxt(), "utf8");
writeFileSync(join(DIST, "sitemap.xml"), sitemapXml(), "utf8");
writeFileSync(join(DIST, "llms.txt"), llmsTxt(), "utf8");

for (const file of ["index.html", "app.html", "developers.html", "about.html", "terms.html", "privacy.html"]) {
  const html = readFileSync(join(DIST, file), "utf8");
  if (!html.includes('<div id="root">') || html.includes("<div id=\"root\"></div>")) {
    throw new Error(`Prerender: ${file} root is empty after generation.`);
  }
}

console.log("Prerender complete: index.html, app.html, developers.html, about.html, terms.html, privacy.html, robots.txt, sitemap.xml, llms.txt");
