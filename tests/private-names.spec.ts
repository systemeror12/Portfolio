// Private-name scan: learns before release whether any public route names a
// client, its banks or counterparties, the employer, a repository codename, or
// the provider name.
//
// The names live only in tests/private-names.local, which `*.local` in
// .gitignore keeps out of the repo, so this check never publishes them. Write
// one name per line; blank lines and lines starting with `#` are ignored. Each
// name matches as a whole word, case-insensitively.
//
// Before a release, with that file in place, run:
//   npx playwright test tests/private-names.spec.ts
// Without the file, the scan skips with a notice saying no private-name scan
// ran. CI never has the file, so it always skips there.
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { routes } from "./public-routes";

const namesFile = new URL("./private-names.local", import.meta.url);

const privateNames = existsSync(namesFile)
  ? readFileSync(namesFile, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  : undefined;

const missingNotice =
  "tests/private-names.local is missing, so no private-name scan ran.";
if (!privateNames) console.warn(`Private-name scan skipped: ${missingNotice}`);

// The names that appear in text as whole words, ignoring case. A word is a run
// of letters, digits, and underscores, so "Corp" does not match "Corporate".
function namesIn(text: string, names: readonly string[]) {
  return names.filter((name) => {
    const words = name.split(/\s+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`(?<![\\p{L}\\p{N}_])${words.join("\\s+")}(?![\\p{L}\\p{N}_])`, "iu").test(text);
  });
}

test("a name matches only as a whole word, in any case", () => {
  const names = ["Quillmoor", "Brindle Vale"];

  expect(namesIn("Paid through QUILLMOOR's desk.", names)).toEqual(["Quillmoor"]);
  expect(namesIn("the brindle\nvale ledger", names)).toEqual(["Brindle Vale"]);
  expect(namesIn("Quillmoorish prequillmoor Brindle Valetta", names)).toEqual([]);
});

test.describe("the private-name scan", () => {
  test.skip(!privateNames, missingNotice);

  test("no public route names a private name", async ({ page }) => {
    for (const [path] of routes) {
      await page.goto(path);
      await expect(page.getByRole("main")).toBeVisible();
      const published = await page.evaluate(
        () => `${document.body.innerText}\n${document.documentElement.outerHTML}`,
      );
      // Only how many matched is reported, so a failure never prints a name.
      expect.soft(namesIn(published, privateNames!).length, `private names on ${path}`).toBe(0);
    }
  });
});
