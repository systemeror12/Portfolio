import {
  aiCaseStudyPath,
  caseStudyPath,
  paymentProviderCaseStudyPath,
  publicSectorCaseStudyPath,
} from "./routes";

export type WorkCase = {
  id: string;
  numeral: string;
  kind: string;
  title: string;
  for: string;
  note?: string;
  problem: string;
  built: string;
  fits: string;
  holds: string;
  changed: string;
  keyIdeas: string[];
  path: string;
};

export const work = {
  heading: "Four systems, and who they were for.",
  intro:
    "One window, four panes. As you read, each one lights for the people it was built for. Most of it was built with a team, so I've said which parts were mine. Client names stay private.",
  labels: {
    built: "What I built",
    fits: "How it fits",
    holds: "The line it holds",
    changed: "What changed",
    keyIdeas: "Key ideas",
  },
  readMore: "Read the full case study",
};

export const workCases: WorkCase[] = [
  {
    id: "multi-company-hris",
    numeral: "I",
    kind: "Lead case study",
    title: "Multi-Company HRIS",
    for: "for HR and payroll teams at multiple legal companies, now sharing one platform",
    problem:
      "Several legal companies were running HR and payroll by hand, in disconnected pieces. They needed one approved flow.",
    built:
      "Most of the core HR workflows, including Attendance, Recruitment, and Payroll, plus the dashboard, as part of a larger cross-functional delivery.",
    fits: "One shared Odoo deployment feeds approved attendance, overtime, and leave into Custom Payroll, where every payslip calculation can be traced back.",
    holds:
      "Each company keeps its own permissions and Philippine Payroll Rules, even on the shared platform.",
    changed:
      "Manual HR and payroll work became one approved path from attendance to payslip, checked before rollout against representative scenarios, HR's manual calculations, edge cases, and client acceptance.",
    keyIdeas: [
      "Philippine Payroll Rules",
      "Payroll Input",
      "Payroll Validation",
    ],
    path: caseStudyPath,
  },
  {
    id: "payment-provider",
    numeral: "II",
    kind: "Integration case study",
    title: "Payment Provider Module",
    for: "for customers at checkout, who should only ever be charged once",
    problem:
      "The client's required regional payment provider had no Odoo integration, for either e-commerce or e-learning checkout.",
    built:
      "A complete Odoo extension modeled on the native provider modules, including checkout behavior and transaction-state mapping.",
    fits: "A verified webhook matches the provider's reference to an Odoo transaction before applying an idempotent update.",
    holds:
      "No payment outcome is accepted until the signature checks out. A webhook that arrives twice can't fulfill an order twice.",
    changed:
      "Customers pay with the required provider directly in Odoo e-commerce and e-learning checkout, with authenticated, duplicate-safe transaction updates.",
    keyIdeas: [
      "Verified Payment Webhook",
      "Idempotent Payment Update",
      "Payment Outcome",
    ],
    path: paymentProviderCaseStudyPath,
  },
  {
    id: "ai-odoo-rnd",
    numeral: "III",
    kind: "AI research and development",
    title: "Access-Scoped Retrieval",
    for: "for employees asking questions, who should only see what they're allowed to",
    note: "An internal prototype. It proved the idea works. It was never a production deployment.",
    problem:
      "Could a chatbot answer from real Odoo business records without crossing anyone's access boundaries? The company wanted to find out.",
    built:
      "A working internal prototype covering retrieval, conversational flows, privacy boundaries, external AI integration, and failure handling.",
    fits: "A RAG pipeline uses OpenAI embedding vectors to find relevant records, then grounds the answer in them.",
    holds:
      "Odoo access rules apply before retrieval. If no authorized record supports an answer, it says so and points to HR instead of guessing.",
    changed:
      "The prototype completed every agreed end-to-end chatbot scenario: an R&D success, not a client launch.",
    keyIdeas: [
      "Odoo-Grounded Answer",
      "Access-Scoped Retrieval",
      "Ungrounded Fallback",
    ],
    path: aiCaseStudyPath,
  },
  {
    id: "public-sector-hris",
    numeral: "IV",
    kind: "Public sector case study",
    title: "Government Water District HRIS",
    for: "for the staff whose leave, overtime, and pass slips all hang on one punch",
    problem:
      "A government water district couldn't fully trust its device punches, and its reports, overtime, leave, and pass slips all depended on them.",
    built:
      "The attendance engine, overtime requests, Biometric Import, Personnel Action Form, and Leave Monetization, plus extensions to My Dashboard and recruitment. The largest contributor on a five-person team, over roughly three months.",
    fits: "One evaluation path resolves each attendance day into a single Authoritative Punch Record, fed by Biometric Import, including overnight shifts.",
    holds:
      "Corrections need approval and evidence. Voiding one restores the previous values, and a correction never recalculates overtime on its own.",
    changed:
      "Auditable attendance, overtime derived from validated punches, and self-service Personnel Action Form and Leave Monetization requests with approval routing.",
    keyIdeas: [
      "Authoritative Punch Record",
      "Attendance Correction",
      "Biometric Import",
      "Unified ISO Workflow",
    ],
    path: publicSectorCaseStudyPath,
  },
];

