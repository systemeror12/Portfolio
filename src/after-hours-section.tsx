import { afterHours } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { dotsHyprlandCaseStudyPath } from "./routes";
import { StaffDivider } from "./staff-divider";

const { lingkod, dots, tools } = afterHours;

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

function DotsHyprland() {
  return (
    <article className="after-piece after-dots" aria-labelledby="dots-hyprland-title">
      <p className="after-status">
        <Spark />
        {dots.status}
      </p>
      <h3 id="dots-hyprland-title">{dots.title}</h3>
      <p>{dots.description}</p>
      <div className="after-split">
        <div className="after-voice after-upstream">
          <h4>{dots.upstream.heading}</h4>
          <p>{dots.upstream.body}</p>
        </div>
        <div className="after-voice after-mine">
          <h4>{dots.mine.heading}</h4>
          <p>{dots.mine.body}</p>
        </div>
      </div>
      <p className="after-credit">
        {dots.credit.map((piece, index) =>
          index % 2 ? <code key={piece}>{piece}</code> : piece,
        )}
      </p>
      <InternalLink className="after-link" to={dotsHyprlandCaseStudyPath}>
        {dots.readMore}
      </InternalLink>
    </article>
  );
}

function ToolsIUse() {
  return (
    <section className="after-tools" aria-label={tools.label}>
      <h3>{tools.heading}</h3>
      <p className="after-tools-intro">{tools.intro}</p>
      <div className="after-tool-list">
        {tools.items.map((tool) => (
          <div className="after-tool" key={tool.name}>
            <h4>{tool.name}</h4>
            <p>{tool.description}</p>
            <a
              href={tool.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${tool.name} upstream project`}
            >
              {tool.name} on GitHub
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AfterHoursSection() {
  const heading = useReveal<HTMLDivElement>();
  const pieces = useReveal<HTMLDivElement>();

  return (
    <section className="after" id="after" aria-labelledby="after-title">
      <StaffDivider />
      <div className="after-inner">
        <div ref={heading.ref} className={`after-heading ${heading.className}`}>
          <h2 id="after-title">{afterHours.heading}</h2>
          <p>{afterHours.intro}</p>
        </div>
        <div ref={pieces.ref} className={`after-pieces ${pieces.className}`}>
          <LingkodHr />
          <DotsHyprland />
          <ToolsIUse />
        </div>
      </div>
    </section>
  );
}
