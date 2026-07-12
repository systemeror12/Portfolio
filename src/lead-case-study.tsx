import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { InternalLink } from "./navigation";

const leadCaseStudy = {
  eyebrow: "Lead Case Study / Sanitized Project Evidence",
  title: "Multi-Company HRIS",
  summary:
    "One shared Odoo deployment serving multiple legal companies, with common platform capabilities and company-specific employees, payroll rules, permissions, and reporting.",
  focus: "Custom Payroll",
  evidenceBoundary: "Multiple legal companies; no confidential scale",
  problem: {
    label: "Problem and constraints",
    title:
      "Bring HR workflows into one approved flow without flattening company boundaries.",
    description:
      "Disconnected manual HR and payroll work needed to become one shared operation. The system had to preserve company-specific employees, permissions, reporting, and Philippine Payroll Rules while supporting custom attendance, recruitment, leave, overtime, and payroll workflows.",
  },
  contribution: {
    label: "Case Study Contribution",
    title:
      "Core workflow design and implementation within a cross-functional delivery.",
    description:
      "Jerome designed and implemented most core HR workflows—including Attendance, Recruitment, and Payroll—and the dashboard within a broader client implementation delivered with a cross-functional team.",
  },
  decisions: {
    label: "Engineering decisions",
    title: "Make the company boundary part of the system design.",
    items: [
      "Use one shared platform while keeping company-specific records, access, reporting, and payroll rules distinct.",
      "Consume approved attendance, overtime, and leave records as Payroll Input rather than treating payroll as an isolated calculation.",
      "Keep payslip calculations traceable to the rules and approved records that produced them.",
    ],
  },
  validation: {
    label: "Payroll Validation",
    title: "Test the calculations against the operation they serve.",
    description:
      "Payroll Validation used representative scenarios, comparison with HR’s expected manual calculations, edge-case tests for holidays, overtime, and leave, and client acceptance before rollout.",
  },
  outcome: {
    label: "HRIS Outcome",
    title: "One approved path from HR record to payslip calculation.",
    description:
      "The Multi-Company HRIS replaced disconnected manual HR and payroll work with one approved flow from attendance, overtime, and leave through payslip calculation, while preserving company-specific rules and access boundaries.",
  },
  technologies: [
    "Odoo Community",
    "Python",
    "PostgreSQL",
    "JavaScript",
    "QWeb",
  ],
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

function PayrollFlow() {
  return (
    <figure
      className="payroll-flow"
      role="img"
      aria-label="Payroll calculation flow"
    >
      <figcaption>
        <span>Reconstructed system flow</span>
        <p>
          Multiple legal companies retain their own rules and access. Approved
          Payroll Input moves through company-specific Philippine Payroll Rules
          to a traceable payslip calculation.
        </p>
      </figcaption>
      <div className="flow-lane">
        <div className="company-boundaries">
          <div>
            <small>Company boundary</small>
            <strong>Legal company A</strong>
            <p>Rules and access remain separate.</p>
          </div>
          <div>
            <small>Company boundary</small>
            <strong>Legal company B</strong>
            <p>Rules and access remain separate.</p>
          </div>
        </div>
        <ArrowRight />
        <div>
          <small>Approved record</small>
          <strong>Payroll Input</strong>
          <p>Attendance, overtime, or leave.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Company-specific logic</small>
          <strong>Philippine Payroll Rules</strong>
          <p>Client-approved salary rules.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Visible result</small>
          <strong>Payslip calculation</strong>
          <p>Inputs and calculations are traceable.</p>
        </div>
      </div>
      <div className="flow-note">
        <LockKeyhole /> Sanitized reconstruction; no client identity, data, or
        Confidential Scale is shown.
      </div>
    </figure>
  );
}

export function LeadCaseStudy() {
  return (
    <>
      <main className="case-study">
        <section className="case-hero">
          <div>
            <span className="eyebrow">{leadCaseStudy.eyebrow}</span>
            <h1>
              Multi-Company
              <br />
              HRIS
            </h1>
            <p>{leadCaseStudy.summary}</p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>Focus</span>
            <strong>{leadCaseStudy.focus}</strong>
            <span>Evidence boundary</span>
            <strong>{leadCaseStudy.evidenceBoundary}</strong>
          </div>
        </section>
        <NarrativeSection
          section={leadCaseStudy.problem}
          className="case-problem"
        />
        <NarrativeSection
          section={leadCaseStudy.contribution}
          className="contribution"
        />
        <PayrollFlow />
        <section className="case-section decisions">
          <span className="section-label">{leadCaseStudy.decisions.label}</span>
          <div>
            <h2>{leadCaseStudy.decisions.title}</h2>
            <ul>
              {leadCaseStudy.decisions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <NarrativeSection
          section={leadCaseStudy.validation}
          className="validation"
        />
        <NarrativeSection section={leadCaseStudy.outcome} className="outcome" />
        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            {leadCaseStudy.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>Multi-Company HRIS / Sanitized Project Evidence</span>
      </footer>
    </>
  );
}
