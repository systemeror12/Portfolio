import React from "react";

const reducedMotion = "(prefers-reduced-motion: reduce)";

// Fades an element up the first time an eighth of it scrolls into view. Under
// reduced motion it is shown at once and nothing is observed.
export function useReveal<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [shown, setShown] = React.useState(
    () => window.matchMedia(reducedMotion).matches,
  );

  React.useEffect(() => {
    const element = ref.current;
    if (shown || !element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  return { ref, className: shown ? "reveal is-shown" : "reveal" };
}
