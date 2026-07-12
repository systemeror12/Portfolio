import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { InternalLink } from "./navigation";

const aiOdooRndCaseStudy = {
  eyebrow: "AI R&D Case Study / Sanitized Project Evidence",
  title: "AI R&D Case Study",
  summary:
    "A successful internal feasibility prototype for answering conversational Odoo questions from authorized business records—without presenting the work as a production client deployment.",
  focus: "Access-Scoped Retrieval",
  evidenceBoundary: "Internal R&D; no production client deployment",
  problem: {
    label: "Problem and constraints",
    title:
      "Test a useful chatbot without treating private records as open context.",
    description:
      "The company needed to learn whether conversational Odoo workflows could answer from relevant business records while preserving each logged-in user's access boundaries. The work was a successful internal R&D prototype, not a production client deployment or a claim of perfect accuracy.",
  },
  contribution: {
    label: "Jerome's responsibility",
    title: "Explore the feasibility boundary from retrieval to failure handling.",
    description:
      "Jerome explored the RAG workflow, conversational interaction, privacy boundaries, external AI integration, and failure handling in the working internal prototype. The goal was to make the intended Odoo integration testable end to end, not to expose unrestricted records to a model.",
  },
  decisions: {
    label: "Engineering decisions",
    title: "Authorize records before retrieval, then make the evidence visible.",
    items: [
      "Apply the logged-in user's Odoo access rules before searching records, so Access-Scoped Retrieval starts from records that user is permitted to use.",
      "Use OpenAI embedding vectors to compare a question with authorized record content and select relevant supporting evidence; vectors help find related text, rather than granting access or making a factual guarantee.",
      "Supply the relevant authorized evidence with the question so the model can produce an Odoo-Grounded Answer instead of responding from the question alone.",
    ],
  },
  validation: {
    label: "Validation and failure handling",
    title: "Missing evidence is a safe response, not a guess.",
    description:
      "The prototype checked the end-to-end chatbot scenarios agreed for the R&D work. When retrieval found no sufficiently relevant authorized Odoo records, it returned an Ungrounded Fallback: it said that supporting company information was not found and directed the person to HR or support rather than inventing an answer.",
  },
  outcome: {
    label: "R&D Success",
    title:
      "An internal prototype proved the agreed end-to-end scenarios were feasible.",
    description:
      "R&D Success means the internal prototype completed the company's agreed chatbot scenarios and demonstrated that the intended Odoo integration was technically feasible. It does not claim a production client deployment, unrestricted record access, or perfect answer accuracy.",
  },
  technologies: [
    "Odoo",
    "Python",
    "PostgreSQL",
    "OpenAI embedding vectors",
    "RAG",
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

function AccessScopedRetrievalFlow() {
  return (
    <figure
      className="case-study-flow ai-flow"
      aria-labelledby="ai-flow-title"
      aria-describedby="ai-flow-description"
    >
      <figcaption>
        <span id="ai-flow-title">Reconstructed RAG flow</span>
        <p id="ai-flow-description">
          Access rules come before retrieval. Only then can OpenAI embedding
          vectors locate relevant authorized Odoo records for an
          Odoo-Grounded Answer; otherwise, the workflow returns an Ungrounded
          Fallback.
        </p>
      </figcaption>
      <div className="flow-lane ai-flow-lane">
        <div>
          <small>Identity and permissions</small>
          <strong>Odoo access rules</strong>
          <p>Scope the records available to the logged-in person.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Authorized search</small>
          <strong>Access-Scoped Retrieval</strong>
          <p>Search only records that passed the access rules.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Relevant evidence</small>
          <strong>OpenAI embedding vectors</strong>
          <p>Match the question with relevant authorized record content.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Response path</small>
          <strong>Odoo-Grounded Answer</strong>
          <p>Use the selected evidence, or return an Ungrounded Fallback.</p>
        </div>
      </div>
      <div className="flow-note">
        <LockKeyhole /> Sanitized reconstruction; access rules apply before
        retrieval and no private records are displayed.
      </div>
    </figure>
  );
}

export function AiOdooRndCaseStudy() {
  return (
    <>
      <main className="case-study">
        <section className="case-hero">
          <div>
            <span className="eyebrow">{aiOdooRndCaseStudy.eyebrow}</span>
            <h1>{aiOdooRndCaseStudy.title}</h1>
            <p>{aiOdooRndCaseStudy.summary}</p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>Focus</span>
            <strong>{aiOdooRndCaseStudy.focus}</strong>
            <span>Evidence boundary</span>
            <strong>{aiOdooRndCaseStudy.evidenceBoundary}</strong>
          </div>
        </section>
        <NarrativeSection
          section={aiOdooRndCaseStudy.problem}
          className="case-problem"
        />
        <NarrativeSection
          section={aiOdooRndCaseStudy.contribution}
          className="contribution"
        />
        <AccessScopedRetrievalFlow />
        <section className="case-section decisions">
          <span className="section-label">{aiOdooRndCaseStudy.decisions.label}</span>
          <div>
            <h2>{aiOdooRndCaseStudy.decisions.title}</h2>
            <ul>
              {aiOdooRndCaseStudy.decisions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <NarrativeSection
          section={aiOdooRndCaseStudy.validation}
          className="validation"
        />
        <NarrativeSection
          section={aiOdooRndCaseStudy.outcome}
          className="outcome"
        />
        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            {aiOdooRndCaseStudy.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>AI R&amp;D Case Study / Sanitized Project Evidence</span>
      </footer>
    </>
  );
}
