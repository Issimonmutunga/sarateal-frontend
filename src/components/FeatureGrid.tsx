import { Fragment } from "react";
import { METHOD_SECTION, METHOD_STEPS } from "../lib/seo";
import { SaratealLogo } from "./SaratealLogo";

export function FeatureGrid() {
  return (
    <section className="about-block" id="method" data-reveal>
      <h2>{METHOD_SECTION.heading}</h2>
      <p className="section-subnote">{METHOD_SECTION.subnote}</p>

      <div className="method-flow">
        {METHOD_STEPS.map((step, index) => (
          <Fragment key={step.number}>
            {index > 0 && (
              <span className="flow-arrow" aria-hidden="true">
                →
              </span>
            )}
            <div className={index === 1 ? "flow-node is-brand" : "flow-node"}>
              <span className="flow-chip">{step.number}</span>
              {index === 1 ? (
                <SaratealLogo size="default" className="flow-wordmark" />
              ) : (
                <h3>{step.title}</h3>
              )}
              <p>{step.body}</p>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}