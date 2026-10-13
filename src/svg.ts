const svgNamespace = "http://www.w3.org/2000/svg";

export type SvgAttributes = Record<string, string | number>;

// Creates an SVG element with the given attributes and appends it to parent.
export function draw<K extends keyof SVGElementTagNameMap>(
  name: K,
  attributes: SvgAttributes,
  parent: Element,
) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  parent.appendChild(element);
  return element;
}
