import { expect, test } from "@playwright/test";
import { routes } from "./public-routes";

// The Crystal Pendant: the favicon, its .ico fallback, and the home-screen
// icon, each linked from the page and served as itself rather than as the
// app's index.html.
const icons = [
  { selector: 'link[rel="icon"][type="image/svg+xml"]', type: /^image\/svg\+xml/ },
  { selector: 'link[rel="icon"][sizes="32x32"]', type: /^image\/(x-icon|vnd\.microsoft\.icon)/, size: 32 },
  { selector: 'link[rel="apple-touch-icon"]', type: /^image\/png/, size: 180 },
] as const;

// Width and height from an .ico's first directory entry (0 means 256) or a
// PNG's IHDR chunk.
function dimensions(body: Buffer, type: string) {
  if (type.startsWith("image/png")) return [body.readUInt32BE(16), body.readUInt32BE(20)];
  return [body[6] || 256, body[7] || 256];
}

test("the page links the Crystal Pendant icons, and each one resolves", async ({
  page,
  request,
}) => {
  await page.goto("/");
  for (const icon of icons) {
    const link = page.locator(`head ${icon.selector}`);
    await expect(link, icon.selector).toHaveCount(1);
    const href = await link.getAttribute("href");
    const response = await request.get(href!);
    expect(response.status(), href!).toBe(200);
    const type = response.headers()["content-type"];
    expect(type, href!).toMatch(icon.type);
    if ("size" in icon) {
      expect(dimensions(await response.body(), type), href!).toEqual([icon.size, icon.size]);
    }
  }
});

test("the header shows the mark beside the name on every route, as decoration", async ({
  page,
}) => {
  for (const [route] of routes) {
    await page.goto(route);
    const home = page.getByRole("banner").getByRole("link", { name: "Jerome Mendoza, home" });
    await expect(home, route).toHaveCount(1);
    await expect(home, route).toContainText("Jerome Mendoza");

    const mark = home.locator("img, svg");
    await expect(mark, route).toHaveCount(1);
    await expect(mark, route).toBeVisible();
    const box = (await mark.boundingBox())!;
    expect(box.width, route).toBeGreaterThanOrEqual(20);
    expect(Math.abs(box.width - box.height), route).toBeLessThan(1);

    // Assistive tech meets one picture in the header: the Manila clock.
    const pictures = page.getByRole("banner").getByRole("img");
    await expect(pictures, route).toHaveCount(1);
    await expect(pictures, route).toHaveAccessibleName(/in Manila$/);
  }
});
