import "./App.css";

import { useEffect, useState } from "react";

import { DevelopersPage } from "./components/DevelopersPage";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { DashboardPreview } from "./components/HomePreview";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { STMOIWorkspace, type Tab } from "./components/stmoi/STMOIWorkspace";
import { DASHBOARD_PREVIEW, ROUTE_META, CTA_BAND, type RoutePath } from "./lib/seo";

type Route = "home" | "app" | "developers";

const ROUTE_PATHS: Record<Route, RoutePath> = {
  home: "/",
  app: "/app",
  developers: "/developers",
};

const TABS: Tab[] = [
  "overview",
  "markets",
  "opportunity",
  "matches",
  "signals",
  "insights",
  "supply",
  "demand",
  "prices",
  "exports",
  "sensitivity",
  "enter",
  "settings",
];

function parseRoute(location: { pathname: string; hash: string }): Route {
  if (location.pathname === "/app" || location.hash.startsWith("#/app")) {
    return "app";
  }

  if (location.pathname === "/developers" || location.hash === "#/developers") {
    return "developers";
  }

  return "home";
}

function parseAppTab(location: { hash: string }): Tab | undefined {
  const match = /^#\/app\/([a-z]+)/.exec(location.hash);

  if (!match) {
    return undefined;
  }

  const tab = TABS.find((candidate) => candidate === match[1]);

  return tab;
}

function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location));

    window.addEventListener("popstate", onChange);
    window.addEventListener("hashchange", onChange);

    return () => {
      window.removeEventListener("popstate", onChange);
      window.removeEventListener("hashchange", onChange);
    };
  }, []);

  return route;
}

function App() {
  const route = useRoute();
  const routeMeta = ROUTE_META[ROUTE_PATHS[route]];

  useEffect(() => {
    document.title = routeMeta.title;
  }, [routeMeta.title]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll("[data-reveal]").forEach((node) => node.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );

    const targets = document.querySelectorAll("[data-reveal]");

    targets.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, [route]);

  return (
    <div className="site">
      <SiteHeader route={route} />

      {route === "home" && (
        <main className="app-shell">
          <HeroSection />

          <section className="preview-section" id="opportunity" data-reveal>
            <div className="preview-copy">
              <h2>{DASHBOARD_PREVIEW.heading}</h2>
              <p className="section-subnote">
                Real records only — scored into opportunity and confidence.
              </p>
              <a className="text-link" href="#/app/opportunity">
                {DASHBOARD_PREVIEW.cta}
              </a>
            </div>
            <DashboardPreview />
          </section>

          <FeatureGrid />

          <section className="cta-band" data-reveal>
            <h2>{CTA_BAND.heading}</h2>
            {CTA_BAND.subnote && <p className="section-subnote">{CTA_BAND.subnote}</p>}
            <a className="btn btn-primary" href="/app">
              Open workspace
            </a>
          </section>
        </main>
      )}

      {route === "app" && (
        <main className="app-shell">
          <STMOIWorkspace initialTab={parseAppTab(window.location) ?? "overview"} />
        </main>
      )}

      {route === "developers" && (
        <main className="app-shell">
          <DevelopersPage />
        </main>
      )}

      <SiteFooter />
    </div>
  );
}

export default App;
