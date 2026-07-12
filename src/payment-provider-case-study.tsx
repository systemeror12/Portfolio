import { ArrowLeft, ArrowRight, LockKeyhole } from "lucide-react";
import { InternalLink } from "./navigation";

const paymentProviderCaseStudy = {
  eyebrow: "Integration Case Study / Sanitized Project Evidence",
  title: "Payment Provider Module",
  summary:
    "A complete Odoo payment-provider extension that made a client-required Regional Payment Provider available in e-commerce and e-learning checkout, with verified and duplicate-safe transaction updates.",
  focus: "Integration reliability",
  evidenceBoundary: "Regional provider; no client, code, or credentials",
  problem: {
    label: "Problem and constraints",
    title: "Make an unsupported checkout provider dependable.",
    description:
      "The client required a Regional Payment Provider that had no native Odoo integration for e-commerce or e-learning checkout. The connector had to fit Odoo's payment lifecycle while accepting that final payment status arrives from an external system and its server-to-server notification can be repeated.",
  },
  contribution: {
    label: "Jerome's responsibility",
    title: "Build the payment-provider extension from checkout to state mapping.",
    description:
      "Jerome built the Payment Provider Module as a complete Odoo extension, modeled on native provider modules and adapted to the Regional Payment Provider's API. The work included checkout behavior, transaction-reference matching, verified webhook handling, and mapping provider results into Odoo transaction states.",
  },
  decisions: {
    label: "Engineering decisions",
    title: "Treat the webhook as an untrusted repeated message.",
    items: [
      "Expose the Regional Payment Provider through an Odoo payment-provider module instead of treating checkout as a separate API script.",
      "Validate the provider signature or HMAC before accepting a Verified Payment Webhook, so an unauthenticated notification cannot change a transaction.",
      "Match the provider reference to an existing Odoo transaction, then apply an Idempotent Payment Update that safely ignores repeated webhook delivery without duplicating payment or fulfillment.",
    ],
  },
  validation: {
    label: "Validation and failure handling",
    title: "A payment result is only accepted after verification.",
    description:
      "The Payment Provider Module handled the provider's externally observable outcomes: pending, successful, failed, and cancelled. It retained the provider reference, mapped each accepted result to the corresponding Odoo transaction state, and produced an appropriate customer-facing result. Invalid signatures and unmatched references did not become accepted payment updates; repeated delivery remained safe.",
  },
  outcome: {
    label: "Integration Outcome",
    title: "Required checkout with authenticated, duplicate-safe updates.",
    description:
      "Integration Outcome: customers could pay through the client's required Regional Payment Provider directly within Odoo e-commerce and e-learning checkout, with authenticated and duplicate-safe transaction updates. The case states the delivered checkout capability without estimating commercial impact or system speed.",
  },
  technologies: ["Odoo", "Python", "PostgreSQL", "REST API", "HMAC"],
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

function PaymentFlow() {
  return (
    <figure
      className="case-study-flow payment-flow"
      aria-labelledby="payment-flow-title"
      aria-describedby="payment-flow-description"
    >
      <figcaption>
        <span id="payment-flow-title">Reconstructed payment flow</span>
        <p id="payment-flow-description">
          The Regional Payment Provider reports an outcome to the Payment
          Provider Module. A Verified Payment Webhook is matched to its Odoo
          transaction before an Idempotent Payment Update records the Payment
          Outcomes.
        </p>
      </figcaption>
      <div className="flow-lane payment-flow-lane">
        <div>
          <small>External checkout option</small>
          <strong>Regional Payment Provider</strong>
          <p>Selected through Odoo checkout.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Odoo extension</small>
          <strong>Payment Provider Module</strong>
          <p>Creates and tracks the transaction.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Authenticated notification</small>
          <strong>Verified Payment Webhook</strong>
          <p>Validate the signature or HMAC first.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Duplicate-safe state change</small>
          <strong>Idempotent Payment Update</strong>
          <p>Match the reference and safely ignore repeats.</p>
        </div>
        <ArrowRight />
        <div>
          <small>Customer-visible state</small>
          <strong>Payment Outcomes</strong>
          <p>Pending, successful, failed, or cancelled.</p>
        </div>
      </div>
      <div className="flow-note">
        <LockKeyhole /> Sanitized reconstruction; no provider brand, client
        identity, private code, or credentials are shown.
      </div>
    </figure>
  );
}

export function PaymentProviderCaseStudy() {
  return (
    <>
      <main className="case-study">
        <section className="case-hero">
          <div>
            <span className="eyebrow">{paymentProviderCaseStudy.eyebrow}</span>
            <h1>{paymentProviderCaseStudy.title}</h1>
            <p>{paymentProviderCaseStudy.summary}</p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>Focus</span>
            <strong>{paymentProviderCaseStudy.focus}</strong>
            <span>Evidence boundary</span>
            <strong>{paymentProviderCaseStudy.evidenceBoundary}</strong>
          </div>
        </section>
        <NarrativeSection
          section={paymentProviderCaseStudy.problem}
          className="case-problem"
        />
        <NarrativeSection
          section={paymentProviderCaseStudy.contribution}
          className="contribution"
        />
        <PaymentFlow />
        <section className="case-section decisions">
          <span className="section-label">
            {paymentProviderCaseStudy.decisions.label}
          </span>
          <div>
            <h2>{paymentProviderCaseStudy.decisions.title}</h2>
            <ul>
              {paymentProviderCaseStudy.decisions.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>
        <NarrativeSection
          section={paymentProviderCaseStudy.validation}
          className="validation"
        />
        <NarrativeSection
          section={paymentProviderCaseStudy.outcome}
          className="outcome"
        />
        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            {paymentProviderCaseStudy.technologies.map((technology) => (
              <li key={technology}>{technology}</li>
            ))}
          </ul>
        </section>
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>Payment Provider Module / Sanitized Project Evidence</span>
      </footer>
    </>
  );
}
