import React from "react";
import { contact } from "./content";
import { drawContactWindow } from "./contact-window";
import { useReveal } from "./reveal";

function ContactWindow({ className }: { className: string }) {
  const scene = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => drawContactWindow(scene.current!), []);
  return <svg ref={scene} className={className} aria-hidden="true" />;
}

// The coda: the heading, the ways to reach me, and the small window, closed
// by a staff that ends on a final bar.
export function ContactSection() {
  const windowReveal = useReveal<HTMLDivElement>();
  const textReveal = useReveal<HTMLDivElement>();

  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-coda">
        <div ref={windowReveal.ref} className={`contact-window ${windowReveal.className}`}>
          <ContactWindow className="contact-window-scene" />
        </div>
        <div ref={textReveal.ref} className={`contact-text ${textReveal.className}`}>
          <h2 id="contact-title">{contact.heading}</h2>
          <p>{contact.body}</p>
          <a className="contact-mail" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <div className="contact-links">
            {contact.links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
            <a href={contact.resume.href} download>
              {contact.resume.label}
            </a>
          </div>
        </div>
      </div>
      <svg
        className="contact-final-bar"
        viewBox="0 0 1200 44"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 10 H1198 M0 16 H1198 M0 22 H1198 M0 28 H1198 M0 34 H1198 M1190 10 V34" />
        <path className="contact-final-bar-thick" d="M1197 10 V34" />
      </svg>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>{contact.footer.name}</span>
      <span>{contact.footer.line}</span>
    </footer>
  );
}
