import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { InternalLink } from "./navigation";

const repositoryUrl = "https://github.com/systemeror12/dots-hyprland-xenrya";
const upstreamContributionUrl =
  "https://github.com/yurihikari/ml4w-lightcrimson-dotfiles/pull/3";

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
      <main className="case-study personal-system-study">
        <section className="case-hero">
          <div>
            <span className="eyebrow">Featured Personal System / Open source fork</span>
            <p className="maintenance-label">Actively maintained fork</p>
            <h1>Evolving a Hyprland desktop into my daily platform</h1>
            <p>
              I use this fork every day as a practical place to improve desktop
              state, launch behavior, and reliability. The upstream project is
              the visual foundation; this page distinguishes that foundation
              from my ongoing engineering work.
            </p>
            <InternalLink className="back-link" to="/">
              <ArrowLeft /> Back to home
            </InternalLink>
          </div>
          <div className="case-hero-meta">
            <span>System role</span>
            <strong>Daily-use desktop platform</strong>
            <span>Repository</span>
            <ExternalEvidenceLink href={repositoryUrl} ariaLabel="Open fork repository">
              Open fork
            </ExternalEvidenceLink>
          </div>
        </section>

        <section className="case-section case-problem">
          <span className="section-label">Fork motivation</span>
          <div>
            <h2>Keep an admired visual foundation useful under daily use.</h2>
            <p>
              I forked the upstream desktop configuration to adapt it to how I
              actually work. The goal is not to claim its visual design or
              maintain the upstream repository; it is to make my own desktop
              behavior clearer, faster, and less fragile as needs emerge.
            </p>
          </div>
        </section>

        <section className="case-section contribution">
          <span className="section-label">Daily-use problems</span>
          <div>
            <h2>Desktop state crosses more boundaries than it first appears.</h2>
            <p>
              A wallpaper change can affect workspace presentation, generated
              colors, previews, and the launcher. A launcher should open
              promptly while still reflecting installed applications. Those
              behaviors span shell scripts, Hyprland, Quickshell, Rofi, cache
              files, and IPC—so the failure path matters as much as the happy
              path.
            </p>
          </div>
        </section>

        <section className="case-section">
          <span className="section-label">Upstream work</span>
          <div>
            <h2>Build on a visual system whose authorship remains upstream.</h2>
            <p>
              The upstream project supplies the desktop&apos;s visual foundation.
              My fork is where I make personal engineering changes and publish
              their supporting evidence; it is not a claim of ownership over
              the upstream design or maintenance.
            </p>
          </div>
        </section>

        <section className="personal-contributions" aria-labelledby="contributions-title">
          <div className="personal-contributions-heading">
            <span className="section-label">Personal System Contribution</span>
            <h2 id="contributions-title">Three themes I continue to refine.</h2>
          </div>
          <ol>
            {changes.map((change, index) => (
              <li key={change.title}>
                <span>0{index + 1}</span>
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
            <h2>Verify behavior at the seams where processes meet.</h2>
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
          <span className="section-label">Future maintenance</span>
          <div>
            <h2>Keep the platform legible as its moving parts evolve.</h2>
            <p>
              I will continue to treat this fork as a daily-use system: follow
              upstream changes selectively, protect explicit state boundaries,
              and validate the interactions that matter before relying on them.
            </p>
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
      </main>
      <footer className="case-footer">
        <InternalLink to="/">
          Return to homepage <ArrowRight />
        </InternalLink>
        <span>dots-hyprland / Featured Personal System</span>
      </footer>
    </>
  );
}
