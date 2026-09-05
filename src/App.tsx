import "./App.css";

import { BackendStatusCard } from "./components/BackendStatusCard";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { QuickLinks } from "./components/QuickLinks";
import { STMOIWorkspace } from "./components/stmoi/STMOIWorkspace";

function App() {
  return (
    <main className="app-shell">
      <HeroSection />

      <STMOIWorkspace />

      <FeatureGrid />

      <QuickLinks />

      <BackendStatusCard />
    </main>
  );
}

export default App;