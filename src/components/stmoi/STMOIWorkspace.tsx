import { useCallback, useEffect, useMemo, useState } from "react";

import { computeOpportunitySurface, suitabilityFromWeatherSignals } from "../../engine";
import { DEFAULT_SCORING_CONFIG, sanitizeConfig, type ScoringConfig } from "../../engine/config";
import { persistTopMatches } from "../../engine/matches";
import type { OpportunityCell } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { ensureReferenceData, getCachedCounties, getCachedMarkets, getCachedProducts } from "../../lib/cache";
import { clearScoringConfig, db, getOnboardingDone, getRole, getScoringConfig, saveRole, saveScoringConfig, type UserRole } from "../../lib/db";
import { getWeatherSignals, resolveLocation } from "../../lib/live";
import type { County, Market, Product } from "../../types/api";
import { openAppTab } from "../../lib/hash";
import { WORKSPACE_NAV } from "../../lib/seo";
import { AddEntryFlow } from "./AddEntryFlow";
import { AppNav } from "./AppNav";
import { DatasetPanel } from "./DatasetPanel";
import { InsightsPanel } from "./InsightsPanel";
import { LiveSignals } from "./LiveSignals";
import { MarketsPanel } from "./MarketsPanel";
import { MatchesPanel } from "./MatchesPanel";
import { OnboardingPanel } from "./OnboardingPanel";
import { OpportunityScreen } from "./OpportunityScreen";
import { PricesPanel } from "./PricesPanel";
import { RecordLedger } from "./RecordLedger";
import { SensitivityPanel } from "./SensitivityPanel";
import { SettingsPanel } from "./SettingsPanel";
import { WorkspaceOverview } from "./WorkspaceOverview";

export type Tab =
  | "overview"
  | "markets"
  | "opportunity"
  | "matches"
  | "signals"
  | "insights"
  | "supply"
  | "demand"
  | "prices"
  | "exports"
  | "sensitivity"
  | "enter"
  | "settings";

const TABS: Array<{ id: Tab; label: string }> = [
  ...WORKSPACE_NAV.map((item) => ({ id: item.id as Tab, label: item.label })),
  { id: "enter", label: "Add a record" },
  { id: "settings", label: "Settings" },
];

const PAGE_META: Record<Tab, { title: string; sub: string }> = {
  overview: { title: "Home", sub: "Your market picture at a glance." },
  markets: { title: "Markets", sub: "Where food moves — search, inspect, act." },
  opportunity: { title: "Opportunity", sub: "Find where demand is strongest." },
  matches: { title: "Matches", sub: "Your pipeline from signal to deal." },
  signals: { title: "Signals", sub: "What changed, and why it matters." },
  insights: { title: "Insights", sub: "Today's market picture." },
  supply: { title: "Supply", sub: "What's available, where." },
  demand: { title: "Demand", sub: "What buyers need, where." },
  prices: { title: "Prices", sub: "Latest price per market–product." },
  exports: { title: "Export & data", sub: "Backup, restore and manage your dataset." },
  sensitivity: { title: "Sensitivity", sub: "What-if view of the scoring rules." },
  enter: { title: "Add a record", sub: "One record at a time." },
  settings: { title: "Settings", sub: "Profile, role and workspace preferences." },
};

interface STMOIWorkspaceProps {
  initialTab: Tab;
}

