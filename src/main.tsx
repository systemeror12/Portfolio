import React from "react";
import ReactDOM from "react-dom/client";
// Load base.css before the page stylesheets so their rules override it.
import "./styles/base.css";
import "./styles/homepage.css";
import "./styles/hero.css";
import "./styles/work.css";
import "./styles/after-hours.css";
import "./styles/method.css";
import "./styles/contact.css";
import { AiOdooRndCaseStudy } from "./ai-odoo-rnd-case-study";
import { LeadCaseStudy } from "./lead-case-study";
import { PaymentProviderCaseStudy } from "./payment-provider-case-study";
import { DotsHyprlandCaseStudy } from "./dots-hyprland-case-study";
import { PublicSectorHrisCaseStudy } from "./public-sector-hris-case-study";
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
import { MethodSection } from "./method-section";
import { ContactSection, SiteFooter } from "./contact-section";

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

function Home() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <WorkSection />
        <AfterHoursSection />
        <MethodSection />
        <Capabilities />
        <ContactSection />
      </main>
      <SiteFooter />
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
