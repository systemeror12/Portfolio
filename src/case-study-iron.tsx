import React from "react";
import { drawCaseIron } from "./case-iron";
import { inProgressPieces, workCases } from "./content";

// What the homepage already says about each case: its pane's numeral, its
// kind, who it was for, who it served, and the records written around its
// pane.
type CaseFacts = {
  numeral?: string;
  kind: string;
  for?: string;
  served: string;
  records: string;
};
const fromWork = (id: string): CaseFacts => {
  const item = workCases.find((work) => work.id === id)!;
  return { numeral: item.numeral, kind: item.kind, for: item.for, served: item.served, records: item.records };
};
const caseFacts = {
  "multi-company-hris": fromWork("multi-company-hris"),
  "payment-provider": fromWork("payment-provider"),
  "ai-odoo-rnd": fromWork("ai-odoo-rnd"),
  "public-sector-hris": fromWork("public-sector-hris"),
  // The rebuild isn't live, so it has no pane: its kind is its section's,
  // its records follow the cutover, and who it was for comes from its card.
  "brokerage-erp-rebuild": {
    kind: "In progress",
    for: inProgressPieces.find((piece) => piece.id === "brokerage-erp-rebuild")!.for,
    served: "the brokerage's accountants",
    records: "extract · transform · load · verify",
  },
  // The Previous Desktop has no pane on the homepage, so it keeps its own
  // facts. Its records follow its three themes.
  "dots-hyprland": {
    kind: "Previous desktop",
    served: "me, until I moved to Caelestia",
    records: "workspace · wallpaper · launcher · processes",
  },
} satisfies Record<string, CaseFacts>;
export type CaseId = keyof typeof caseFacts;

function Spark() {
  return (
    <svg viewBox="-10 -10 20 20" aria-hidden="true">
      <path d="M0 -10 L1.6 -1.6 L10 0 L1.6 1.6 L0 10 L-1.6 1.6 L-10 0 L-1.6 -1.6 Z" />
    </svg>
  );
}

// The kind line that opens the hero, as on the case's card on the homepage:
// the pane's numeral, lit, then the kind. A case with no pane carries its
// spark instead.
// The case's records follow, where the chain begins.
export function CaseKind({ id }: { id: CaseId }) {
  const facts: CaseFacts = caseFacts[id];
  return (
    <>
      <p className="case-kind">
        {facts.numeral ? <span aria-hidden="true">{facts.numeral}</span> : <Spark />}
        {facts.kind}
      </p>
      <ul className="case-records" aria-label="Records it carries">
        {facts.records.split(" · ").map((record) => (
          <li key={record}>{record}</li>
        ))}
      </ul>
    </>
  );
}

// Who the system was for, under the title, in the homepage's words.
export function CaseFor({ id }: { id: CaseId }) {
  const facts: CaseFacts = caseFacts[id];
  return facts.for ? <p className="case-for">{facts.for}</p> : null;
}

// The iron chain and its crystals, drawn behind and over the case, and where
// the chain ends, who the system was for.
export function CaseIron({ id }: { id: CaseId }) {
  const back = React.useRef<SVGSVGElement>(null);
  const front = React.useRef<SVGSVGElement>(null);
  const facts: CaseFacts = caseFacts[id];

  React.useEffect(() => drawCaseIron(back.current!, front.current!, back.current!.closest("main")!), []);

  return (
    <>
      <svg ref={back} className="case-iron case-iron-back" aria-hidden="true" />
      <div className="case-end" aria-hidden="true">
        <p>
          <span>for</span> <b>{facts.served}</b>
        </p>
      </div>
      <svg ref={front} className="case-iron case-iron-front" aria-hidden="true" />
    </>
  );
}
