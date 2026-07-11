# Platform Engineering Portfolio

This portfolio presents Jerome Mendoza's engineering experience to engineering managers hiring for Platform Engineer roles in the Philippines.

## Language

**Hiring Manager**:
An engineering manager evaluating Jerome for a Platform Engineer role. This is the portfolio's primary audience.
_Avoid_: Visitor, user, recruiter

**Platform Engineer**:
Jerome's professional identity: an engineer who adapts platforms, integrations, infrastructure, and workflows to solve operational problems. Odoo is his deepest current platform experience, not the limit of the role.
_Avoid_: Odoo-only developer, generic full-stack developer

**Project Evidence**:
A work or personal project that demonstrates Jerome's engineering judgment, contribution, and results. A fork qualifies when Jerome's own changes, maintenance, or learning are stated clearly.
_Avoid_: Portfolio item, repository, showcase

**Anonymized Case Study**:
Project Evidence from professional work that explains the business problem, Jerome's responsibility, architecture, constraints, and verified result without revealing client identities, private code, credentials, internal screenshots, or identifying data.
_Avoid_: Client project, public source project

**Verified Result**:
An outcome Jerome can explain and defend in an interview. It uses exact measurements when available and otherwise states a concrete qualitative change without estimating or inventing impact.
_Avoid_: Estimated improvement, assumed impact, vanity metric

**Lead Case Study**:
The multi-company HRIS project, used as the portfolio's first and strongest piece of Project Evidence for cross-company reporting and operational visibility.
_Avoid_: Featured project, hero project

**Integration Case Study**:
The custom payment-provider integration, used as the second full piece of Project Evidence to demonstrate external APIs, transaction state, security, failure handling, and reliability across e-commerce and e-learning checkout.
_Avoid_: Payment feature, checkout project

**AI R&D Case Study**:
The successful AI-powered Odoo chatbot research-and-development project, used as the third full piece of Project Evidence to demonstrate feasibility testing, conversational workflows, external AI integration, privacy boundaries, and failure handling. It was not a production client deployment.
_Avoid_: Production chatbot, delivered client system, casual AI demo

**R&D Success**:
Completion of the company's agreed end-to-end chatbot scenarios in a working internal prototype, demonstrating that the intended Odoo integration was technically feasible.
_Avoid_: 100% accurate, production-ready, zero failures

**Odoo-Grounded Answer**:
A chatbot response grounded in relevant Odoo business records retrieved through a RAG pipeline using OpenAI embedding vectors, rather than generated from the user's question alone.
_Avoid_: AI answer, trained on Odoo data, direct database answer

**Access-Scoped Retrieval**:
Retrieval that applies the logged-in user's Odoo access rules before searching or supplying business records to the AI model, so an Odoo-Grounded Answer cannot use records that user is not permitted to access.
_Avoid_: UI-only permission check, unrestricted vector search

**Ungrounded Fallback**:
The chatbot response used when retrieval finds no sufficiently relevant authorized Odoo records; it states that supporting company information was not found and directs the user to HR or support rather than inventing an answer.
_Avoid_: Best-effort guess, unsupported company answer

**Unsupported Payment Provider**:
The client's required checkout provider, which lacked a native Odoo integration and therefore required a custom connector for e-commerce and e-learning transactions.
_Avoid_: Odoo payment configuration, built-in provider

**Regional Payment Provider**:
The public, anonymized name for the Unsupported Payment Provider. Its real name and relationship to the client remain confidential.
_Avoid_: The provider's actual brand, payment partner

**Payment Provider Module**:
A complete Odoo extension modeled on native payment-provider modules, adapted to the Regional Payment Provider's API, and exposed as an e-commerce checkout payment option.
_Avoid_: Payment API script, configured checkout option

**Payment Webhook**:
The server-to-server notification through which the Regional Payment Provider reported a transaction's final status to the Payment Provider Module.
_Avoid_: Browser redirect, payment polling

**Verified Payment Webhook**:
A Payment Webhook whose provider signature or HMAC has been validated using the configured shared secret before its transaction status is accepted.
_Avoid_: Trusted callback, unauthenticated notification

**Idempotent Payment Update**:
A transaction-state update that matches the provider reference to an existing Odoo transaction and safely ignores repeated Payment Webhooks without duplicating payment or fulfillment.
_Avoid_: Duplicate callback handling, repeated payment processing

**Payment Outcome**:
The pending, successful, failed, or cancelled provider result mapped into the corresponding Odoo transaction state while retaining the provider reference and an appropriate customer-facing result.
_Avoid_: Boolean payment status, generic API response

**Integration Outcome**:
Customers could pay through the client's required Regional Payment Provider directly within Odoo e-commerce and e-learning checkout, with authenticated and duplicate-safe transaction updates.
_Avoid_: Increased conversions, faster payments

**Excluded Project**:
The cancelled palletization system, which must not be presented as a delivered public case study or completed client outcome.
_Avoid_: Inventory case study, delivered palletization system

**Multi-Company HRIS**:
One shared Odoo deployment serving multiple legal companies, with common platform capabilities and company-specific employees, payroll rules, permissions, and reporting.
_Avoid_: Multiple Odoo instances, consolidated external dashboard

**HR Workflow**:
An HR operation automated by the Lead Case Study: custom payroll, custom attendance, custom recruitment, batch recruitment, leave management, or overtime requests.
_Avoid_: HR feature, manual process

**Lead Workflow**:
Custom Payroll, the most important HR Workflow in the Lead Case Study and the narrative used to explain its business rules, inputs, correctness, and cross-company complexity.
_Avoid_: Main feature, payroll module

**Philippine Payroll Rule**:
A client-approved salary rule created for Custom Payroll because the deployed Odoo Community setup lacked preconfigured Philippine payroll localization. The rules covered overtime, holiday and rest-day premiums, night-shift differential, late and absence deductions, leave effects, allowances, 13th-month pay, withholding tax, SSS, PhilHealth, and Pag-IBIG; the term does not imply that the portfolio independently certifies legal compliance.
_Avoid_: DOLE-compliant payroll, guaranteed legal compliance

**Payroll Input**:
An approved attendance, overtime, or leave record consumed by Custom Payroll. Company-specific Philippine Payroll Rules transform these records into traceable payslip calculations.
_Avoid_: Manually encoded payroll value, raw attendance record

**Payroll Validation**:
Verification of Custom Payroll using representative scenarios, comparison with HR's expected manual calculations, edge-case tests for holidays, overtime, and leave, and client acceptance before rollout.
_Avoid_: General QA, assumed correctness

**HRIS Outcome**:
The replacement of disconnected manual HR and payroll work with one approved flow from attendance, overtime, and leave through payslip calculation, while preserving company-specific rules and access boundaries.
_Avoid_: Unverified time savings, unverified error reduction

**Confidential Scale**:
The undisclosed number of companies and employees served by the Multi-Company HRIS. Public copy may say “multiple legal companies” but must not expose or estimate counts.
_Avoid_: Approximate company count, approximate employee count

**Case Study Contribution**:
Jerome designed and implemented most core HR workflows—including Attendance, Recruitment, and Payroll—and the dashboard within a broader client implementation delivered with a cross-functional team.
_Avoid_: Solely built the entire HRIS, merely assisted the team

**Upstream Work**:
Code and behavior inherited from the original source of a fork, rather than authored by Jerome.
_Avoid_: My work, project contribution
