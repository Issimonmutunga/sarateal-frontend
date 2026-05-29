import "./App.css";

import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { QuickLinks } from "./components/QuickLinks";

function App() {
  return (
    <main className="app-shell">
      <HeroSection />
      <FeatureGrid />
      <QuickLinks />
    </main>
  );
}

export default App;