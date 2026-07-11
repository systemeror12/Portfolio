import React from 'react'
import ReactDOM from 'react-dom/client'
import { ArrowDownRight, ArrowLeft, ArrowRight, Check, Code, Layers3, LockKeyhole, Mail, Menu, Network, ShieldCheck, X } from 'lucide-react'
import { projectEvidence, workingMethod } from './content'
import './styles.css'
import './production.css'

const caseStudyPath = '/work/multi-company-hris'

function navigate(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function InternalLink({ to, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  return <a href={to} {...props} onClick={event => {
    props.onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
    const target = to.split('#')[1]
    if (target) requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView())
    else window.scrollTo(0, 0)
  }}>{children}</a>
}

function Header({ isCaseStudy = false }: { isCaseStudy?: boolean }) {
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  const closeMenu = () => setOpen(false)

  return <header className="site-header">
    <InternalLink className="identity" to="/" aria-label="Jerome Mendoza, home"><span>JM</span><strong>Jerome Mendoza</strong></InternalLink>
    <nav className={open ? 'open' : ''} aria-label="Primary navigation">
      <InternalLink to="/" aria-current={!isCaseStudy ? 'page' : undefined} onClick={closeMenu}>Home</InternalLink>
      <InternalLink to={caseStudyPath} aria-current={isCaseStudy ? 'page' : undefined} onClick={closeMenu}>Case study</InternalLink>
      {!isCaseStudy && <><InternalLink to="/#approach" onClick={closeMenu}>Approach</InternalLink><InternalLink to="/#contact" onClick={closeMenu}>Contact</InternalLink></>}
    </nav>
    <button className="menu-button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? <X/> : <Menu/>}</button>
  </header>
}

function Topology() {
  return <figure className="topology" aria-labelledby="topology-title">
    <figcaption className="topology-header"><span id="topology-title"><Network/> Reconstructed system map / HRIS</span><span>Boundaries visible</span></figcaption>
    <div className="topology-canvas"><div className="topology-node company company-a"><small>Legal company</small><strong>Company A</strong><span>rules · access</span></div><div className="topology-node company company-b"><small>Legal company</small><strong>Company B</strong><span>rules · access</span></div><div className="topology-node core"><Layers3/><small>Shared platform</small><strong>HR operations</strong><span>attendance · leave · payroll</span></div><div className="topology-node result"><Check/><small>Verified result</small><strong>Traceable payslips</strong></div><svg viewBox="0 0 680 390" preserveAspectRatio="none" aria-hidden="true"><path d="M135 88 C270 88 242 195 340 195"/><path d="M135 302 C270 302 242 195 340 195"/><path d="M440 195 C505 195 516 195 575 195"/></svg></div>
    <div className="topology-note"><LockKeyhole/> Sanitized architecture · no client identity, data, or scale shown</div>
  </figure>
}

function Hero() { return <section className="hero"><div className="hero-copy"><span className="eyebrow">Platform Engineer / Philippines</span><h1>Order for systems<br/>that cannot stop.</h1><p>I adapt platforms, integrations, and workflows—making their rules, state, and boundaries clear enough to trust.</p><div className="hero-actions"><InternalLink className="primary-action" to="/#evidence">Explore system evidence <ArrowRight/></InternalLink><InternalLink to="/#contact">Discuss a role</InternalLink></div></div><Topology/></section> }

function Evidence() { return <section className="evidence" id="evidence"><div className="section-heading"><div><span>Selected Project Evidence</span><h2>Systems in operating context.</h2></div><p>Each case explains the operation, my responsibility, the architecture, its boundaries, and a result I can defend in an interview.</p></div><div className="evidence-list">{projectEvidence.map((item, index) => <article key={item.key}><div className="case-id"><span>SYS / 0{index + 1}</span><small>{item.type}</small></div><div className="case-main"><h3>{item.title}</h3><span>Operational problem</span><p>{item.problem}</p><span>Contribution</span><p>{item.contribution}</p>{item.key === 'lead' && <InternalLink className="case-link" to={caseStudyPath}>Open the Lead Case Study <ArrowRight/></InternalLink>}</div><div className="case-detail"><span>Architecture</span><p>{item.architecture}</p><span>Boundary</span><p>{item.boundary}</p><span>Verified Result</span><p>{item.result}</p><ul>{item.signals.map(signal => <li key={signal}>{signal}</li>)}</ul></div><ArrowDownRight className="case-arrow"/></article>)}</div></section> }
function Approach() { return <section className="approach" id="approach"><div className="approach-intro"><span>Working method</span><h2>Reliability starts before the code.</h2><p>My platform work connects technical behavior to the operation it serves. That means understanding what must remain true when data, organizations, and external systems cross boundaries.</p></div><ol>{workingMethod.map((step, index) => <li key={step.title}><span>0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></section> }
function Capabilities() { return <section className="capabilities"><div><span>Platform depth</span><h2>Odoo is the deepest platform.<br/>The engineering practice is broader.</h2></div><div className="capability-grid"><div><small>Platform adaptation</small><p>Odoo modules, ORM, OWL, QWeb, multi-company workflows, and operational reporting.</p></div><div><small>Integration reliability</small><p>REST APIs, Verified Payment Webhooks, transaction state, retries, and failure handling.</p></div><div><small>Delivery environment</small><p>Python, JavaScript, PostgreSQL, Linux, Docker, Bash, Git, and cross-functional implementation.</p></div></div></section> }
function Contact() { return <footer id="contact"><div className="contact-copy"><span>Next conversation</span><h2>Need an engineer who can make complex operations legible?</h2><p>I’m interested in Platform Engineer roles where platform knowledge, integration judgment, and operational clarity matter.</p></div><div className="contact-links"><a href="mailto:mendozajeromevrixen@gmail.com"><Mail/> Email Jerome <ArrowRight/></a><a href="https://github.com/systemeror12" target="_blank" rel="noreferrer"><Code/> View GitHub <ArrowRight/></a></div><div className="footer-line"><span>Jerome Mendoza / Platform Engineer</span><InternalLink to="/#top">Return to top ↑</InternalLink></div></footer> }

function PayrollFlow() { return <figure className="payroll-flow" role="img" aria-label="Payroll calculation flow"><figcaption><span>Reconstructed system flow</span><p>Multiple legal companies retain their own rules and access. Approved Payroll Input moves through company-specific Philippine Payroll Rules to a traceable payslip calculation.</p></figcaption><div className="flow-lane"><div className="company-boundaries"><div><small>Company boundary</small><strong>Legal company A</strong><p>Rules and access remain separate.</p></div><div><small>Company boundary</small><strong>Legal company B</strong><p>Rules and access remain separate.</p></div></div><ArrowRight/><div><small>Approved record</small><strong>Payroll Input</strong><p>Attendance, overtime, or leave.</p></div><ArrowRight/><div><small>Company-specific logic</small><strong>Philippine Payroll Rules</strong><p>Client-approved salary rules.</p></div><ArrowRight/><div><small>Visible result</small><strong>Payslip calculation</strong><p>Inputs and calculations are traceable.</p></div></div><div className="flow-note"><LockKeyhole/> Sanitized reconstruction; no client identity, data, or Confidential Scale is shown.</div></figure> }

function CaseStudy() { return <><Header isCaseStudy/><main className="case-study"><section className="case-hero"><div><span className="eyebrow">Lead Case Study / Sanitized Project Evidence</span><h1>Multi-Company<br/>HRIS</h1><p>One shared Odoo deployment serving multiple legal companies, with common platform capabilities and company-specific employees, payroll rules, permissions, and reporting.</p><InternalLink className="back-link" to="/"><ArrowLeft/> Back to home</InternalLink></div><div className="case-hero-meta"><span>Focus</span><strong>Custom Payroll</strong><span>Evidence boundary</span><strong>Multiple legal companies; no confidential scale</strong></div></section><section className="case-section case-problem"><span className="section-label">Problem and constraints</span><div><h2>Bring HR workflows into one approved flow without flattening company boundaries.</h2><p>Disconnected manual HR and payroll work needed to become one shared operation. The system had to preserve company-specific employees, permissions, reporting, and Philippine Payroll Rules while supporting custom attendance, recruitment, leave, overtime, and payroll workflows.</p></div></section><section className="case-section contribution"><span className="section-label">Case Study Contribution</span><div><h2>Core workflow design and implementation within a cross-functional delivery.</h2><p>Jerome designed and implemented most core HR workflows—including Attendance, Recruitment, and Payroll—and the dashboard within a broader client implementation delivered with a cross-functional team.</p></div></section><PayrollFlow/><section className="case-section decisions"><span className="section-label">Engineering decisions</span><div><h2>Make the company boundary part of the system design.</h2><ul><li>Use one shared platform while keeping company-specific records, access, reporting, and payroll rules distinct.</li><li>Consume approved attendance, overtime, and leave records as Payroll Input rather than treating payroll as an isolated calculation.</li><li>Keep payslip calculations traceable to the rules and approved records that produced them.</li></ul></div></section><section className="case-section validation"><span className="section-label">Payroll Validation</span><div><h2>Test the calculations against the operation they serve.</h2><p>Payroll Validation used representative scenarios, comparison with HR’s expected manual calculations, edge-case tests for holidays, overtime, and leave, and client acceptance before rollout.</p></div></section><section className="case-section outcome"><span className="section-label">HRIS Outcome</span><div><h2>One approved path from HR record to payslip calculation.</h2><p>The Multi-Company HRIS replaced disconnected manual HR and payroll work with one approved flow from attendance, overtime, and leave through payslip calculation, while preserving company-specific rules and access boundaries.</p></div></section><section className="technologies"><span className="section-label">Technologies</span><ul><li>Odoo Community</li><li>Python</li><li>PostgreSQL</li><li>JavaScript</li><li>QWeb</li></ul></section></main><footer className="case-footer"><InternalLink to="/">Return to homepage <ArrowRight/></InternalLink><span>Multi-Company HRIS / Sanitized Project Evidence</span></footer></> }

function App() { const [path, setPath] = React.useState(window.location.pathname); React.useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener('popstate', update); return () => window.removeEventListener('popstate', update) }, []); return path === caseStudyPath ? <CaseStudy/> : <main id="top"><Header/><Hero/><Evidence/><Approach/><Capabilities/><Contact/></main> }

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>)
