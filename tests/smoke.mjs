// node tests/smoke.mjs  -> loads every script of index.html in order against a fake DOM and renders the home screen.
// Catches typos / missing files / wrong load order without needing a browser.
import fs from 'fs'; import vm from 'vm';
const root = new URL('../', import.meta.url), html = fs.readFileSync(new URL('index.html', root), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map(m => m[1]);
const el = () => ({ children: [], style: {}, classList: { add() {}, remove() {} }, append(...a) { this.children.push(...a); }, replaceChildren(...a) { this.children = a; }, setAttribute() {}, querySelectorAll: () => [], addEventListener() {}, remove() {} });
const app = el(), logo = el();
const ctx = vm.createContext({
  console, setTimeout, URL, Blob, TextDecoder, Promise, alert: m => { throw new Error('alert: ' + m); }, scrollTo() {},
  PDFLib: { PDFDocument: {}, StandardFonts: {}, rgb() {}, degrees() {} },
  pdfjsLib: { GlobalWorkerOptions: {}, getDocument() {}, Util: {}, OPS: {} }, JSZip: function () {},
  document: { getElementById: id => (id === 'app' ? app : logo), createElement: el, createTextNode: t => ({ nodeType: 3, t }), body: el(), head: el() },
  window: {},
});
for (const f of files) vm.runInContext(fs.readFileSync(new URL(f, root), 'utf8'), ctx, { filename: f });
const tools = vm.runInContext('TOOLS.map(t => t.id)', ctx);
console.log('loaded', files.length, 'scripts; home rendered', app.children.length, 'blocks; tools:', tools.join(', '));
for (const id of tools) { vm.runInContext(`go('${id}')`, ctx); }   // open every tool screen once
console.log('every tool screen opens without errors');
