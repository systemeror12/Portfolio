import type { Page } from "@playwright/test";

// Reads every line of text matched by `selector` against each pixel drawn
// behind it, and lists the lines that fall under 4.5:1 at their worst pixel.
// It strips the page's text colour to capture the backdrop, so measure last.
export async function lowContrastText(page: Page, selector = "body *") {
  // Text scrolls under sticky bars, such as the phone lunette, and is read
  // once it clears them. A full-page capture would freeze a bar over it, so
  // hold each bar where it sits in the flow, which moves nothing else.
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>("body *")) {
      if (getComputedStyle(element).position === "sticky") element.style.position = "relative";
    }
  });

  // Where each line of text sits and what colour it paints.
  const texts = await page.evaluate((selector) =>
    Array.from(document.querySelectorAll(selector))
      .filter((element) => !element.closest("svg, [aria-hidden='true'], .skip-link") && element.checkVisibility())
      .flatMap((element) => {
        const [r, g, b, a = 1] = getComputedStyle(element).color.match(/[\d.]+/g)!.map(Number);
        return Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim())
          .flatMap((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return Array.from(range.getClientRects()).map((rect) => ({
              text: node.textContent!.trim().slice(0, 40),
              colour: { r, g, b, a },
              box: { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height },
            }));
          });
      }),
    selector,
  );

  // The page with its text taken away, so only what sits behind the text is drawn.
  await page.addStyleTag({
    content: "* { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }",
  });
  const backdrop = (await page.screenshot({ fullPage: true, scale: "css" })).toString("base64");

  const failures = await page.evaluate(
    async ({ backdrop, texts }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${backdrop}`;
      await image.decode();
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const luminance = (r: number, g: number, b: number) => {
        const [lr, lg, lb] = [r, g, b].map((channel) => {
          const value = channel / 255;
          return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
      };

      return texts.flatMap(({ text, colour, box }) => {
        const x = Math.max(0, Math.floor(box.x));
        const y = Math.max(0, Math.floor(box.y));
        const width = Math.min(image.width - x, Math.ceil(box.width));
        const height = Math.min(image.height - y, Math.ceil(box.height));
        if (width <= 0 || height <= 0) return [];
        const pixels = context.getImageData(x, y, width, height).data;
        let worst = Infinity;
        for (let i = 0; i < pixels.length; i += 4) {
          const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
          const fore = luminance(
            colour.r * colour.a + r * (1 - colour.a),
            colour.g * colour.a + g * (1 - colour.a),
            colour.b * colour.a + b * (1 - colour.a),
          );
          const back = luminance(r, g, b);
          worst = Math.min(worst, (Math.max(fore, back) + 0.05) / (Math.min(fore, back) + 0.05));
        }
        return worst < 4.5 ? [`${text} (${worst.toFixed(2)})`] : [];
      });
    },
    { backdrop, texts },
  );
  return { lines: texts.length, failures };
}
