import React from "react";
import { hero } from "./content";
import { drawHeroDial } from "./hero-dial";
import { InternalLink } from "./navigation";

// Mounts the drawn scene before .hero-copy, behind its shade, over a sky of
// its own. The scene owns both svgs' contents.
function HeroScene() {
  const sky = React.useRef<SVGSVGElement>(null);
  const scene = React.useRef<SVGSVGElement>(null);

  React.useEffect(() => drawHeroDial(scene.current!, sky.current!), []);

  return (
    <>
      <svg ref={sky} className="hero-sky" aria-hidden="true" />
      <svg ref={scene} className="hero-scene" aria-hidden="true" />
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
