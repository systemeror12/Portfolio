import React from "react";
import { work, workCases, type WorkCase } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { drawCaseRose, drawRoseWindow } from "./rose-window";
import { StaffDivider } from "./staff-divider";

function Spark() {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0 -10 L1.6 -1.6 L10 0 L1.6 1.6 L0 10 L-1.6 1.6 L-10 0 L-1.6 -1.6 Z" />
    </svg>
  );
}

// Mounts the rose window beside the cases, and names who the lit pane's
// system served. The scene finds the cases and reports which one is read.
function RoseWindow({ lit, onLight }: { lit: number; onLight: (index: number) => void }) {
  const scene = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    const svg = scene.current!;
    const cases = Array.from(svg.closest("section")!.querySelectorAll<HTMLElement>(".work-case"));
    return drawRoseWindow(
      svg,
      cases,
      workCases.map((item) => item.records),
      onLight,
    );
  }, [onLight]);

  return (
    <div className="work-rose" aria-hidden="true">
      <svg ref={scene} className="rose-window" />
      <p className="work-rose-for">
        <span>{work.servedBy}</span> <b key={lit}>{workCases[lit].served}</b>
      </p>
    </div>
  );
}

// The small still window above each case on narrow screens.
function CaseRose({ index }: { index: number }) {
  const scene = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => drawCaseRose(scene.current!, index), [index]);
  return <svg ref={scene} className="work-case-rose" aria-hidden="true" />;
}

function WorkCaseArticle({ item, index, lit }: { item: WorkCase; index: number; lit: boolean }) {
  const reveal = useReveal<HTMLElement>();
  const titleId = `work-${item.id}-title`;

  return (
    <article
      ref={reveal.ref}
      className={`work-case ${reveal.className}${lit ? " is-lit" : ""}`}
      aria-labelledby={titleId}
    >
      <CaseRose index={index} />
      <p className="work-case-kind">
        <span aria-hidden="true">{item.numeral}</span>
        {item.kind}
      </p>
      <h3 id={titleId}>{item.title}</h3>
      <p className="work-case-for">{item.for}</p>
      {item.note && <p className="work-case-note">{item.note}</p>}
      <p className="work-case-problem">{item.problem}</p>
      <dl>
        <div>
          <dt>{work.labels.built}</dt>
          <dd>{item.built}</dd>
        </div>
        <div>
          <dt>{work.labels.fits}</dt>
          <dd>{item.fits}</dd>
        </div>
        <div className="work-case-holds">
          <dt>{work.labels.holds}</dt>
          <dd>{item.holds}</dd>
        </div>
        <div className="work-case-changed">
          <dt>
            <Spark />
            {work.labels.changed}
          </dt>
          <dd>{item.changed}</dd>
        </div>
      </dl>
      <p className="work-case-ideas">
        {work.labels.keyIdeas}: <span>{item.keyIdeas.join(", ")}</span>
      </p>
      <InternalLink
        className="work-case-link"
        to={item.path}
        aria-label={`${work.readMore}: ${item.title}`}
      >
        {work.readMore}
      </InternalLink>
    </article>
  );
}

export function WorkSection() {
  const reveal = useReveal<HTMLDivElement>();
  const [lit, setLit] = React.useState(0);

  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <StaffDivider />
      <div className="work-inner">
        <div ref={reveal.ref} className={`work-heading ${reveal.className}`}>
          <h2 id="work-title">{work.heading}</h2>
          <p>{work.intro}</p>
        </div>
        <div className="work-window">
          <RoseWindow lit={lit} onLight={setLit} />
          <div className="work-cases">
            {workCases.map((item, index) => (
              <WorkCaseArticle key={item.id} item={item} index={index} lit={index === lit} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
