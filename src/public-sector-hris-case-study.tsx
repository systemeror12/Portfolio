import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { InternalLink } from "./navigation";

const publicSectorCaseStudy = {
  eyebrow: "Public Sector HRIS Case Study / Sanitized Project Evidence",
  title: "Government Water District HRIS",
  summary:
    "A public sector HRIS delivered for the Government Water District, led by attendance integrity and supported by self-service HR workflows for personnel movements and leave.",
  focus: "Attendance integrity",
  evidenceBoundary: "Anonymized public sector client; sanitized reconstruction",
  problem: {
    label: "Problem and constraints",
    title: "Make every punch defensible before anything reads it.",
    description:
      "A water district runs on attendance: reports, overtime, leave, and pass slips all depended on device punches nobody could fully trust. Separate legacy attendance layers disagreed with each other, and fixing a wrong punch had no auditable path. Overtime and payroll could only be trusted if a single Authoritative Punch Record sat underneath them, with every Attendance Correction approved and evidence-backed.",
  },
  contribution: {
    label: "Case Study Contribution",
    title:
      "Attendance engine and self-service HR workflows in a five-person delivery.",
    description:
      "Jerome built the attendance engine, overtime requests, Biometric Import, the Personnel Action Form, and Leave Monetization outright, and extended My Dashboard and recruitment: the Government Recruitment Workflow restructured the PDS and separated the Plantilla and Job Order appointment tracks, with DTR PDF reporting alongside. He was the largest contributor on a five-person delivery team over roughly three months.",
  },
  decisions: {
    label: "Engineering decisions",
    title: "One evaluation path, one workflow lifecycle, one honest dashboard.",
    items: [
      "Resolve every employee-day through a single Attendance Day evaluation path, so reports, overtime, leave, and pass slips read from one Authoritative Punch Record instead of competing legacy layers.",
      "Migrate five ISO Management models (context, risk, EIA, HIRAC, OTP) onto the Unified ISO Workflow, replacing per-model state machines with one auditable lifecycle covered by regression tests.",
      "Rewrite My Dashboard from AbstractModels to controllers with parallel KPI and chart loading, adding a department breakdown widget.",
    ],
  },
  validation: {
    label: "Validation",
    title: "Verify behavior the way the operation will use it.",
    description:
      "Playwright UI scenario coverage exercised the delivered attendance and self-service flows, and migration scripts were verified as the five ISO Management models moved onto the Unified ISO Workflow.",
  },
  outcome: {
    label: "Outcome",
    title: "Attendance the district can audit, HR work employees can start themselves.",
    description:
      "The delivered system resolves each Attendance Day into one Authoritative Punch Record, supports overnight operator shifts crossing midnight through Biometric Import, and keeps Attendance Corrections auditable and voidable with approval gating, never recalculating overtime on their own. Overtime is derived from validated attendance, and employees file Personnel Action Form and Leave Monetization requests through approval routing.",
  },
  technologies: ["Odoo", "Python", "PostgreSQL", "JavaScript"],
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

function AttendanceFlow() {
  return (
    <figure
      className="case-study-flow"
      role="img"
      aria-label="Sanitized attendance flow"
    >
      <figcaption>
        <span>Reconstructed system flow</span>
        <p>
          Device punches enter through Biometric Import, pass approval-gated
          Attendance Correction, and resolve into the Authoritative Punch
          Record that reports, overtime, leave, and pass slips read from.
        </p>
      </figcaption>
      <div className="flow-lane">
        <div>
          <small>Device record</small>
          <strong>Biometric Import</strong>
          <p>Workbook import through a dedicated adapter.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Approval gate</small>
          <strong>Attendance Correction</strong>
          <p>Evidence-backed; voiding restores prior values.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Single source</small>
          <strong>Authoritative Punch Record</strong>
          <p>One daily punch record per employee.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Consumers</small>
          <strong>Reports and requests</strong>
          <p>Reports, overtime, leave, and pass slips.</p>
        </div>
      </div>
      <div className="flow-note">
        <LockKeyhole /> Sanitized reconstruction; no client identity or data
        is shown.
      </div>
    </figure>
  );
}

export function PublicSectorHrisCaseStudy() {
  return (
    <>
      <main className="case-study">
        <section className="case-hero">
          <div>
            <span className="eyebrow">{publicSectorCaseStudy.eyebrow}</span>
            <h1>
              Government Water District
              <br />
              HRIS
            </h1>
            <p>{publicSectorCaseStudy.summary}</p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>Focus</span>
            <strong>{publicSectorCaseStudy.focus}</strong>
            <span>Evidence boundary</span>
            <strong>{publicSectorCaseStudy.evidenceBoundary}</strong>
          </div>
        </section>
        <NarrativeSection
          section={publicSectorCaseStudy.problem}
          className="case-problem"
        />
        <NarrativeSection
          section={publicSectorCaseStudy.contribution}
          className="contribution"
        />
        <AttendanceFlow />
        <section className="case-section decisions">
          <span className="section-label">
            {publicSectorCaseStudy.decisions.label}
          </span>
          <div>
            <h2>{publicSectorCaseStudy.decisions.title}</h2>
            <ul>
              {publicSectorCaseStudy.decisions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <NarrativeSection
          section={publicSectorCaseStudy.validation}
          className="validation"
        />
        <NarrativeSection
          section={publicSectorCaseStudy.outcome}
          className="outcome"
        />
        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            {publicSectorCaseStudy.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>Public Sector HRIS Case Study / Sanitized Project Evidence</span>
      </footer>
    </>
  );
}
