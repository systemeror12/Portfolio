import { work, workCases, type WorkCase } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { StaffDivider } from "./staff-divider";

function Spark() {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0 -10 L1.6 -1.6 L10 0 L1.6 1.6 L0 10 L-1.6 1.6 L-10 0 L-1.6 -1.6 Z" />
    </svg>
  );
}

function WorkCaseArticle({ item }: { item: WorkCase }) {
  const reveal = useReveal<HTMLElement>();
  const titleId = `work-${item.id}-title`;

  return (
    <article
      ref={reveal.ref}
      className={`work-case ${reveal.className}`}
      aria-labelledby={titleId}
    >
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

  return (
    <section className="work" id="work" aria-labelledby="work-title">
      <StaffDivider />
      <div className="work-inner">
        <div ref={reveal.ref} className={`work-heading ${reveal.className}`}>
          <h2 id="work-title">{work.heading}</h2>
          <p>{work.intro}</p>
        </div>
        <div className="work-cases">
          {workCases.map((item) => (
            <WorkCaseArticle key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
