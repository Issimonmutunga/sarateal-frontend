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
import { navigateHash, openAppTab } from "../../lib/hash";
import { greeting, homeSubtitle, ROLE_EVENT, roleFromHash, sectionFor, tabFromHash, type Tab } from "../../lib/journey";
import { AddEntryFlow, type Kind } from "./AddEntryFlow";
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
import { SectionTabs } from "./SectionTabs";
import { WorkspaceOverview } from "./WorkspaceOverview";

export type { Tab };

function parseEnterIntent(): Kind | null {
  const match = /^#\/app\/enter\?kind=(supply|demand|price)/.exec(window.location.hash);

  return match ? (match[1] as Kind) : null;
}

interface STMOIWorkspaceProps {
  initialTab: Tab;
}

export function STMOIWorkspace({ initialTab }: STMOIWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [role, setRole] = useState<UserRole | null>(null);
  const [onboardingDone, setOnboardingDoneState] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState({ role: false, onboarding: false });
  const [enterIntent, setEnterIntent] = useState<Kind | null>(() => parseEnterIntent());

  useEffect(() => {
    // A role passed in the link (landing page buttons) or implied by an
    // "add supply / add demand" shortcut wins; otherwise keep what's stored
    // and leave it unset so onboarding can ask.
    const fromLink =
      roleFromHash(window.location.hash) ??
      (enterIntent === "supply" ? "farmer" : enterIntent === "demand" ? "buyer" : null);

    void getRole().then((stored) => {
      if (fromLink !== null && fromLink !== stored) {
        setRole(fromLink);
        void saveRole(fromLink).then(() => window.dispatchEvent(new Event(ROLE_EVENT)));
      } else {
        setRole(stored);
      }

      setProfileLoaded((loaded) => ({ ...loaded, role: true }));
    });

    const onRole = () => void getRole().then(setRole);

    window.addEventListener(ROLE_EVENT, onRole);

    return () => window.removeEventListener(ROLE_EVENT, onRole);
  }, [enterIntent]);

  useEffect(() => {
    void getOnboardingDone().then((done) => {
      setOnboardingDoneState(done);
      setProfileLoaded((loaded) => ({ ...loaded, onboarding: true }));
    });
  }, []);

  useEffect(() => {
    const onHash = () => {
      const tab = tabFromHash(window.location.hash);

      if (tab) {
        setActiveTab(tab);
      }

      setEnterIntent(parseEnterIntent());
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
  const profileReady = profileLoaded.role && profileLoaded.onboarding;
  // Once onboarding opens it stays until the person finishes or skips it —
  // saving the first record must not yank them out mid-flow.
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  if (profileReady && !onboardingDone && !hasAnyRecords && !onboardingOpen) {
    setOnboardingOpen(true);
  }

  const showOnboarding = onboardingOpen && !onboardingDone;
  const section = sectionFor(activeTab);

  const chooseRole = (next: UserRole) => {
    setRole(next);
    void saveRole(next).then(() => window.dispatchEvent(new Event(ROLE_EVENT)));
  };

  const setActive = (tab: Tab) => {
    setActiveTab(tab);
    openAppTab(tab);
  };

  return (
    <section className="workspace section-block">
      {showOnboarding ? (
        <OnboardingPanel
          role={role}
          onRoleChange={chooseRole}
          counties={counties}
          products={products}
          markets={markets}
          referenceReady={referenceReady}
          onComplete={(tab, kind) => {
            setOnboardingDoneState(true);

            if (kind) {
              navigateHash(`#/app/enter?kind=${kind}`);
            } else {
              setActive(tab);
            }
          }}
        />
      ) : (
        profileReady && activeTab !== "enter" && (
          <header className="workspace-top">
            <div className="workspace-top-title">
              <h1>{section.id === "home" ? greeting() : section.title}</h1>
              {section.id === "home" ? (
                <p className="section-subnote">{homeSubtitle(role)}</p>
              ) : (
                section.sub && <p className="section-subnote">{section.sub}</p>
              )}
            </div>
            {section.tabs.length > 1 && <SectionTabs section={section} activeTab={activeTab} onSelect={setActive} />}
          </header>
        )
      )}

      {!referenceReady && referenceError === null && (
        <p className="workspace-note is-loading">
          Loading markets and products…
        </p>
      )}

      {referenceError !== null && (
        <p className="workspace-note is-warning">
          We couldn't reach the Sarateal server, so some market and product lists may be missing.
          You can still add records — try reloading in a minute. <small>({referenceError})</small>
        </p>
      )}

      {profileReady && !showOnboarding && (
        <div className="workspace-shell is-single">
          <div className="workspace-pane" key={activeTab}>
            {activeTab === "overview" && (
              <WorkspaceOverview
                cells={cells}
                cellsLoading={cellsLoading}
                supplies={supplies}
                demands={demands}
                prices={prices}
                counties={counties}
                markets={markets}
                role={role}
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
                key={enterIntent ?? "standalone"}
                products={products}
                counties={counties}
                markets={markets}
                disabled={!referenceReady}
                initialKind={enterIntent ?? (role === "buyer" ? "demand" : "supply")}
                startAtProduct={enterIntent !== null}
              />
            )}

            {activeTab === "settings" && <SettingsPanel />}
          </div>
        </div>
      )}
    </section>
  );
}