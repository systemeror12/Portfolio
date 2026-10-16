import React from "react";
import { drawAfterHoursIron } from "./after-hours-iron";
import { afterHours } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { dotsHyprlandCaseStudyPath } from "./routes";
import { StaffDivider } from "./staff-divider";

const { lingkod, desktop, tools } = afterHours;

function Spark() {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0 -10 L1.6 -1.6 L10 0 L1.6 1.6 L0 10 L-1.6 1.6 L-10 0 L-1.6 -1.6 Z" />
    </svg>
  );
}

function LingkodHr() {
  return (
    <article className="after-piece after-lingkod" aria-labelledby="lingkod-hr-title">
      <p className="after-status">
        <Spark />
        {lingkod.status}
      </p>
      <h3 id="lingkod-hr-title">{lingkod.title}</h3>
      <p>{lingkod.description}</p>
      <ul className="after-stack" aria-label={lingkod.stackLabel}>
        {lingkod.stack.map((technology) => (
          <li key={technology}>{technology}</li>
        ))}
      </ul>
    </article>
  );
}

// The Featured Personal System, with the Previous Desktop and its Upstream
// Contribution one click away.
function Desktop() {
  return (
    <article className="after-piece after-desktop" aria-labelledby="caelestia-xenrya-title">
      <p className="after-status">
        <Spark />
        {desktop.status}
      </p>
      <h3 id="caelestia-xenrya-title">{desktop.title}</h3>
      <p>{desktop.description}</p>
      <div className="after-split">
        <div className="after-voice after-upstream">
          <h4>{desktop.upstream.heading}</h4>
          <p>{desktop.upstream.body}</p>
        </div>
        <div className="after-voice after-mine">
          <h4>{desktop.mine.heading}</h4>
          <p>{desktop.mine.body}</p>
        </div>
      </div>
      <ul className="after-repos" aria-label={desktop.repositoriesLabel}>
        {desktop.repositories.map((repository) => (
          <li key={repository.name}>
            <a
              className="after-link"
              href={repository.href}
              target="_blank"
              rel="noreferrer"
              aria-label={repository.label}
            >
              {repository.name} on GitHub
            </a>
          </li>
        ))}
      </ul>
      <div className="after-previous">
        <InternalLink className="after-link" to={dotsHyprlandCaseStudyPath}>
          {desktop.previously}
        </InternalLink>
        <p className="after-credit">
          {desktop.credit.map((piece, index) =>
            index % 2 ? <code key={piece}>{piece}</code> : piece,
          )}
        </p>
      </div>
    </article>
  );
}

function ToolsIUse() {
  return (
    <section className="after-tools" aria-label={tools.label}>
      <h3>{tools.heading}</h3>
      <p className="after-tools-intro">{tools.intro}</p>
      <div className="after-tool-list">
        {tools.plaques.map((plaque) => (
          <div className="after-tool" key={plaque.tools[0].name}>
            <h4>{plaque.tools.map((tool) => tool.name).join(", ")}</h4>
            <p>{plaque.description}</p>
            <div className="after-tool-links">
              {plaque.tools.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${tool.name} upstream project`}
                >
                  {tool.name} on GitHub
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Mounts the drawn iron behind and in front of the panels. The scene owns the
// two svgs' contents.
function useIron() {
  const back = React.useRef<SVGSVGElement>(null);
  const front = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => drawAfterHoursIron(back.current!, front.current!), []);

  return { back, front };
}

export function AfterHoursSection() {
  const heading = useReveal<HTMLDivElement>();
  const pieces = useReveal<HTMLDivElement>();
  const iron = useIron();

  return (
    <section className="after" id="after" aria-labelledby="after-title">
      <StaffDivider />
      <div className="after-inner">
        <div ref={heading.ref} className={`after-heading ${heading.className}`}>
          <h2 id="after-title">{afterHours.heading}</h2>
          <p>{afterHours.intro}</p>
        </div>
        <div ref={pieces.ref} className={`after-pieces ${pieces.className}`}>
          <svg ref={iron.back} className="after-iron after-iron-back" aria-hidden="true" />
          <LingkodHr />
          <Desktop />
          <ToolsIUse />
          <svg ref={iron.front} className="after-iron after-iron-front" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
