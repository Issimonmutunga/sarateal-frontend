import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";

import { computeOpportunitySurface, suitabilityFromWeatherSignals } from "../../engine";
import { DEFAULT_SCORING_CONFIG, sanitizeConfig, type ScoringConfig } from "../../engine/config";
import { persistTopMatches } from "../../engine/matches";
import type { OpportunityCell } from "../../engine/types";
import { useLiveDexie } from "../../hooks/useDexie";
import { ensureReferenceData, getCachedCounties, getCachedMarkets, getCachedProducts } from "../../lib/cache";
import { clearScoringConfig, db, getOnboardingDone, getRole, getScoringConfig, saveRole, saveScoringConfig, type UserRole } from "../../lib/db";
import { getWeatherSignals, resolveLocation } from "../../lib/live";
import { APP_WORKSPACE } from "../../lib/seo";
import type { County, Market, Product } from "../../types/api";
import { AppNav } from "./AppNav";
import { DatasetPanel } from "./DatasetPanel";
import { EntryForms } from "./EntryForms";
import { InsightsPanel } from "./InsightsPanel";
import { LiveSignals } from "./LiveSignals";
import { MatchesPanel } from "./MatchesPanel";
import { OnboardingPanel } from "./OnboardingPanel";
import { OpportunitySurface } from "./OpportunitySurface";
import { SensitivityPanel } from "./SensitivityPanel";

const MarketMap = lazy(() => import("./MarketMap").then((module) => ({ default: module.MarketMap })));

type Tab = "enter" | "surface" | "matches" | "data" | "signals" | "sensitivity" | "insights";

export type { Tab };

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "enter", label: "Entry forms" },
  { id: "surface", label: "Opportunity surface" },
  { id: "matches", label: "Matches" },
  { id: "data", label: "Data & export" },
  { id: "signals", label: "Live signals" },
  { id: "insights", label: "Insights" },
  { id: "sensitivity", label: "Sensitivity" },
];

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

  const setRoleAndSave = (next: UserRole) => {
    setRole(next);
    void saveRole(next);
  };

  return (
    <section className="workspace section-block">
      <div className="section-heading">
        <h1>The opportunity engine</h1>
        <p className="section-subnote">{APP_WORKSPACE.intro}</p>

        <div className="role-switcher" role="group" aria-label="Your role">
          {(["farmer", "buyer", "observer"] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={`type-button${role === candidate ? " is-active" : ""}`}
              onClick={() => {
                setRoleAndSave(candidate);
                const nav = TABS.find((tab) => {
                  if (candidate === "observer") {
                    return tab.id === "insights";
                  }
                  return tab.id === "enter";
                });

                if (nav) {
                  setActiveTab(nav.id);
                }
              }}
            >
              {candidate}
            </button>
          ))}
        </div>
      </div>

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

      {!showOnboarding && !hasAnyRecords && (
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
          <button type="button" className="btn btn-primary" onClick={() => setActiveTab("enter")}>
            Log your first entry
          </button>
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
          <AppNav role={role} activeTab={activeTab} onSelect={setActiveTab} />

          <Suspense
            fallback={<aside className="market-map-panel"><div className="workspace-note is-loading">Loading map…</div></aside>}
          >
            <MarketMap
              supplies={supplies}
              demands={demands}
              prices={prices}
              counties={counties}
              markets={markets}
            />
          </Suspense>

          <div className="workspace-pane">
            {activeTab === "enter" && (
              <EntryForms
                products={products}
                counties={counties}
                markets={markets}
                disabled={!referenceReady}
              />
            )}

            {activeTab === "surface" && (
              <OpportunitySurface
                cells={cells}
                loading={!!referenceReady && cellsLoading}
                recordCounts={recordCounts}
              />
            )}

            {activeTab === "matches" && <MatchesPanel />}

            {activeTab === "data" && <DatasetPanel />}

            {activeTab === "signals" && <LiveSignals counties={counties} referenceReady={referenceReady} />}

            {activeTab === "insights" && <InsightsPanel cells={cells} />}

            {activeTab === "sensitivity" && (
              <SensitivityPanel
                config={scoringConfig}
                onConfigChange={applyScoringConfig}
                onReset={resetScoringConfig}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
