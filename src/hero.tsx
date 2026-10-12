import { hero } from "./content";
import { InternalLink } from "./navigation";

// The hero's copy. The drawn scene (#37, #38) goes before .hero-copy, behind its shade.
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="hero-name">
          <strong>{hero.name}</strong>, {hero.role}
        </p>
        <h1 id="hero-title">
          {hero.title} <em>{hero.titleEmphasis}</em>
        </h1>
        <p className="hero-lede">{hero.lede}</p>
        <div className="hero-actions">
          <InternalLink className="hero-action hero-action-solid" to="/#work">
            {hero.workAction}
          </InternalLink>
          <a className="hero-action hero-action-line" href={`mailto:${hero.email}`}>
            {hero.emailAction}
          </a>
        </div>
      </div>
    </section>
  );
}
