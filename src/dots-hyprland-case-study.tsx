import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { CaseIron, CaseKind } from "./case-study-iron";
import { InternalLink } from "./navigation";
import "./styles/case-study.css";

const repositoryUrl = "https://github.com/systemeror12/dots-hyprland-xenrya";
const upstreamContributionUrl =
  "https://github.com/yurihikari/ml4w-lightcrimson-dotfiles/pull/3";
// Where the desktop went next: the three Caelestia-Xenrya forks.
const caelestiaRepositories = [
  { name: "dotfiles", url: "https://github.com/systemeror12/caelestia-xenrya" },
  { name: "CLI", url: "https://github.com/systemeror12/caelestia-cli-xenrya" },
  { name: "shell", url: "https://github.com/systemeror12/caelestia-shell-xenrya" },
];

const changes = [
  {
    title: "Workspace wallpaper state",
    detail:
      "Per-workspace wallpaper selection, a dedicated picker, and a separate Matugen baseline so global colors do not accidentally overwrite a workspace choice.",
    url: "https://github.com/systemeror12/dots-hyprland-xenrya/pull/11",
  },
  {
    title: "Launcher performance and correctness",
    detail:
      "Moved expensive launcher preparation out of launch time, then replaced fragile timestamp invalidation with a manifest stamp so application entries stay current.",
    url: "https://github.com/systemeror12/dots-hyprland-xenrya/pull/13",
  },
  {
    title: "Cross-process reliability",
    detail:
      "Consolidated wallpaper-cache refresh behavior and guarded stale launcher processes so independently started pieces converge on a consistent state.",
    url: "https://github.com/systemeror12/dots-hyprland-xenrya/pull/14",
  },
];

function ExternalEvidenceLink({
  href,
  children,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={ariaLabel}>
      {children} <ExternalLink aria-hidden="true" />
    </a>
  );
}

export function DotsHyprlandCaseStudy() {
  return (
    <>
      <main id="main" tabIndex={-1} className="case-study personal-system-study">
        <section className="case-hero">
          <div>
            <CaseKind id="dots-hyprland" />
            <h1>Evolving my previous Hyprland desktop</h1>
            <p>
              Before I moved to Caelestia-Xenrya, this fork was where I worked
              and where I improved desktop state, launch behavior, and
              reliability. The upstream project was the visual foundation; this
              page distinguishes that foundation from the engineering work I
              added to it.
            </p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>System role</span>
            <strong>Previous desktop, no longer maintained</strong>
            <span>Repository</span>
            <ExternalEvidenceLink href={repositoryUrl} ariaLabel="Open fork repository">
              Open fork
            </ExternalEvidenceLink>
          </div>
        </section>

        <section className="case-section case-problem">
          <span className="section-label">Fork motivation</span>
          <div>
            <h2>Keep an admired visual foundation useful in real work.</h2>
            <p>
              I forked the upstream desktop configuration to adapt it to how I
              actually worked. The goal was never to claim its visual design or
              maintain the upstream repository; it was to make my own desktop
              behavior clearer, faster, and less fragile as needs emerged.
            </p>
          </div>
        </section>

        <section className="case-section contribution">
          <span className="section-label">Problems in use</span>
          <div>
            <h2>Desktop state crossed more boundaries than it first appeared.</h2>
            <p>
              A wallpaper change could affect workspace presentation, generated
              colors, previews, and the launcher. A launcher had to open
              promptly while still reflecting installed applications. Those
              behaviors spanned shell scripts, Hyprland, Quickshell, Rofi, cache
              files, and IPC—so the failure path mattered as much as the happy
              path.
            </p>
          </div>
        </section>

        <section className="case-section">
          <span className="section-label">Upstream work</span>
          <div>
            <h2>Built on a visual system whose authorship remains upstream.</h2>
            <p>
              The upstream project supplied the desktop&apos;s visual foundation.
              My fork is where I made personal engineering changes and published
              their supporting evidence; it is not a claim of ownership over
              the upstream design or maintenance.
            </p>
          </div>
        </section>

        <section className="personal-contributions" aria-labelledby="contributions-title">
          <div className="personal-contributions-heading">
            <span className="section-label">Personal System Contribution</span>
            <h2 id="contributions-title">Three themes I refined.</h2>
          </div>
          <ol>
            {changes.map((change, index) => (
              <li key={change.title}>
                <span aria-hidden="true">0{index + 1}</span>
                <div>
                  <h3>{change.title}</h3>
                  <p>{change.detail}</p>
                  <ExternalEvidenceLink
                    href={change.url}
                    ariaLabel={`Open ${change.title} selected change`}
                  >
                    View selected change
                  </ExternalEvidenceLink>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="case-section decisions">
          <span className="section-label">Testing and review</span>
          <div>
            <h2>Verified behavior at the seams where processes met.</h2>
            <p>
              Selected changes document syntax checks, focused smoke scenarios,
              launcher timing checks, cache validation, and review before
              merge. The evidence links expose the implementation and review
              context, rather than substituting repository statistics for
              proof.
            </p>
          </div>
        </section>

        <section className="upstream-contribution" aria-labelledby="upstream-title">
          <div>
            <ShieldCheck aria-hidden="true" />
            <span className="section-label">Verified Upstream Contribution</span>
          </div>
          <div>
            <h2 id="upstream-title">Per-workspace wallpaper feature credit.</h2>
            <p>
              Jerome Vrixen DC Mendoza / Xenrya is credited as the original
              feature author in the maintainer&apos;s public pull request. The
              maintainer reworked the final implementation for that project&apos;s
              current Quickshell structure and merged it; I do not claim
              authorship of that rework.
            </p>
            <ExternalEvidenceLink
              href={upstreamContributionUrl}
              ariaLabel="Open the maintainer's public pull request"
            >
              Open the maintainer&apos;s public pull request
            </ExternalEvidenceLink>
          </div>
        </section>

        <section className="case-section outcome">
          <span className="section-label">Where it went next</span>
          <div>
            <h2>The desktop moved to Caelestia-Xenrya.</h2>
            <p>
              I moved my desktop to Caelestia-Xenrya because Caelestia&apos;s
              shell is built entirely in Quickshell, which makes personal
              changes easier to add. This fork is no longer maintained, but its
              changes and the upstream credit stay here.
            </p>
            <ul className="next-desktop-links">
              {caelestiaRepositories.map((repository) => (
                <li key={repository.name}>
                  <ExternalEvidenceLink
                    href={repository.url}
                    ariaLabel={`Open the Caelestia-Xenrya ${repository.name}`}
                  >
                    Caelestia-Xenrya {repository.name}
                  </ExternalEvidenceLink>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="technologies">
          <span className="section-label">Technologies</span>
          <ul>
            <li>Hyprland</li>
            <li>Quickshell</li>
            <li>Rofi</li>
            <li>Matugen</li>
            <li>Bash</li>
            <li>Linux IPC</li>
          </ul>
        </section>
        <CaseIron id="dots-hyprland" />
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>dots-hyprland / Previous Desktop</span>
      </footer>
    </>
  );
}
