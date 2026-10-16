import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { CaseFor, CaseIron, CaseKind } from "./case-study-iron";
import { InternalLink } from "./navigation";
import "./styles/case-study.css";

const brokerageCaseStudy = {
  title: "Brokerage ERP Rebuild",
  summary:
    "Jerome keeps a financial brokerage's live Odoo 10 ERP correct as its Project Maintainer while rebuilding it on Odoo 18 Community with two other developers. The cutover stops rather than load wrong data.",
  focus: "Fail-Closed Cutover",
  evidenceBoundary: "Anonymized financial brokerage; sanitized reconstruction",
  problem: {
    label: "Problem and constraints",
    title: "Move the books without losing a single number.",
    description:
      "The live Odoo 10 ERP carries edits inside Odoo core and runs the brokerage's deals, invoicing, payments, and books. The rebuild targets Odoo 18 Community and leaves core unchanged. Every amount, reconciliation, and document number has to survive the move, and the old system has to stay correct until cutover.",
  },
  contribution: {
    label: "Contribution",
    title: "Project Maintainer of both systems, in a three-developer team.",
    description:
      "Jerome is the Project Maintainer of the live Odoo 10 system and the Odoo 18 rebuild, resolving the issues QA raises against both. He builds the rebuild with two other developers and didn't build every module. His merged work falls in four themes.",
  },
  themes: {
    label: "Merged work",
    title: "Four themes, each checked before it counts.",
    items: [
      {
        name: "Fail-Closed Cutover",
        description:
          "Extract, transform, load, and verify, with a verifier that requires zero differences and a cutover mode that stops when a check can't run. Accounting is finalized with document numbering kept continuous, attachments and chatter carry over, and full-volume loads don't exhaust memory.",
      },
      {
        name: "Report Parity",
        description:
          "The books of accounts, General Ledger, Trial Balance, aged balances, Financial Report, vouchers, and receipts print in the Odoo 10 formats. A view-parity checker compares reports by content, not layout.",
      },
      {
        name: "Accounting correctness from QA",
        description:
          "BIR 2307, creditable withholding and VAT on payments, USD withholding at the invoice's rate, write-offs across currencies, company boundaries, retry-safe payment wizards, and deal pricing.",
      },
      {
        name: "Delivery environment",
        description:
          "Playwright end-to-end tests, golden parity tests, calculations tested without Odoo, and a per-worktree Odoo setup that lets several agent worktrees share one database safely.",
      },
    ],
  },
  liveSystem: {
    label: "On the live Odoo 10 system",
    title: "Keep the old system correct until cutover.",
    description:
      "Bill-wise AR aging and reconciliation fixes, restored invoice prints, a Trial Balance Excel export, and CI.",
  },
  standing: {
    label: "Where it stands",
    title: "Rehearsed, not yet live.",
    description:
      "A cutover rehearsal on a sample of deals reconciled to zero differences against Odoo 10. The Odoo 18 system is not yet live.",
  },
  technologies: ["Odoo 18", "Odoo 10", "Python", "PostgreSQL", "Playwright"],
};

function NarrativeSection({
  section,
  className = "",
}: {
  section: { label: string; title: string; description: string };
  className?: string;
}) {
  return (
    <section className={`case-section ${className}`}>
      <span className="section-label">{section.label}</span>
      <div>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
      </div>
    </section>
  );
}

function CutoverFlow() {
  return (
    <figure
      className="case-study-flow"
      role="img"
      aria-label="Sanitized cutover flow"
    >
      <figcaption>
        <span>Reconstructed system flow</span>
        <p>
          Data leaves Odoo 10 through extract, transform, load, and verify
          before Odoo 18 takes over. Any difference, or any check that can't
          run, stops cutover.
        </p>
      </figcaption>
      <div className="flow-lane">
        <div>
          <small>Live system</small>
          <strong>Odoo 10</strong>
          <p>Edits inside core; kept correct until cutover.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Step one</small>
          <strong>Extract</strong>
          <p>Deals, invoices, payments, and the books.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Step two</small>
          <strong>Transform</strong>
          <p>Onto Odoo 18 Community, with core unchanged.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Step three</small>
          <strong>Load</strong>
          <p>Numbering continuous; attachments and chatter carried over.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Step four</small>
          <strong>Verify</strong>
          <p>Zero differences, or cutover stops.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Rebuilt system</small>
          <strong>Odoo 18</strong>
          <p>Not yet live.</p>
        </div>
      </div>
      <div className="flow-note">
        <LockKeyhole /> Sanitized reconstruction; no client identity or data
        is shown.
      </div>
    </figure>
  );
}

export function BrokerageErpRebuildCaseStudy() {
  return (
    <>
      <main id="main" tabIndex={-1} className="case-study">
        <section className="case-hero">
          <div>
            <CaseKind id="brokerage-erp-rebuild" />
            <h1>
              Brokerage ERP
              <br />
              Rebuild
            </h1>
            <CaseFor id="brokerage-erp-rebuild" />
            <p>{brokerageCaseStudy.summary}</p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>Focus</span>
            <strong>{brokerageCaseStudy.focus}</strong>
            <span>Evidence boundary</span>
            <strong>{brokerageCaseStudy.evidenceBoundary}</strong>
          </div>
        </section>
        <NarrativeSection
          section={brokerageCaseStudy.problem}
          className="case-problem"
        />
        <NarrativeSection
          section={brokerageCaseStudy.contribution}
          className="contribution"
        />
        <CutoverFlow />
        <section className="case-section decisions">
          <span className="section-label">
            {brokerageCaseStudy.themes.label}
          </span>
          <div>
            <h2>{brokerageCaseStudy.themes.title}</h2>
            <ul>
              {brokerageCaseStudy.themes.items.map((theme) => (
                <li key={theme.name}>
                  <strong>{theme.name}:</strong> {theme.description}
                </li>
              ))}
            </ul>
          </div>
        </section>
        <NarrativeSection
          section={brokerageCaseStudy.liveSystem}
          className="live-system"
        />
        <NarrativeSection
          section={brokerageCaseStudy.standing}
          className="standing"
        />
        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            {brokerageCaseStudy.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
        <CaseIron id="brokerage-erp-rebuild" />
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>Brokerage ERP Rebuild / Sanitized Project Evidence</span>
      </footer>
    </>
  );
}
