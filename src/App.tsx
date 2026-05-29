import "./App.css";

import { ApiPreview } from "./components/ApiPreview";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { QuickLinks } from "./components/QuickLinks";

function App() {
  return (
    <main className="app-shell">
      <HeroSection />
      <FeatureGrid />
      <ApiPreview />
      <QuickLinks />
    </main>
  );
}

export default App;