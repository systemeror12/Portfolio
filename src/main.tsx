import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Code,
  Layers3,
  LockKeyhole,
  Mail,
  Menu,
  Network,
  X,
} from "lucide-react";
import { projectEvidence, workingMethod } from "./content";
import { AiOdooRndCaseStudy } from "./ai-odoo-rnd-case-study";
import { LeadCaseStudy } from "./lead-case-study";
import { InternalLink } from "./navigation";
import "./styles.css";

const caseStudyPath = "/work/multi-company-hris";
const aiCaseStudyPath = "/work/ai-odoo-rnd";

function Header({ currentPath }: { currentPath?: string }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className="site-header">
      <InternalLink
        className="identity"
        to="/"
        aria-label="Jerome Mendoza, home"
      >
        <span>JM</span>
        <strong>Jerome Mendoza</strong>
      </InternalLink>
      <nav className={open ? "open" : ""} aria-label="Primary navigation">
        <InternalLink
          to="/"
          aria-current={!currentPath ? "page" : undefined}
          onClick={closeMenu}
        >
          Home
        </InternalLink>
        <InternalLink
          to={caseStudyPath}
          aria-current={currentPath === caseStudyPath ? "page" : undefined}
          onClick={closeMenu}
        >
          Case study
        </InternalLink>
        <InternalLink
          to={aiCaseStudyPath}
          aria-current={currentPath === aiCaseStudyPath ? "page" : undefined}
          onClick={closeMenu}
        >
          AI R&amp;D
        </InternalLink>
        {!currentPath && (
          <>
            <InternalLink to="/#approach" onClick={closeMenu}>
              Approach
            </InternalLink>
            <InternalLink to="/#contact" onClick={closeMenu}>
              Contact
            </InternalLink>
          </>
        )}
      </nav>
      <button
        className="menu-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}

function Topology() {
  return (
    <figure className="topology" aria-labelledby="topology-title">
      <figcaption className="topology-header">
        <span id="topology-title">
          <Network /> Reconstructed system map / HRIS
        </span>
        <span>Boundaries visible</span>
      </figcaption>
      <div className="topology-canvas">
        <div className="topology-node company company-a">
          <small>Legal company</small>
          <strong>Company A</strong>
          <span>rules · access</span>
        </div>
        <div className="topology-node company company-b">
          <small>Legal company</small>
          <strong>Company B</strong>
          <span>rules · access</span>
        </div>
        <div className="topology-node core">
          <Layers3 />
          <small>Shared platform</small>
          <strong>HR operations</strong>
          <span>attendance · leave · payroll</span>
        </div>
        <div className="topology-node result">
          <Check />
          <small>Verified result</small>
          <strong>Traceable payslips</strong>
        </div>
        <svg
          viewBox="0 0 680 390"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M135 88 C270 88 242 195 340 195" />
          <path d="M135 302 C270 302 242 195 340 195" />
          <path d="M440 195 C505 195 516 195 575 195" />
        </svg>
      </div>
      <div className="topology-note">
        <LockKeyhole /> Sanitized architecture · no client identity, data, or
        scale shown
      </div>
    </figure>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow">Platform Engineer / Philippines</span>
        <h1>
          Order for systems
          <br />
          that cannot stop.
        </h1>
        <p>
          I adapt platforms, integrations, and workflows—making their rules,
          state, and boundaries clear enough to trust.
        </p>
        <div className="hero-actions">
          <InternalLink className="primary-action" to="/#evidence">
            Explore system evidence <ArrowRight />
          </InternalLink>
          <InternalLink to="/#contact">Discuss a role</InternalLink>
        </div>
      </div>
      <Topology />
    </section>
  );
}
function Evidence() {
  return (
    <section className="evidence" id="evidence">
      <div className="section-heading">
        <div>
          <span>Selected Project Evidence</span>
          <h2>Systems in operating context.</h2>
        </div>
        <p>
          Each case explains the operation, my responsibility, the architecture,
          its boundaries, and a result I can defend in an interview.
        </p>
      </div>
      <div className="evidence-list">
        {projectEvidence.map((item, index) => (
          <article key={item.key}>
            <div className="case-id">
              <span>SYS / 0{index + 1}</span>
              <small>{item.type}</small>
            </div>
            <div className="case-main">
              <h3>{item.title}</h3>
              <span>Operational problem</span>
              <p>{item.problem}</p>
              <span>Contribution</span>
              <p>{item.contribution}</p>
              {item.key === "lead" && (
                <InternalLink className="case-link" to={caseStudyPath}>
                  Open the Lead Case Study <ArrowRight />
                </InternalLink>
              )}
              {item.key === "research" && (
                <InternalLink className="case-link" to={aiCaseStudyPath}>
                  Open the AI R&amp;D Case Study <ArrowRight />
                </InternalLink>
              )}
            </div>
            <div className="case-detail">
              <span>Architecture</span>
              <p>{item.architecture}</p>
              <span>Boundary</span>
              <p>{item.boundary}</p>
              <span>Verified Result</span>
              <p>{item.result}</p>
              <ul>
                {item.signals.map((signal) => (
                  <li key={signal}>{signal}</li>
                ))}
              </ul>
            </div>
            <ArrowDownRight className="case-arrow" />
          </article>
        ))}
      </div>
    </section>
  );
}
function Approach() {
  return (
    <section className="approach" id="approach">
      <div className="approach-intro">
        <span>Working method</span>
        <h2>Reliability starts before the code.</h2>
        <p>
          My platform work connects technical behavior to the operation it
          serves. That means understanding what must remain true when data,
          organizations, and external systems cross boundaries.
        </p>
      </div>
      <ol>
        {workingMethod.map((step, index) => (
          <li key={step.title}>
            <span>0{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
function Capabilities() {
  return (
    <section className="capabilities">
      <div>
        <span>Platform depth</span>
        <h2>
          Odoo is the deepest platform.
          <br />
          The engineering practice is broader.
        </h2>
      </div>
      <div className="capability-grid">
        <div>
          <small>Platform adaptation</small>
          <p>
            Odoo modules, ORM, OWL, QWeb, multi-company workflows, and
            operational reporting.
          </p>
        </div>
        <div>
          <small>Integration reliability</small>
          <p>
            REST APIs, Verified Payment Webhooks, transaction state, retries,
            and failure handling.
          </p>
        </div>
        <div>
          <small>Delivery environment</small>
          <p>
            Python, JavaScript, PostgreSQL, Linux, Docker, Bash, Git, and
            cross-functional implementation.
          </p>
        </div>
      </div>
    </section>
  );
}
function Contact() {
  return (
    <footer id="contact">
      <div className="contact-copy">
        <span>Next conversation</span>
        <h2>Need an engineer who can make complex operations legible?</h2>
        <p>
          I’m interested in Platform Engineer roles where platform knowledge,
          integration judgment, and operational clarity matter.
        </p>
      </div>
      <div className="contact-links">
        <a href="mailto:mendozajeromevrixen@gmail.com">
          <Mail /> Email Jerome <ArrowRight />
        </a>
        <a
          href="https://github.com/systemeror12"
          target="_blank"
          rel="noreferrer"
        >
          <Code /> View GitHub <ArrowRight />
        </a>
      </div>
      <div className="footer-line">
        <span>Jerome Mendoza / Platform Engineer</span>
        <InternalLink to="/#top">Return to top ↑</InternalLink>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <main id="top">
      <Header />
      <Hero />
      <Evidence />
      <Approach />
      <Capabilities />
      <Contact />
    </main>
  );
}

function App() {
  const [path, setPath] = React.useState(window.location.pathname);
  React.useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path === caseStudyPath ? (
    <>
      <Header currentPath={path} />
      <LeadCaseStudy />
    </>
  ) : path === aiCaseStudyPath ? (
    <>
      <Header currentPath={path} />
      <AiOdooRndCaseStudy />
    </>
  ) : (
    <Home />
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
