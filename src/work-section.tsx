import React from "react";
import { work, workCases, type WorkCase } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { drawCaseRose, drawRoseWindow } from "./rose-window";
import { drawBandRose, drawCaseScrub, drawLunette } from "./rose-phone";
import { StaffDivider } from "./staff-divider";
import "./styles/work-phone-prototype.css";

// PROTOTYPE for #47: which phone treatment the Work section shows, from
// ?rose=now|a|b|c. "now" is the shipped one, a small still rose per case.
const phoneRoses = ["now", "a", "b", "c"] as const;
type PhoneRose = (typeof phoneRoses)[number];
const phoneRoseNames: Record<PhoneRose, string> = {
  now: "Now: a still rose per case",
  a: "A: the held band",
  b: "B: the lunette",
  c: "C: the case roses",
};
// The switch shows only when the URL asks for a treatment, so the page
// without ?rose= is exactly the shipped one.
const roseParam = () => new URLSearchParams(window.location.search).get("rose");
function readPhoneRose(): PhoneRose {
  const value = roseParam();
  return phoneRoses.find((rose) => rose === value) ?? "now";
}

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

const records = workCases.map((item) => item.records);

// A: a small whole window pinned at the top of the screen while the cases
// scroll beneath it, naming who the lit pane served and its records.
function RoseBand({ lit }: { lit: number }) {
  const scene = React.useRef<SVGSVGElement>(null);
  const drawn = React.useRef<ReturnType<typeof drawBandRose>>(null);
  React.useEffect(() => {
    drawn.current = drawBandRose(scene.current!, records);
    return () => drawn.current!.cleanup();
  }, []);
  React.useEffect(() => drawn.current!.light(lit), [lit]);
  const item = workCases[lit];

  return (
    <div className="work-band" aria-hidden="true">
      <svg ref={scene} className="rose-band" />
      <div className="work-band-text" key={lit}>
        <p className="work-band-for">
          {work.servedBy} <b>{item.served}</b>
        </p>
        <p className="work-band-records">
          {item.records.split(" · ").map((record, index) => (
            <span key={record} style={{ "--i": index } as React.CSSProperties}>
              {record}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}

// B: the top of the full window, rising from the foot of the screen. The glass
// turns the lit pane up under the hand; the sill names who it served.
const lunetteHeight = 102;
function RoseLunette({ lit }: { lit: number }) {
  const scene = React.useRef<SVGSVGElement>(null);
  const drawn = React.useRef<ReturnType<typeof drawLunette>>(null);
  React.useEffect(() => {
    drawn.current = drawLunette(scene.current!, records, lunetteHeight);
    return () => drawn.current!.cleanup();
  }, []);
  React.useEffect(() => drawn.current!.light(lit), [lit]);

  return (
    <div className="work-lunette" aria-hidden="true">
      <svg ref={scene} className="rose-lunette" style={{ height: lunetteHeight }} />
      <p className="work-lunette-for">
        <span>{work.servedBy}</span> <b key={lit}>{workCases[lit].served}</b>
      </p>
    </div>
  );
}

// C: the case's own window, its hand following the scroll into this pane.
function CaseScrub({ index }: { index: number }) {
  const scene = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => drawCaseScrub(scene.current!, index, records), [index]);
  return <svg ref={scene} className="work-case-scrub" aria-hidden="true" />;
}

// Prototype only: switches the phone treatment and keeps it in the URL.
function PhoneRoseSwitch({ rose, onChange }: { rose: PhoneRose; onChange: (rose: PhoneRose) => void }) {
  return (
    <div className="phone-rose-switch" role="group" aria-label="Prototype: phone rose window">
      {phoneRoses.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === rose}
          aria-label={phoneRoseNames[option]}
          title={phoneRoseNames[option]}
          onClick={() => onChange(option)}
        >
          {option === "now" ? "–" : option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// The small still window above each case on narrow screens.
function CaseRose({ index }: { index: number }) {
  const scene = React.useRef<SVGSVGElement>(null);
  React.useEffect(() => drawCaseRose(scene.current!, index), [index]);
  return <svg ref={scene} className="work-case-rose" aria-hidden="true" />;
}

function WorkCaseArticle({
  item,
  index,
  lit,
  rose,
}: {
  item: WorkCase;
  index: number;
  lit: boolean;
  rose: PhoneRose;
}) {
  const reveal = useReveal<HTMLElement>();
  const titleId = `work-${item.id}-title`;

  return (
    <article
      ref={reveal.ref}
      className={`work-case ${reveal.className}${lit ? " is-lit" : ""}`}
      aria-labelledby={titleId}
    >
      {rose === "c" ? <CaseScrub index={index} /> : <CaseRose index={index} />}
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
  const [rose, setRose] = React.useState(readPhoneRose);
  const [prototyping] = React.useState(() => roseParam() !== null);
  const choose = (option: PhoneRose) => {
    const url = new URL(window.location.href);
    url.searchParams.set("rose", option);
    window.history.replaceState(window.history.state, "", url);
    setRose(option);
  };

  return (
    <section className={`work phone-rose-${rose}`} id="work" aria-labelledby="work-title">
      <StaffDivider />
      <div className="work-inner">
        <div ref={reveal.ref} className={`work-heading ${reveal.className}`}>
          <h2 id="work-title">{work.heading}</h2>
          <p>{work.intro}</p>
        </div>
        <div className="work-window">
          <RoseWindow lit={lit} onLight={setLit} />
          {rose === "a" && <RoseBand lit={lit} />}
          <div className="work-cases">
            {workCases.map((item, index) => (
              <WorkCaseArticle key={item.id} item={item} index={index} lit={index === lit} rose={rose} />
            ))}
          </div>
          {rose === "b" && <RoseLunette lit={lit} />}
        </div>
        {prototyping && <PhoneRoseSwitch rose={rose} onChange={choose} />}
      </div>
    </section>
  );
}
