import React from "react";
import { Menu, X } from "lucide-react";
import { InternalLink } from "./navigation";
import {
  aiCaseStudyPath,
  caseStudyPath,
  paymentProviderCaseStudyPath,
  publicSectorCaseStudyPath,
} from "./routes";

const manilaTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const manilaPlainTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

// The day runs from 05:00 to 28:59, so 1 a.m. reads 25:00.
function readManilaClock(now: Date) {
  const parts = Object.fromEntries(
    manilaTime.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const hour = Number(parts.hour);
  const shownHour = hour < 5 ? hour + 24 : hour;
  return {
    shown: `${String(shownHour).padStart(2, "0")}:${parts.minute}`,
    // ICU puts a narrow no-break space before AM and PM.
    plain: manilaPlainTime.format(now).replace(/\s/g, " "),
  };
}

function ManilaClock() {
  const [time, setTime] = React.useState(() => readManilaClock(new Date()));

  React.useEffect(() => {
    const tick = window.setInterval(
      () => setTime(readManilaClock(new Date())),
      15_000,
    );
    return () => window.clearInterval(tick);
  }, []);

  return (
    <p
      className="clock"
      role="img"
      aria-label={`It's ${time.plain} in Manila`}
    >
      <span>Manila</span>
      <b>{time.shown}</b>
    </p>
  );
}

export function Header({ currentPath }: { currentPath?: string }) {
  const [open, setOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => menuButtonRef.current?.focus());
    }
  };
  const closeMenuAfterNavigation = () => closeMenu();

  React.useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <header className="site-header" id="top">
      <InternalLink
        className="identity"
        to="/"
        aria-label="Jerome Mendoza, home"
      >
        Jerome Mendoza
      </InternalLink>
      <nav className={open ? "open" : ""} aria-label="Primary navigation">
        <InternalLink
          to="/"
          aria-current={!currentPath ? "page" : undefined}
          onClick={closeMenuAfterNavigation}
        >
          Home
        </InternalLink>
        <InternalLink
          to={caseStudyPath}
          aria-current={currentPath === caseStudyPath ? "page" : undefined}
          onClick={closeMenuAfterNavigation}
        >
          Case study
        </InternalLink>
        <InternalLink
          to={aiCaseStudyPath}
          aria-current={currentPath === aiCaseStudyPath ? "page" : undefined}
          onClick={closeMenuAfterNavigation}
        >
          AI R&amp;D
        </InternalLink>
        <InternalLink
          to={paymentProviderCaseStudyPath}
          aria-current={
            currentPath === paymentProviderCaseStudyPath ? "page" : undefined
          }
          onClick={closeMenuAfterNavigation}
        >
          Integration
        </InternalLink>
        <InternalLink
          to={publicSectorCaseStudyPath}
          aria-current={
            currentPath === publicSectorCaseStudyPath ? "page" : undefined
          }
          onClick={closeMenuAfterNavigation}
        >
          Public sector
        </InternalLink>
        <InternalLink
          to="/#personal-projects"
          onClick={closeMenuAfterNavigation}
        >
          Personal projects
        </InternalLink>
        {!currentPath && (
          <>
            <InternalLink to="/#method" onClick={closeMenuAfterNavigation}>
              Method
            </InternalLink>
            <InternalLink to="/#contact" onClick={closeMenuAfterNavigation}>
              Contact
            </InternalLink>
          </>
        )}
      </nav>
      <ManilaClock />
      <button
        ref={menuButtonRef}
        className="menu-button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close navigation" : "Open navigation"}
      >
        {open ? <X /> : <Menu />}
      </button>
    </header>
  );
}
