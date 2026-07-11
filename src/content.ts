export type ProjectEvidence = {
  key: string
  type: string
  title: string
  problem: string
  contribution: string
  architecture: string
  boundary: string
  result: string
  signals: string[]
}

export const projectEvidence: ProjectEvidence[] = [
  { key:'lead', type:'Lead Case Study', title:'Multi-Company HRIS', problem:'Multiple legal companies needed one approved flow instead of disconnected manual HR and payroll work.', contribution:'Designed and implemented most core HR workflows—including Attendance, Recruitment, and Payroll—and the dashboard within a broader cross-functional delivery.', architecture:'One shared Odoo deployment connected approved attendance, overtime, and leave records to Custom Payroll and traceable payslip calculations.', boundary:'Company-specific permissions and Philippine Payroll Rules remained separated within the shared platform.', result:'Disconnected manual HR and payroll work was replaced by one approved attendance, overtime, and leave-to-payslip flow while preserving company-specific rules and access boundaries. Payroll Validation used representative scenarios, manual-calculation comparisons, edge-case tests, and client acceptance before rollout.', signals:['Philippine Payroll Rules','Payroll Input','Payroll Validation'] },
  { key:'integration', type:'Integration Case Study', title:'Payment Provider Module', problem:'The client-required Regional Payment Provider had no native Odoo integration for e-commerce or e-learning checkout.', contribution:'Built a complete Odoo extension modeled on native provider modules, including checkout behavior and transaction-state mapping.', architecture:'A Verified Payment Webhook matched the provider reference to an Odoo transaction before applying an Idempotent Payment Update.', boundary:'The provider signature or HMAC had to validate before any Payment Outcome was accepted; repeated webhooks could not duplicate fulfillment.', result:'Customers could use the required provider directly in Odoo checkout with authenticated, duplicate-safe transaction updates.', signals:['Verified Payment Webhook','Idempotent Payment Update','Payment Outcome'] },
  { key:'research', type:'AI R&D Case Study', title:'Access-Scoped Retrieval', problem:'The company needed to test whether conversational Odoo workflows could answer from relevant business records without crossing access boundaries.', contribution:'Explored retrieval, conversational workflows, privacy boundaries, external AI integration, and failure handling in a working internal prototype.', architecture:'A RAG pipeline used OpenAI embedding vectors to retrieve relevant records and supply an Odoo-Grounded Answer.', boundary:'Odoo access rules applied before retrieval; when authorized supporting records were absent, the flow returned an Ungrounded Fallback.', result:'The prototype completed the agreed end-to-end chatbot scenarios, establishing R&D Success—not a production client deployment.', signals:['Odoo-Grounded Answer','Access-Scoped Retrieval','Ungrounded Fallback'] },
]

export const workingMethod = [
  { title:'Trace the operation', description:'Start with the people, records, approvals, and outcomes the system must support.' },
  { title:'Define the boundaries', description:'Make permissions, company rules, external ownership, and confidentiality explicit.' },
  { title:'Design the failure path', description:'Treat retries, invalid state, missing context, and customer-facing outcomes as first-class behavior.' },
  { title:'Validate the result', description:'Compare the implemented flow with representative scenarios and the operation’s expected outcome.' },
]
