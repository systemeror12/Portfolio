# The resume PDF is generated with LibreOffice

Status: accepted (#88)

## Context

`public/jerome-mendoza-resume.pdf` is printed from
`docs/jerome-mendoza-resume.html`. Nothing recorded how, so the PDF fell
behind the site. We had to pick one generator and make it a repo command.

Options considered:

- (a) LibreOffice: `soffice --headless --convert-to pdf`;
- (b) Playwright's Chromium, already a dev dependency, through `page.pdf()`;
- (c) a manual export, undocumented.

## Decision

We chose (a), run as `npm run resume`. It outputs a 2-page, tagged A4 PDF.
`tests/pdf-text.ts` reads its hex-encoded `Tj`/`TJ` text through each font's
ToUnicode map, and the private-name scan relies on that reader.

## Consequences

- Regenerating the resume needs LibreOffice installed locally. CI never
  regenerates it.
- Chromium's output (b) printed one page, was untagged, and `pdfText()`
  read none of its text, so the scan's "Jerome Mendoza" guard failed.
  Switching to it means extending `pdf-text.ts` first.
- LibreOffice applies only part of the CSS, so some headings come out in
  Liberation Serif. Check the PDF itself, not just the HTML in a browser.
- A test compares the HTML's `h2` and `h3` headings with the PDF's text, so
  forgetting to regenerate the PDF fails the test.