export function STMOIWorkspace({ initialTab }: STMOIWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<UserRole | null>(null);
  const [onboardingDone, setOnboardingDoneState] = useState(false);

  useEffect(() => {
    void getRole().then((stored) => {
      if (stored === null) {
        setRole("observer");
        void saveRole("observer");
        return;
      }

      setRole(stored);
    });
  }, []);

  useEffect(() => {
    void getOnboardingDone().then(setOnboardingDoneState);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const match = /^#\/app\/([a-z]+)/.exec(window.location.hash);

      if (match) {
        const tab = TABS.find((candidate) => candidate.id === match[1]);

        if (tab) {
          setActiveTab(tab.id);
        }
      }
    };

    window.addEventListener("hashchange", onHash);

    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [counties, setCounties] = useState<County[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [referenceReady, setReferenceReady] = useState(false);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [scoringConfig, setScoringConfig] = useState<ScoringConfig>(DEFAULT_SCORING_CONFIG);

  useEffect(() => {
    void getScoringConfig().then((stored) => {
      setScoringConfig(sanitizeConfig(stored ?? DEFAULT_SCORING_CONFIG));
    });
  }, []);

  const applyScoringConfig = useCallback((next: ScoringConfig) => {
    setScoringConfig(sanitizeConfig(next));
    void saveScoringConfig(sanitizeConfig(next));
  }, []);

  const resetScoringConfig = useCallback(() => {
    setScoringConfig(DEFAULT_SCORING_CONFIG);
    void clearScoringConfig();
  }, []);

  const { value: supplies = [] } = useLiveDexie(() => db.supplies.toArray(), []);
  const { value: demands = [] } = useLiveDexie(() => db.demands.toArray(), []);
  const { value: prices = [] } = useLiveDexie(() => db.prices.toArray(), []);

  const [cells, setCells] = useState<OpportunityCell[]>([]);
  const [cellsLoading, setCellsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    ensureReferenceData()
      .then(async () => {
        if (cancelled) {
          return;
        }

        const [countyList, productList, marketList] = await Promise.all([
          getCachedCounties(),
          getCachedProducts(),
          getCachedMarkets(),
        ]);

        setCounties(countyList);
        setProducts(productList);
        setMarkets(marketList);
        setReferenceReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReferenceError(
            error instanceof Error ? error.message : "Failed to load reference data.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!referenceReady) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(() => {
      setCellsLoading(true);

      computeOpportunitySurface(
        {
          supplies,
          demands,
          prices,
          products,
          markets,
          counties,
          resolveUnknownLocation: async (locationName) => {
            const resolved = await resolveLocation(locationName);

            if (!resolved) {
              return null;
            }

            return { latitude: resolved.latitude, longitude: resolved.longitude };
          },
          fetchWeather: async (latitude, longitude) => {
            const result = await getWeatherSignals(latitude, longitude);

            return suitabilityFromWeatherSignals(result.signals);
          },
        },
        scoringConfig,
      )
        .then((nextCells) => {
          if (!cancelled) {
            setCells(nextCells);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCells([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCellsLoading(false);
          }
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [referenceReady, counties, products, markets, supplies, demands, prices, scoringConfig]);

  useEffect(() => {
    if (cells.length === 0) {
      return;
    }

    void persistTopMatches(cells).catch(() => {
      // Persistence of matches is best-effort; the surface still renders.
    });
  }, [cells]);

  const recordCounts = useMemo(
    () => ({ supply: supplies.length, demand: demands.length, price: prices.length }),
    [supplies, demands, prices],
  );

  const hasAnyRecords = recordCounts.supply + recordCounts.demand + recordCounts.price > 0;
  const showOnboarding = !onboardingDone && !hasAnyRecords;
  const effectiveRole: UserRole = role ?? "observer";

  const setActive = (tab: Tab) => {
    setActiveTab(tab);
    openAppTab(tab);
  };

  return (
    <section className="workspace section-block">
      <header className="workspace-top">
        <div className="workspace-top-title">
          <h1>{PAGE_META[activeTab].title}</h1>
          <p className="section-subnote">{PAGE_META[activeTab].sub}</p>
        </div>
      </header>

      {showOnboarding && (
        <OnboardingPanel
          role={effectiveRole}
          counties={counties}
          products={products}
          markets={markets}
          referenceReady={referenceReady}
          onComplete={(tab) => {
            setOnboardingDoneState(true);
            setActiveTab(tab);
          }}
        />
      )}

      {!showOnboarding && !hasAnyRecords && activeTab === "overview" && (
        <div className="empty-state start-here">
          <span className="start-here-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </span>
          <div>
            <h3>No supply or demand data yet.</h3>
            <p>
              Log your first real entry to start building the surface — the engine needs at least
              three records in a market–product cell before a component can contribute.
            </p>
          </div>
        </div>
      )}

      {!referenceReady && referenceError === null && (
        <p className="workspace-note is-loading">
          Loading reference data (counties, products, markets)…
        </p>
      )}

      {referenceError !== null && (
        <p className="workspace-note is-warning">
          Could not reach the reference API ({referenceError}). Forms will still work, but market
          coordinates and product lists may be incomplete.
        </p>
      )}

      {!showOnboarding && (
        <div className="workspace-shell">
          <AppNav activeTab={activeTab} onSelect={setActive} />

          <div className="workspace-pane">
            {activeTab === "overview" && (
              <WorkspaceOverview
                cells={cells}
                cellsLoading={cellsLoading}
                supplies={supplies}
                demands={demands}
                prices={prices}
                counties={counties}
                markets={markets}
              />
            )}

            {activeTab === "markets" && <MarketsPanel markets={markets} />}

            {activeTab === "opportunity" && (
              <OpportunityScreen
                cells={cells}
                loading={!referenceReady || cellsLoading}
                counties={counties}
                markets={markets}
                recordCounts={recordCounts}
                referenceReady={referenceReady}
              />
            )}

            {activeTab === "matches" && <MatchesPanel />}

            {activeTab === "signals" && <LiveSignals counties={counties} referenceReady={referenceReady} cells={cells} />}

            {activeTab === "insights" && <InsightsPanel cells={cells} />}

            {activeTab === "supply" && <RecordLedger kind="supply" />}

            {activeTab === "demand" && <RecordLedger kind="demand" />}

            {activeTab === "prices" && <PricesPanel />}

            {activeTab === "exports" && <DatasetPanel />}

            {activeTab === "sensitivity" && (
              <SensitivityPanel
                config={scoringConfig}
                onConfigChange={applyScoringConfig}
                onReset={resetScoringConfig}
              />
            )}

            {activeTab === "enter" && (
              <AddEntryFlow
                products={products}
                counties={counties}
                markets={markets}
                disabled={!referenceReady}
              />
            )}

            {activeTab === "settings" && <SettingsPanel />}
          </div>
        </div>
      )}
    </section>
  );
}