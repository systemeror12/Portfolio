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
import { drawNightSky } from "./night-sky";

// Mounts the night sky behind the page; the scene owns the layer's contents.
function NightSky() {
  const layer = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => drawNightSky(layer.current!), []);
  return <div ref={layer} className="night-sky" aria-hidden="true" />;
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
  // A new page brings new text, so the sky is drawn afresh for it.
  return (
    <>
      <NightSky key={path} />
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
