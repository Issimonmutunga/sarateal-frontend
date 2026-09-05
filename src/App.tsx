import "./App.css";

import { useEffect, useState } from "react";

import { DevelopersPage } from "./components/DevelopersPage";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { STMOIWorkspace } from "./components/stmoi/STMOIWorkspace";
import { ROUTE_META, type RoutePath } from "./lib/seo";

type Route = "home" | "app" | "developers";

const ROUTE_PATHS: Record<Route, RoutePath> = {
  home: "/",
  app: "/app",
  developers: "/developers",
};

function parseRoute(location: { pathname: string; hash: string }): Route {
  if (location.pathname === "/app" || location.hash === "#/app") {
    return "app";
  }

  if (location.pathname === "/developers" || location.hash === "#/developers") {
    return "developers";
  }

  return "home";
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

  return (
    <div className="site">
      <SiteHeader route={route} />

      {route === "home" && (
        <main className="app-shell">
          <HeroSection />

          <FeatureGrid />

          <section className="cta-band">
            <p className="eyebrow">Get started</p>
            <h2>Turn your market records into decisions.</h2>
            <p className="section-subnote">
              The app runs entirely in your browser — log real entries, score the surface, and
              track matches. No sign-up required.
            </p>
            <a className="btn btn-primary" href="/app">
              Open the app
            </a>
          </section>
        </main>
      )}

      {route === "app" && (
        <main className="app-shell">
          <STMOIWorkspace />
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