// node scripts/build.mjs  ->  dist/folio.html
// Inlines css/*.css and js/**/*.js into ONE html file (needed for publishing as a single claude.ai artifact,
// or to hand someone a single file). The CDN <script src="https://..."> tags are left alone.
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([^"]+)" \/>/g, (_, f) => `<style>\n/* ${f} */\n${read(f)}</style>`);
html = html.replace(/<script src="((?!https?:)[^"]+)"><\/script>/g, (_, f) => `<script>\n/* ${f} */\n${read(f).replace(/<\/script/g, '<\\/script')}</script>`);
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/folio.html'), html);
console.log('wrote dist/folio.html', (html.length / 1024).toFixed(1) + ' KB');