export const method = {
  heading: "How I start on a system I've never seen.",
  intro:
    "Four notes, always in this order: find out what has to stay true when data crosses from one team, company, or system to the next.",
};

export const methodSteps = [
  {
    number: "one",
    title: "Trace the operation",
    description:
      "Start with the people, records, approvals, and outcomes the system has to support.",
  },
  {
    number: "two",
    title: "Define the boundaries",
    description:
      "Make permissions, company rules, external ownership, and confidentiality explicit.",
  },
  {
    number: "three",
    title: "Design the failure path",
    description:
      "Treat retries, invalid state, missing context, and what the customer sees as real behavior.",
  },
  {
    number: "four",
    title: "Validate the result",
    description:
      "Check the finished flow against representative scenarios and what the operation expects.",
  },
];

export const hero = {
  name: "Jerome Mendoza",
  role: "platform engineer in the Philippines",
  title: "Every record ends with",
  titleEmphasis: "a\u00a0person.",
  lede: "A punch at the gate. An overtime request. A payment webhook at 25:00. Somewhere down the line, someone gets paid, or doesn't. I build the HR, payroll, and payment systems that make sure they do.",
  workAction: "See the work",
  emailAction: "Email me",
  email: "mendozajeromevrixen@gmail.com",
  heartLabel: "someone, paid right",
};

export const afterHours = {
  heading: "After hours.",
  intro:
    "What I build when nobody's asked me to. One is still taking shape. The other is the desktop I'm typing this on.",
  lingkod: {
    status: "In development, private repository",
    title: "Lingkod HR",
    description:
      "An HR information system for Philippine government agencies, focused on position management, personnel records, and recruitment.",
    stackLabel: "Tech stack",
    stack: ["Next.js", "React", "NestJS", "PostgreSQL", "Prisma", "Docker"],
  },
  dots: {
    status: "Actively maintained fork",
    title: "dots-hyprland",
    description:
      "The Hyprland desktop I work in every day. I forked it because I loved how it looked, then kept going where it didn't fit how I work.",
    upstream: {
      heading: "From upstream",
      body: "The visual design. It's the reason I forked it, and it isn't mine.",
    },
    mine: {
      heading: "Mine",
      body: "Workspace and wallpaper state, launcher speed and correctness, and reliability across processes.",
    },
    // Every second piece is code: the repository, then the handle.
    credit: [
      "Upstream contribution: my per-workspace wallpaper feature was reworked and merged into ",
      "ml4w-lightcrimson-dotfiles",
      ", crediting ",
      "@systemeror12",
      " as its original author.",
    ],
    readMore: "Read about the fork",
  },
  tools: {
    heading: "Tools I use",
    label: "Tools I Use",
    intro: "Not my projects. Just always open.",
    items: [
      {
        name: "Odysseus",
        description:
          "A self-hosted AI workspace for exploring ideas close to my local environment.",
        href: "https://github.com/pewdiepie-archdaemon/odysseus",
      },
      {
        name: "T3 Code",
        description:
          "A coding-agent workspace that keeps implementation and review next to the code.",
        href: "https://github.com/pingdotgg/t3code",
      },
    ],
  },
};
