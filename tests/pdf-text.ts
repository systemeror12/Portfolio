import { inflateSync } from "node:zlib";

// Reads what a PDF shows and carries: the text drawn on its pages, decoded
// through each font's ToUnicode map, followed by its dictionaries (links,
// document info) and its metadata. It covers the resume PDF's simple layout
// (hex-encoded text in Tj and TJ), not every PDF.
export function pdfText(pdf: Buffer): string {
  const source = pdf.toString("latin1");
  const objects = new Map<string, { dictionary: string; stream?: Buffer }>();

  for (const match of source.matchAll(/(\d+) 0 obj\s*([\s\S]*?)endobj/g)) {
    const [, id, body] = match;
    const streamStart = body.match(/stream\r?\n/);
    if (!streamStart) {
      objects.set(id, { dictionary: body });
      continue;
    }
    const dictionary = body.slice(0, streamStart.index);
    const offset = match.index + match[0].indexOf(body) + streamStart.index! + streamStart[0].length;
    const raw = pdf.subarray(offset, offset + body.lastIndexOf("endstream") - streamStart.index! - streamStart[0].length);
    objects.set(id, {
      dictionary,
      stream: /\/FlateDecode/.test(dictionary) ? inflateSync(raw) : raw,
    });
  }

  // Each font's code-to-character map, by font object.
  const maps = new Map<string, Map<string, string>>();
  for (const [id, { dictionary }] of objects) {
    const toUnicode = dictionary.match(/\/ToUnicode (\d+) 0 R/);
    if (!toUnicode) continue;
    const cmap = objects.get(toUnicode[1])!.stream!.toString("latin1");
    const map = new Map<string, string>();
    const character = (hex: string) =>
      String.fromCodePoint(...hex.match(/.{4}/g)!.map((unit) => parseInt(unit, 16)));
    for (const block of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
      for (const [, code, unicode] of block[1].matchAll(/<(\w+)>\s*<(\w+)>/g)) {
        map.set(code.toUpperCase(), character(unicode));
      }
    }
    for (const block of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
      for (const [, first, last, unicode] of block[1].matchAll(/<(\w+)>\s*<(\w+)>\s*<(\w+)>/g)) {
        const start = parseInt(unicode, 16);
        for (let code = parseInt(first, 16); code <= parseInt(last, 16); code++) {
          const key = code.toString(16).toUpperCase().padStart(first.length, "0");
          map.set(key, String.fromCodePoint(start + code - parseInt(first, 16)));
        }
      }
    }
    maps.set(id, map);
  }

  // Resource names such as /F1, pointing at those fonts.
  const fonts = new Map<string, Map<string, string>>();
  for (const { dictionary } of objects.values()) {
    for (const [, name, id] of dictionary.matchAll(/\/(\w+)\s+(\d+) 0 R/g)) {
      if (maps.has(id)) fonts.set(name, maps.get(id)!);
    }
  }

  const pages = [...source.matchAll(/\/Kids\s*\[([^\]]*)\]/g)]
    .flatMap(([, kids]) => [...kids.matchAll(/(\d+) 0 R/g)].map(([, id]) => id))
    .flatMap((id) => [...(objects.get(id)?.dictionary.match(/\/Contents (\d+) 0 R/) ?? [])].slice(1));

  const drawn = pages.map((id) => {
    const content = objects.get(id)!.stream!.toString("latin1");
    return [...content.matchAll(/BT([\s\S]*?)ET/g)]
      .map(([, block]) => {
        let font = new Map<string, string>();
        let line = "";
        for (const [, name, hex] of block.matchAll(/\/(\w+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f]*)>/g)) {
          if (name) font = fonts.get(name) ?? new Map();
          else for (const code of hex.match(/../g) ?? []) line += font.get(code.toUpperCase()) ?? "";
        }
        return line;
      })
      .join("\n");
  });

  const carried = [...objects.values()].flatMap(({ dictionary, stream }) =>
    /\/Type\s*\/Metadata/.test(dictionary) && stream ? [dictionary, stream.toString("utf8")] : [dictionary],
  );

  return [...drawn, ...carried].join("\n");
}
