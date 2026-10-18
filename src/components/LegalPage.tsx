import { LEGAL_CONTACT, type LegalDoc } from "../lib/legal";
import { AppIcon } from "./AppIcon";

interface LegalPageProps {
  doc: LegalDoc;
}

export function LegalPage({ doc }: LegalPageProps) {
  const other = doc.path === "/terms" ? { href: "/privacy", label: "Privacy policy" } : { href: "/terms", label: "Terms of use" };

  return (
    <article className="legal-page">
      <a className="legal-back" href="/">
        ← Sarateal home page
      </a>

      <header className="legal-head">
        <h1>{doc.title}</h1>
        <p className="legal-updated">Last updated {doc.updated}</p>
      </header>

      <section className="legal-summary" aria-label="In short">
        <h2>In short</h2>
        <ul>
          {doc.summary.map((line) => (
            <li key={line}>
              <AppIcon name="check" size={16} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {doc.sections.map((section) => (
        <section className="legal-section" key={section.heading}>
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <section className="legal-section">
        <h2>Questions</h2>
        <p>
          If something here is unclear, please{" "}
          <a href={LEGAL_CONTACT.url} target="_blank" rel="noreferrer">
            {LEGAL_CONTACT.label}
          </a>
          .
        </p>
      </section>

      <nav className="legal-foot" aria-label="Related pages">
        <a href={other.href}>{other.label} →</a>
        <a className="btn btn-primary btn-sm" href="/app">
          Open the app
        </a>
      </nav>
    </article>
  );
}
