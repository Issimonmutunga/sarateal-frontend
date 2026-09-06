import { useEffect, useState } from "react";

import { getOnboardingDone, getRole, saveRole, setOnboardingDone, type UserRole } from "../../lib/db";
import { openAppTab } from "../../lib/hash";
import { SETTINGS_INTRO } from "../../lib/seo";

const ROLE_LABELS: Record<UserRole, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  observer: "Observer",
};

const ROLE_DEFAULT_TAB: Record<UserRole, string> = {
  farmer: "supply",
  buyer: "demand",
  observer: "opportunity",
};

export function SettingsPanel() {
  const [role, setRole] = useState<UserRole>("observer");
  const [onboardingDone, setDone] = useState(true);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const [storedRole, done] = await Promise.all([getRole(), getOnboardingDone()]);

      if (mounted) {
        setRole(storedRole ?? "observer");
        setDone(done);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const switchRole = (next: UserRole) => {
    setRole(next);
    void saveRole(next);
    openAppTab(ROLE_DEFAULT_TAB[next]);
  };

  const toggleOnboarding = () => {
    const next = !onboardingDone;

    void setOnboardingDone(next).then(() => setDone(next));
  };

  return (
    <div className="workspace-panel settings-panel">
      <div className="section-heading">
        <h2>Settings</h2>
        <p className="section-subnote">{SETTINGS_INTRO}</p>
      </div>

      <section className="settings-section">
        <h3>Your role</h3>
        <p className="section-subnote">Changing your role reopens the workspace at the best starting view.</p>
        <div className="role-switcher" role="group" aria-label="Your role">
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={`type-button${role === candidate ? " is-active" : ""}`}
              onClick={() => switchRole(candidate)}
            >
              {ROLE_LABELS[candidate]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h3>Onboarding</h3>
        <p className="section-subnote">
          {onboardingDone ? "Onboarding is complete." : "Onboarding has not been finished."}
        </p>
        <button
          type="button"
          className="status-button"
          onClick={toggleOnboarding}
        >
          {onboardingDone ? "Replay onboarding" : "Mark as complete"}
        </button>
      </section>

      <section className="settings-section">
        <h3>Data & system</h3>
        <p className="section-subnote">
          Export and import live in this browser only. The API documentation is over on the
          developers page.
        </p>
        <div className="panel-actions">
          <a className="btn btn-secondary btn-sm" href="#/app/exports">
            Export / import
          </a>
          <a className="btn btn-secondary btn-sm" href="/developers">
            Developers
          </a>
        </div>
      </section>
    </div>
  );
}