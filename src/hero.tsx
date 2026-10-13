import React from "react";
import { hero } from "./content";
import { drawHeroDial } from "./hero-dial";
import { InternalLink } from "./navigation";

// Mounts the drawn scene before .hero-copy, behind its shade. The scene owns
// the svg's contents and places the heart's label.
function HeroScene() {
  const scene = React.useRef<SVGSVGElement>(null);
  const label = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => drawHeroDial(scene.current!, label.current!), []);

  return (
    <>
      <svg ref={scene} className="hero-scene" aria-hidden="true" />
      <span ref={label} className="heart-label" aria-hidden="true">
        {hero.heartLabel}
      </span>
    </>
  );
}

// The hero's copy over its drawn scene.
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <HeroScene />
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
