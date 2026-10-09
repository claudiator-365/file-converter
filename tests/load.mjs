// Loads config.js + js/core/*.js in the same order index.html does, so tests run the exact code the page runs.
import fs from 'fs';
export const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const files = [...html.matchAll(/<script src="(js\/(?:config|core\/[^"]+)\.js)"><\/script>/g)].map(m => m[1]);
const code = files.map(f => fs.readFileSync(new URL(f, root), 'utf8')).join('\n');
export const X = new Function(code + ';return X')();
export async function analyze(file) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
  return X.analyze(doc, pdfjs.Util, pdfjs.OPS);
}
