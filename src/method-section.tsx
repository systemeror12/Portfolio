import { method, methodDepth, methodSteps } from "./content";
import { useReveal } from "./reveal";

// The four steps are an ordered list; the staff, the glass notes, and the
// final double bar are drawn by its stylesheet. A short passage on platform
// depth follows the phrase.
export function MethodSection() {
  const headingReveal = useReveal<HTMLDivElement>();
  const phraseReveal = useReveal<HTMLOListElement>();
  const depthReveal = useReveal<HTMLDivElement>();

  return (
    <section className="method" id="method" aria-labelledby="method-title">
      <div className="method-inner">
        <div
          ref={headingReveal.ref}
          className={`method-heading ${headingReveal.className}`}
        >
          <h2 id="method-title">{method.heading}</h2>
          <p>{method.intro}</p>
        </div>
        <ol
          ref={phraseReveal.ref}
          className={`method-phrase ${phraseReveal.className}`}
        >
          {methodSteps.map((step) => (
            <li key={step.title}>
              <span aria-hidden="true">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <div
          ref={depthReveal.ref}
          className={`method-depth ${depthReveal.className}`}
        >
          <p>{methodDepth.lead}</p>
          <p>{methodDepth.detail}</p>
        </div>
      </div>
    </section>
  );
}
