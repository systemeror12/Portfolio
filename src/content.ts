import {
  aiCaseStudyPath,
  brokerageErpRebuildCaseStudyPath,
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
  // Who the system served, named under the rose window as its pane lights.
  served: string;
  // The records the case carries, written around the rim of its pane.
  records: string;
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
  servedBy: "for",
};

export const workCases: WorkCase[] = [
  {
    id: "multi-company-hris",
    numeral: "I",
    kind: "Lead case study",
    title: "Multi-Company HRIS",
    for: "for HR and payroll teams at multiple legal companies, now sharing one platform",
    served: "HR and payroll teams",
    records: "attendance · overtime · leave · payroll rules",
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
    served: "customers at checkout",
    records: "checkout · webhook · signature · one charge",
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
    served: "employees asking questions",
    records: "question · access rules · records · answer",
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
    served: "the water district's staff",
    records: "punch · import · correction · one record",
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

export type InProgressPiece = {
  id: string;
  status: string;
  title: string;
  for: string;
  role: string;
  owns: string;
  holds: string;
  keyIdeas: string[];
  path?: string;
};

export const inProgress = {
  heading: "In progress.",
  intro:
    "Two systems I'm working on now. Neither is live yet, so instead of a result, each shows what I own and the line it holds.",
  labels: {
    role: "Role",
    owns: "What I own",
    holds: "The line it holds",
    keyIdeas: "Key ideas",
    readMore: "Read the full case study",
  },
};

export const inProgressPieces: InProgressPiece[] = [
  {
    id: "brokerage-erp-rebuild",
    status: "Odoo 10 live, maintained by me · Odoo 18 rebuild in development",
    title: "Brokerage ERP Rebuild",
    for: "for a financial brokerage's accounting team, whose books have to balance before and after the move",
    role: "Project Maintainer, with two other developers",
    owns: "The Odoo 10 → 18 cutover, report parity with the Odoo 10 prints, accounting fixes from QA, and the test and dev setup. I also keep the live Odoo 10 system correct while we rebuild it.",
    holds:
      "Cutover stops if a check can't run or an amount differs. A cutover rehearsal on a sample of deals reconciled to zero differences against Odoo 10.",
    keyIdeas: ["Fail-Closed Cutover", "Report Parity"],
    path: brokerageErpRebuildCaseStudyPath,
  },
  {
    id: "training-registration-platform",
    status: "In development",
    title: "Training Registration Platform",
    for: "for people registering for a training organization's courses",
    role: "Main developer since 2024",
    owns: "Member-rate eligibility and membership review, registration identity locked to the signed-in account, training agreements and evaluations, and browser tests for the flows.",
    holds:
      "A non-member can't register at the member rate. A disputed membership goes to review before it counts.",
    keyIdeas: ["Member Rate Eligibility", "Locked Registration Identity"],
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
  lede: "A punch at the gate. An overtime request. A payment webhook at 25:00. Somewhere down the line, someone gets paid, or doesn't. I build and maintain the HR, payroll, payment, and accounting systems that make sure they do.",
  workAction: "See the work",
  emailAction: "Email me",
  email: "mendozajeromevrixen@gmail.com",
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
    // Claude Code, Codex, and OpenCode share a plaque, because one line
    // describes all three.
    plaques: [
      {
        tools: [
          { name: "T3 Code", href: "https://github.com/pingdotgg/t3code" },
        ],
        description:
          "The workspace where my agent threads, worktrees, and pull requests live.",
      },
      {
        tools: [
          {
            name: "Claude Code",
            href: "https://github.com/anthropics/claude-code",
          },
          { name: "Codex", href: "https://github.com/openai/codex" },
          { name: "OpenCode", href: "https://github.com/anomalyco/opencode" },
        ],
        description: "The coding agents I run inside it, picked per task.",
      },
      {
        tools: [
          {
            name: "Hermes Agent",
            href: "https://github.com/NousResearch/hermes-agent",
          },
        ],
        description:
          "My personal assistant: it flags emails that need a reply and summarizes issues once they're finished.",
      },
    ],
  },
};

export const contact = {
  heading: "If people depend on what you're building, I'd like to help.",
  body: "I'm looking for platform engineering roles in the Philippines, where integration judgment and getting the details right matter.",
  email: hero.email,
  links: [
    { label: "GitHub", href: "https://github.com/systemeror12" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/jerome-vrixen-mendoza-59b927293/",
    },
  ],
  resume: { label: "Resume (PDF)", href: "/jerome-mendoza-resume.pdf" },
  footer: { name: "Jerome Mendoza", line: "Made at 25:00, Manila" },
};

// The platform-depth claims no case study makes, carried over from the old
// Capabilities section.
export const methodDepth = {
  lead: "Odoo is my deepest platform. The engineering practice is broader.",
  detail:
    "Inside Odoo, that means its ORM and OWL. Around it, Linux, Docker, Bash, and Git.",
};
