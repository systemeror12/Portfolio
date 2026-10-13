import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  Code,
  Download,
  ExternalLink,
  Mail,
  Network,
} from "lucide-react";
// Load base.css before the page stylesheets so their rules override it.
import "./styles/base.css";
import "./styles/homepage.css";
import "./styles/hero.css";
import "./styles/work.css";
import "./styles/method.css";
import { AiOdooRndCaseStudy } from "./ai-odoo-rnd-case-study";
import { LeadCaseStudy } from "./lead-case-study";
import { PaymentProviderCaseStudy } from "./payment-provider-case-study";
import { DotsHyprlandCaseStudy } from "./dots-hyprland-case-study";
import { PublicSectorHrisCaseStudy } from "./public-sector-hris-case-study";
import { InternalLink } from "./navigation";
import {
  aiCaseStudyPath,
  caseStudyPath,
  dotsHyprlandCaseStudyPath,
  paymentProviderCaseStudyPath,
  publicSectorCaseStudyPath,
} from "./routes";
import { Header } from "./site-header";
import { Hero } from "./hero";
import { WorkSection } from "./work-section";
import { MethodSection } from "./method-section";

function PersonalProjects() {
  return (
    <section
      className="personal-projects"
      id="personal-projects"
      aria-labelledby="personal-projects-title"
    >
      <div className="personal-projects-heading">
        <span>Independent work</span>
        <h2 id="personal-projects-title">Personal Projects</h2>
      </div>
      <article aria-labelledby="lingkod-hr-title">
        <div>
          <span className="system-id">Personal project</span>
          <small>In development · Private project</small>
        </div>
        <div>
          <h3 id="lingkod-hr-title">Lingkod HR</h3>
          <p>
            A personal HR information system project for Philippine government
            agencies, focused on position management, personnel records, and
            recruitment workflows.
          </p>
          <div className="project-stack">
            <span id="lingkod-stack-label">Tech stack</span>
            <ul aria-labelledby="lingkod-stack-label">
              {["Next.js", "React", "NestJS", "PostgreSQL", "Prisma", "Docker"].map(
                (technology) => <li key={technology}>{technology}</li>,
              )}
            </ul>
          </div>
        </div>
      </article>
      <article aria-labelledby="dots-hyprland-title">
        <div>
          <span className="system-id">Personal system</span>
          <small>Actively maintained fork</small>
        </div>
        <div>
          <h3 id="dots-hyprland-title">dots-hyprland</h3>
          <p>
            A daily Hyprland desktop foundation whose upstream visual design I
            admire, extended with my own workspace state, launcher behavior,
            and cross-process reliability work.
          </p>
          <InternalLink className="case-link" to={dotsHyprlandCaseStudyPath}>
            Inspect the Personal System <ArrowRight />
          </InternalLink>
        </div>
      </article>
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

function ToolsIUse() {
  return (
    <section className="tools" aria-label="Tools I Use">
      <div className="tools-heading">
        <span>Tools I Use</span>
        <h2>Part of the working environment.</h2>
        <p>
          These upstream tools support the way I plan, investigate, and deliver
          work. They are included here as workflow context.
        </p>
      </div>
      <div className="tools-list">
        <article>
          <div>
            <small>Local AI workspace</small>
            <h3>Odysseus</h3>
          </div>
          <p>
            A self-hosted workspace I use to explore ideas and keep AI-assisted
            work close to my local development environment.
          </p>
          <a
            href="https://github.com/pewdiepie-archdaemon/odysseus"
            target="_blank"
            rel="noreferrer"
            aria-label="Open Odysseus upstream project"
          >
            Upstream project <ExternalLink />
          </a>
        </article>
        <article>
          <div>
            <small>Agent workspace</small>
            <h3>T3 Code</h3>
          </div>
          <p>
            A coding-agent workspace I use to keep implementation, review, and
            delivery conversations connected to the codebase.
          </p>
          <a
            href="https://github.com/pingdotgg/t3code"
            target="_blank"
            rel="noreferrer"
            aria-label="Open T3 Code upstream project"
          >
            Upstream project <ExternalLink />
          </a>
        </article>
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
          <Code /> View GitHub profile <ArrowRight />
        </a>
        <a
          href="https://www.linkedin.com/in/jerome-vrixen-mendoza-59b927293/"
          target="_blank"
          rel="noreferrer"
        >
          <Network /> View LinkedIn profile <ArrowRight />
        </a>
        <a href="/jerome-mendoza-resume.pdf" download>
          <Download /> Download web-safe resume <ArrowRight />
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
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <WorkSection />
        <PersonalProjects />
        <MethodSection />
        <Capabilities />
        <ToolsIUse />
        <Contact />
      </main>
    </>
  );
}

function App() {
  const [path, setPath] = React.useState(window.location.pathname);
  React.useEffect(() => {
    const update = () => setPath(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const page = path === caseStudyPath ? (
    <>
      <Header currentPath={path} />
      <LeadCaseStudy />
    </>
  ) : path === aiCaseStudyPath ? (
    <>
      <Header currentPath={path} />
      <AiOdooRndCaseStudy />
    </>
  ) : path === paymentProviderCaseStudyPath ? (
    <>
      <Header currentPath={path} />
      <PaymentProviderCaseStudy />
    </>
  ) : path === publicSectorCaseStudyPath ? (
    <>
      <Header currentPath={path} />
      <PublicSectorHrisCaseStudy />
    </>
  ) : path === dotsHyprlandCaseStudyPath ? (
    <>
      <Header currentPath={path} />
      <DotsHyprlandCaseStudy />
    </>
  ) : (
    <Home />
  );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {page}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
