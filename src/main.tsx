import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArrowDownRight, ArrowRight, Check, Code, Layers3, LockKeyhole, Mail, Menu, Network, X } from 'lucide-react'
import './styles.css'

const evidence = [
  {
    key: 'lead',
    type: 'Lead Case Study',
    title: 'Multi-company HRIS',
    summary: 'One shared Odoo deployment replaced disconnected HR and payroll work with an approved flow from attendance, overtime, and leave through payslip calculation.',
    contribution: 'Designed and implemented most core HR workflows—including Attendance, Recruitment, and Payroll—and the dashboard within a broader cross-functional delivery.',
    signals: ['Company-specific rules', 'Access boundaries', 'Payroll Validation'],
  },
  {
    key: 'integration',
    type: 'Integration Case Study',
    title: 'Regional payment integration',
    summary: 'A complete Payment Provider Module brought the client-required Regional Payment Provider into Odoo e-commerce and e-learning checkout.',
    contribution: 'Mapped Payment Outcomes into Odoo transaction state, validated provider signatures, retained provider references, and made repeated webhooks safe.',
    signals: ['Verified webhooks', 'Idempotent updates', 'Failure states'],
  },
  {
    key: 'research',
    type: 'AI R&D Case Study',
    title: 'Access-scoped Odoo answers',
    summary: 'A working internal prototype demonstrated that the company’s agreed conversational scenarios were technically feasible inside Odoo.',
    contribution: 'Explored retrieval grounded in authorized business records, privacy boundaries, conversational workflows, and an Ungrounded Fallback.',
    signals: ['Internal R&D', 'Access-scoped retrieval', 'Grounded responses'],
  },
]

function Header() {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  return <header className="site-header">
    <a className="identity" href="#top" aria-label="Jerome Mendoza, home"><span>JM</span><strong>Jerome Mendoza</strong></a>
    <nav className={open ? 'open' : ''} aria-label="Primary navigation">
      <a href="#evidence" onClick={() => setOpen(false)}>Evidence</a>
      <a href="#approach" onClick={() => setOpen(false)}>Approach</a>
      <a href="#contact" onClick={() => setOpen(false)}>Contact</a>
    </nav>
    <button className="menu-button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X/> : <Menu/>}</button>
  </header>
}

function Topology() {
  return <figure className="topology" aria-labelledby="topology-title">
    <figcaption className="topology-header"><span id="topology-title"><Network/> Reconstructed system map / HRIS</span><span>Boundaries visible</span></figcaption>
    <div className="topology-canvas">
      <div className="topology-node company company-a"><small>Legal company</small><strong>Company A</strong><span>rules · access</span></div>
      <div className="topology-node company company-b"><small>Legal company</small><strong>Company B</strong><span>rules · access</span></div>
      <div className="topology-node core"><Layers3/><small>Shared platform</small><strong>HR operations</strong><span>attendance · leave · payroll</span></div>
      <div className="topology-node result"><Check/><small>Verified result</small><strong>Traceable payslips</strong></div>
      <svg viewBox="0 0 680 390" preserveAspectRatio="none" aria-hidden="true"><path d="M135 88 C270 88 242 195 340 195"/><path d="M135 302 C270 302 242 195 340 195"/><path d="M440 195 C505 195 516 195 575 195"/></svg>
    </div>
    <div className="topology-note"><LockKeyhole/> Sanitized architecture · no client identity, data, or scale shown</div>
  </figure>
}

function Hero() {
  return <section className="hero">
    <div className="hero-copy"><span className="eyebrow">Platform Engineer / Philippines</span><h1>Order for systems<br/>that cannot stop.</h1><p>I adapt platforms, integrations, and workflows—making their rules, state, and boundaries clear enough to trust.</p><div className="hero-actions"><a className="primary-action" href="#evidence">Explore system evidence <ArrowRight/></a><a href="#contact">Discuss a role</a></div></div>
    <Topology/>
  </section>
}

function Evidence() {
  return <section className="evidence" id="evidence">
    <div className="section-heading"><div><span>Selected Project Evidence</span><h2>Systems in operating context.</h2></div><p>Each case explains the operation, my responsibility, the architecture, its boundaries, and a result I can defend in an interview.</p></div>
    <div className="evidence-list">{evidence.map((item, index) => <article key={item.key}>
      <div className="case-id"><span>SYS / 0{index + 1}</span><small>{item.type}</small></div>
      <div className="case-main"><h3>{item.title}</h3><p>{item.summary}</p></div>
      <div className="case-detail"><span>Contribution</span><p>{item.contribution}</p><ul>{item.signals.map(signal => <li key={signal}>{signal}</li>)}</ul></div>
      <ArrowDownRight className="case-arrow"/>
    </article>)}</div>
  </section>
}

function Approach() {
  const steps = [
    ['Trace the operation', 'Start with the people, records, approvals, and outcomes the system must support.'],
    ['Define the boundaries', 'Make permissions, company rules, external ownership, and confidentiality explicit.'],
    ['Design the failure path', 'Treat retries, invalid state, missing context, and customer-facing outcomes as first-class behavior.'],
    ['Validate the result', 'Compare the implemented flow with representative scenarios and the operation’s expected outcome.'],
  ]
  return <section className="approach" id="approach"><div className="approach-intro"><span>Working method</span><h2>Reliability starts before the code.</h2><p>My platform work connects technical behavior to the operation it serves. That means understanding what must remain true when data, organizations, and external systems cross boundaries.</p></div><ol>{steps.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></section>
}

function Capabilities() {
  return <section className="capabilities"><div><span>Platform depth</span><h2>Odoo is the deepest platform.<br/>The engineering practice is broader.</h2></div><div className="capability-grid"><div><small>Platform adaptation</small><p>Odoo modules, ORM, OWL, QWeb, multi-company workflows, and operational reporting.</p></div><div><small>Integration reliability</small><p>REST APIs, authenticated callbacks, transaction state, retries, and failure handling.</p></div><div><small>Delivery environment</small><p>Python, JavaScript, PostgreSQL, Linux, Docker, Bash, Git, and cross-functional implementation.</p></div></div></section>
}

function Contact() {
  return <footer id="contact"><div className="contact-copy"><span>Next conversation</span><h2>Need an engineer who can make complex operations legible?</h2><p>I’m interested in Platform Engineer roles where platform knowledge, integration judgment, and operational clarity matter.</p></div><div className="contact-links"><a href="mailto:mendozajeromevrixen@gmail.com"><Mail/> Email Jerome <ArrowRight/></a><a href="https://github.com/systemeror12" target="_blank" rel="noreferrer"><Code/> View GitHub <ArrowRight/></a></div><div className="footer-line"><span>Jerome Mendoza / Platform Engineer</span><a href="#top">Return to top ↑</a></div></footer>
}

function App() { return <main id="top"><Header/><Hero/><Evidence/><Approach/><Capabilities/><Contact/></main> }

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
