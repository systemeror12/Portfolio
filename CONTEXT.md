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

**Public Sector HRIS Case Study**:
The fourth piece of Project Evidence: the Government Water District HRIS, led by attendance integrity and supported by self-service HR workflows. Distinct from the Multi-Company HRIS Lead Case Study.
_Avoid_: Featured project, government client system

**Government Water District**:
The anonymized public sector client name. The real name and its abbreviation stay confidential.
_Avoid_: The district's real name, real client identity

**Authoritative Punch Record**:
The single daily punch record per employee that reports, overtime, leave, and pass slips are read from, replacing separate legacy attendance layers.
_Avoid_: Raw biometric log, attendance summary sheet

**Attendance Correction**:
An approved, evidence-backed fix to a wrong or missing punch. Voiding restores previous effective values; corrections never recalculate overtime on their own.
_Avoid_: Manual punch edit, overtime recalculation

**Biometric Import**:
The workbook import that moves device punches into the attendance engine through a dedicated adapter module, including overnight shifts crossing midnight.
_Avoid_: Manual punch encoding, device sync

**Personnel Action Form**:
The module for personnel movements, with salary matrix and step selection computing the new wage automatically.
_Avoid_: Salary change ticket, promotion form

**Leave Monetization**:
The self-service request converting accrued leave credits to cash through an approval workflow.
_Avoid_: Leave cash-out, automatic payout

**My Dashboard**:
The HR-only dashboard view with a department breakdown widget, rewritten from AbstractModels to controllers with parallel KPI and chart loading.
_Avoid_: Employee dashboard, AbstractModels report

**Unified ISO Workflow**:
The shared workflow states that five ISO Management models (context, risk, EIA, HIRAC, OTP) were migrated onto, replacing per-model state machines with one auditable lifecycle plus regression tests.
_Avoid_: ISO compliance certification, generic task status

**Government Recruitment Workflow**:
The Public Sector HRIS recruitment path including PDS tab restructuring and the distinct Plantilla and Job Order appointment tracks with their own letters and state guards.
_Avoid_: Generic applicant tracking, HR hiring pipeline

**Project Maintainer**:
The developer who actively keeps a system working by resolving the issues QA raises against it. It describes ongoing responsibility, not the GitLab Maintainer role or sole authorship of every module.
_Avoid_: GitLab Maintainer, sole author, built every module

**Financial Brokerage**:
The anonymized client of the Brokerage ERP Rebuild. Its real name, its banks, and its counterparties stay confidential.
_Avoid_: The client's real name, bank names, counterparty names

**Brokerage ERP Rebuild**:
One piece of in-progress Project Evidence covering two systems: Jerome keeps the Financial Brokerage's live Odoo 10 ERP correct as its Project Maintainer while rebuilding it on Odoo 18 Community with two other developers. The Odoo 18 system is not yet live. Jerome's contribution is the work Jerome committed and merged: Fail-Closed Cutover, Report Parity, accounting correctness from QA tickets, and the delivery environment, plus fixes to the live Odoo 10 system.
_Avoid_: The client's or repositories' real names, Odoo 18 migration only, completed migration, built every module

**Fail-Closed Cutover**:
The Brokerage ERP Rebuild's migration from Odoo 10 to Odoo 18: data is extracted, transformed, loaded, and verified, and cutover stops whenever a check cannot run or the verifier finds a difference. Before go-live its result may be stated only as "a cutover rehearsal on a sample of deals reconciled to zero differences against Odoo 10", never with the deal count.
_Avoid_: Completed migration, data migrated, deal count, best-effort import

**Report Parity**:
Odoo 18 reports and printed documents that reproduce the Financial Brokerage's Odoo 10 formats, checked by comparing their content rather than their layout.
_Avoid_: Report redesign, pixel-identical reports

**Training Registration Platform**:
An in-development Odoo 16 platform through which a Training Organization's participants register for trainings, take pre-tests and evaluations, and pay at checkout. Jerome is its main developer. It is not an HRIS and not yet in production.
_Avoid_: The repository's internal codename, HRIS, event website, delivered client system

**Member Rate Eligibility**:
The Training Registration Platform's rule that only verified members of a member company register at the member rate. A disputed membership goes through a Membership Review Request and, if approved, Company Confirmation.
_Avoid_: Discount code, member pricing toggle

**Locked Registration Identity**:
A registration whose attendee details are locked to the signed-in portal account, verified by email without creating duplicate contacts, and stored with the participant's consent and signature.
_Avoid_: Free-text attendee form, guest checkout

**Training Organization**:
The anonymized client of the Training Registration Platform, kept generic: neither its real name nor its industry is stated.
_Avoid_: The client's real name or industry

**Upstream Work**:
Code and behavior inherited from the original source of a fork, rather than authored by Jerome.
_Avoid_: My work, project contribution

**Featured Personal System**:
Caelestia-Xenrya, Jerome's current daily desktop: three actively maintained forks of the Caelestia dotfiles (`caelestia-xenrya`), CLI (`caelestia-cli-xenrya`), and shell (`caelestia-shell-xenrya`), presented as one system and separately from the professional and R&D case studies. Its public presentation must distinguish Upstream Work from Jerome's own contributions.
_Avoid_: Original Caelestia project, three separate projects, professional case study, repository showcase

**Previous Desktop**:
The `dots-hyprland-xenrya` fork, Jerome's former daily desktop. It is no longer maintained or used daily, but its Personal System Contribution and the Upstream Contribution stay credited.
_Avoid_: Featured Personal System, actively maintained fork, daily desktop

**Fork Motivation**:
Why Jerome forked a desktop project. For the Previous Desktop: its upstream visual design, adapted to Jerome's own usability, performance, and workflow needs. For the Featured Personal System: Caelestia's shell is built entirely in Quickshell, which makes personal modifications easier to add and the desktop easier to use.
_Avoid_: Designed the original desktop, replaced the upstream project

**Personal System Contribution**:
Jerome's own work on a desktop fork, grouped into themes rather than presented as an undifferentiated commit feed. For the Previous Desktop: workspace and wallpaper state, launcher performance and correctness, and cross-process reliability.
_Avoid_: Fork activity, repository changes

**Upstream Contribution**:
Jerome's original per-workspace wallpaper feature contribution to `yurihikari/ml4w-lightcrimson-dotfiles`, later reworked and merged by the upstream maintainer with explicit public credit to `@systemeror12` as the original feature author.
_Avoid_: Maintained the upstream project, authored the maintainer's rework, unmerged contribution

**Tool I Use**:
An upstream application that is part of Jerome's active workflow but is not Project Evidence unless Jerome makes a demonstrable contribution. T3 Code, Claude Code, Codex, OpenCode, and Hermes Agent belong in this category and should link to their upstream projects.
_Avoid_: Active tech stack, my project, contributed fork

**Lingkod HR**:
Jerome's personal project currently in development in a private repository, with public Project Evidence limited to a high-level project description and its verified technology stack.
_Avoid_: Public source project, delivered client system, detailed technical case study

**After Hours**:
The homepage section for Jerome's personal Project Evidence (Lingkod HR, then the Featured Personal System) and Tools I Use, kept visibly separate from each other.
_Avoid_: Personal Projects, professional case studies

**In Progress**:
The homepage section, between the Work section and After Hours, for professional Project Evidence that is not yet live: the Brokerage ERP Rebuild first, then the Training Registration Platform. Each piece states what Jerome owns and the line it holds instead of a Verified Result.
_Avoid_: Case study, delivered systems, Work section pane
