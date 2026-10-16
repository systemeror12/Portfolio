import { inProgress, inProgressPieces, type InProgressPiece } from "./content";
import { InternalLink } from "./navigation";
import { useReveal } from "./reveal";
import { StaffDivider } from "./staff-divider";

const { labels } = inProgress;

function Spark() {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0 -10 L1.6 -1.6 L10 0 L1.6 1.6 L0 10 L-1.6 1.6 L-10 0 L-1.6 -1.6 Z" />
    </svg>
  );
}

// Neither system is live, so each piece states what I own and the line it
// holds in place of a result. A piece with its own page links to it, as the
// Work section's cases do.
function Piece({ piece }: { piece: InProgressPiece }) {
  const titleId = `${piece.id}-title`;
  return (
    <article className="progress-piece" aria-labelledby={titleId}>
      <p className="progress-status">
        <Spark />
        {piece.status}
      </p>
      <h3 id={titleId}>{piece.title}</h3>
      <p className="progress-for">{piece.for}</p>
      <dl className="progress-facts">
        <dt>{labels.role}</dt>
        <dd>{piece.role}</dd>
        <dt>{labels.owns}</dt>
        <dd>{piece.owns}</dd>
        <dt>{labels.holds}</dt>
        <dd>{piece.holds}</dd>
      </dl>
      <ul className="progress-ideas" aria-label={labels.keyIdeas}>
        {piece.keyIdeas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
      {piece.path && (
        <InternalLink
          className="progress-link"
          to={piece.path}
          aria-label={`${labels.readMore}: ${piece.title}`}
        >
          {labels.readMore}
        </InternalLink>
      )}
    </article>
  );
}

export function InProgressSection() {
  const heading = useReveal<HTMLDivElement>();
  const pieces = useReveal<HTMLDivElement>();

  return (
    <section className="progress" id="in-progress" aria-labelledby="in-progress-title">
      <StaffDivider />
      <div className="progress-inner">
        <div ref={heading.ref} className={`progress-heading ${heading.className}`}>
          <h2 id="in-progress-title">{inProgress.heading}</h2>
          <p>{inProgress.intro}</p>
        </div>
        <div ref={pieces.ref} className={`progress-pieces ${pieces.className}`}>
          {inProgressPieces.map((piece) => (
            <Piece key={piece.id} piece={piece} />
          ))}
        </div>
      </div>
    </section>
  );
}
