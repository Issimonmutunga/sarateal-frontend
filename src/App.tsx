import "./App.css";

import { useEffect, useState } from "react";

import { DevelopersPage } from "./components/DevelopersPage";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { STMOIWorkspace } from "./components/stmoi/STMOIWorkspace";

type Route = "home" | "app" | "developers";

function parseRoute(hash: string): Route {
  if (hash === "#/app") {
    return "app";
  }

  if (hash === "#/developers") {
    return "developers";
  }

  return "home";
}

function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));

    window.addEventListener("hashchange", onChange);

    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

function App() {
  const route = useHashRoute();

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
            <a className="btn btn-primary" href="#/app">
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