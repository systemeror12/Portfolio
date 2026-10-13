import React from "react";
import ReactDOM from "react-dom/client";
import {
  ArrowRight,
  Code,
  Download,
  Mail,
  Network,
} from "lucide-react";
// Load base.css before the page stylesheets so their rules override it.
import "./styles/base.css";
import "./styles/homepage.css";
import "./styles/hero.css";
import "./styles/work.css";
import "./styles/after-hours.css";
import { workingMethod } from "./content";
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
import { AfterHoursSection } from "./after-hours-section";

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
        <AfterHoursSection />
        <Approach />
        <Capabilities />
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
