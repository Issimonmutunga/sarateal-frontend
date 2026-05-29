import "./App.css";

import { ApiPreview } from "./components/ApiPreview";
import { CountyWeatherPreview } from "./components/CountyWeatherPreview";
import { FeatureGrid } from "./components/FeatureGrid";
import { HeroSection } from "./components/HeroSection";
import { PricesPreview } from "./components/PricesPreview";
import { QuickLinks } from "./components/QuickLinks";

function App() {
  return (
    <main className="app-shell">
      {/* Trigger: clear promise + live backend status */}
      <HeroSection />

      {/* Action: show what users can immediately explore */}
      <FeatureGrid />

      {/* Reward: live market intelligence from the API */}
      <ApiPreview />
      <PricesPreview />
      <CountyWeatherPreview />

      {/* Investment: push user deeper into docs/data/API flows */}
      <QuickLinks />
    </main>
  );
}

export default App;