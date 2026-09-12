import "./App.css";

import { useEffect, useState } from "react";

import { AboutPage } from "./components/AboutPage";
import { DevelopersPage } from "./components/DevelopersPage";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { STMOIWorkspace, type Tab } from "./components/stmoi/STMOIWorkspace";
import { ROUTE_META, CTA_BAND, type RoutePath } from "./lib/seo";

type Route = "home" | "app" | "developers" | "about";

const ROUTE_PATHS: Record<Route, RoutePath> = {
  home: "/",
  app: "/app",
  developers: "/developers",
  about: "/about",
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
  // Real pages win over a stale hash: `/about#/app/matches` is the About
  // page, never the workspace — one active nav entry at a time.
  if (location.pathname === "/about" || location.hash === "#/about") {
    return "about";
  }

  if (location.pathname === "/developers" || location.hash === "#/developers") {
    return "developers";
  }

  if (location.pathname === "/app" || location.hash.startsWith("#/app")) {
    return "app";
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
    <div className={route === "app" ? "site is-app" : "site"}>
      <SiteHeader route={route} />

      {route === "home" && (
        <main className="app-shell home-shell">
          <HeroSection />

          <div className="about-page">
            <FeatureGrid />

            <section className="cta-band about-cta" data-reveal>
              <h2>{CTA_BAND.heading}</h2>
              {CTA_BAND.subnote && <p className="section-subnote">{CTA_BAND.subnote}</p>}
              <a className="btn btn-primary" href="/app">
                Open workspace
              </a>
            </section>
          </div>
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

      {route === "about" && (
        <main className="app-shell">
          <AboutPage />
        </main>
      )}

      <SiteFooter />
    </div>
  );
}

export default App;
