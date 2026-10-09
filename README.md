# Folio – browser PDF toolkit

Edit/sign PDFs, merge, split, organize, compress, convert images <-> PDF, watermark, number pages, and **convert PDF to Excel**
(one sheet per table / text block, like Smallpdf). Plain HTML + CSS + JavaScript. **No framework, no bundler, no server.**

## Run it
* **Just open `index.html`** in Chrome or Edge (double-click). Internet is needed because the libraries load from a CDN.
* Or serve the folder: `npm run serve` (any static server works).
* Downloads are normal browser downloads. (Inside claude.ai the page uses claude.ai's download prompt instead.)

## Folder map
```
folio/
├── index.html                 The page skeleton. Lists every CSS/JS file IN LOAD ORDER.
├── css/
│   ├── tokens.css             Colours (light + dark). Change the look here.
│   ├── base.css               Body, header, headings, footer.
│   ├── home.css               The home grid of tools.
│   ├── components.css         Buttons, drop zone, bars, inputs, lists, thumbnails, preview tables.
│   └── editor.css             Edit/Sign editor: page stage, placed text, signature dialog.
├── js/
│   ├── config.js              Settings you may change (column-width scale, upload limits, CDN URLs).
│   ├── setup.js               Shared globals (PDFLib handles, #app, current tool, downloads hook).
│   ├── utils/
│   │   ├── dom.js             h() DOM builder, B() button, sel() select, busy().
│   │   ├── format.js          fmt() file size, stem(), clean(), ranges() ("1-3,5").
│   │   ├── files.js           save() download, pick() drop zone, onePdf(), fileList().
│   │   └── pdf.js             openPdfJs(), pageToCanvas(), toBlob().
│   ├── core/                  The PDF -> Excel engine (object X). No DOM code in here.
│   │   ├── namespace.js       const X = {};  (must load first)
│   │   ├── numbers.js         "₱1,250.00" -> number, match labels.
│   │   ├── text.js            Text items -> rows -> cells -> columns; font guess.
│   │   ├── lines.js           Reads drawn lines/box borders from the page (pdf.js operators).
│   │   ├── ruled-tables.js    Tables drawn with lines: cell grid + merged cells.
│   │   ├── aligned-tables.js  Tables with no borders + joining tables across pages.
│   │   ├── text-blocks.js     Everything else, split into text blocks.
│   │   ├── analyze.js         Runs the steps above for a whole PDF -> list of sheets.
│   │   └── workbook.js        Writes the sheets to an ExcelJS workbook.
│   ├── tools/                 One file per tool (UI + logic):
│   │   edit-sign.js  pdf-to-excel.js  merge.js  split.js  organize.js
│   │   compress.js  images-to-pdf.js  pdf-to-images.js  watermark.js  page-numbers.js
│   └── app.js                 TOOLS list (the home grid), tiny router go()/render(), start-up. Loads last.
├── scripts/build.mjs          `npm run build` -> dist/folio.html (everything inlined into ONE file).
├── dist/folio.html            Generated single-file version (this is what gets published to claude.ai).
└── tests/
    ├── samples/*.pdf          Your real RFQ + synthetic PDFs (flat form, ruled grid, prose, scan, mixed).
    ├── load.mjs               Loads js/config.js + js/core/* exactly as index.html does.
    ├── run.mjs                Prints every sheet the converter would produce for given PDFs.
    ├── smoke.mjs              Loads ALL scripts against a fake DOM and opens every tool screen.
    ├── preview_xlsx.mjs + to_xlsx.py   Produce a real .xlsx you can open, without a browser.
    └── gen_pdfs.py            Regenerates the synthetic sample PDFs.
```

## Why plain `<script>` files and not `import`/`export`?
`index.html` loads files with ordinary `<script src>` tags in a fixed order, and they share one global scope.
That is why it works by double-click (browsers block ES-module imports from `file://`). The price is that load order matters:
`config.js` -> `setup.js` -> `utils/` -> `core/` -> `tools/` -> `app.js`. If you add a file, add its `<script>` tag in the right place in `index.html`.
(If you later want real modules: add `type="module"`, put `export`/`import` in the files, and run via `npm run serve`.)

## Where do I change X?
| I want to... | Edit |
|---|---|
| Change colours / dark mode | `css/tokens.css` |
| Change the home screen layout | `css/home.css`, and the `TOOLS` list in `js/app.js` |
| Add a new tool | new file in `js/tools/` + `<script>` tag in `index.html` + an entry in `TOOLS` (`js/app.js`) |
| Change upload size/page limit, Excel column width scale | `js/config.js` |
| Change how Excel column widths/row heights look | `CFG.colWidthPt` in `js/config.js` |
| How text pieces are grouped into rows (tolerance) | `js/core/text.js` -> `rows()` (`tol`) |
| When two text pieces become one cell | `js/core/text.js` -> `rows()` option `k` (blocks use 2.6, ruled cells 3) |
| How the page is split into text blocks | `js/core/text-blocks.js` -> `blocks()` (`hm * 2.5` gap, `1.8` rule, `1.5` no-overlap) |
| What counts as a borderless table | `js/core/aligned-tables.js` -> `tables()` (`>=3 rows`, `>=3 columns`, `conf >= .6`) |
| Fonts written to Excel | `js/core/text.js` -> `fontOf()` |
| Number detection (₱, %, negatives, `007` stays text) | `js/core/numbers.js` -> `num()` |
| Excel styling (borders, alignment, wrap) | `js/core/workbook.js` -> `book()` |
| The "scanned PDF" / warning messages | `js/tools/pdf-to-excel.js` |
| Edit/Sign editor behaviour | `js/tools/edit-sign.js` |

## How a tool is built (example: `js/tools/merge.js`)
```js
function mergeTool(root) {          // root = the empty <div> the app gives the tool
  pick(root, ['application/pdf'], true, 'Choose PDFs', files => { ... });   // drop zone
  ...
  await save(bytes, 'merged.pdf');  // triggers the download
}
```
Register it in `js/app.js`: `{ id: 'merge', name: 'Merge PDF', d: 'description', run: mergeTool }`.

## PDF -> Excel pipeline (`js/core/`)
1. `text.js` `items()` – text with positions. 2. `lines.js` `segs()` – drawn lines/borders.
3. `ruled-tables.js` `grids()` – cell grid + merged cells from the lines (this is how the quotation table matches Smallpdf's Table 9).
4. `aligned-tables.js` `tables()`/`merge()` – borderless tables, joined across pages.
5. `text-blocks.js` `blocks()` – remaining text, one cell per column.
6. `workbook.js` `book()` – writes the ExcelJS workbook.  `analyze.js` ties 1–5 together.
Scanned PDFs (no text layer) are detected and reported; OCR is not included.

## Tests (Node 18+)
```
npm install              # pdfjs-dist (tests) + prettier (formatting)
npm test                 # smoke test + prints the sheets for your RFQ
npm run test:all         # all sample PDFs
node tests/preview_xlsx.mjs tests/samples/26-2091.pdf out.json && python3 tests/to_xlsx.py out.json out.xlsx
```
The tests read the same files as the page, so there is no second copy of the code.

## Build the single file
`npm run build` -> `dist/folio.html`. Needed only if you must hand someone ONE file or publish it as a single artifact.

## Formatting
Code was auto-formatted once, but a few dense lines remain in `js/core/`. Run `npm run format` (Prettier) to wrap them.
Prettier is not run by the tests.

## Verified / not verified
Verified: the converter on all sample PDFs; every script loads in order and every tool screen opens (fake-DOM smoke test); your quotation table matches Smallpdf's Table 9.
Not verified: running in a real browser and the real ExcelJS call. Open one downloaded .xlsx to confirm.
