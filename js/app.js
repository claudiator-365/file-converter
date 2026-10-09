// Tool list, tiny router (go/render) and start-up. Loaded last.
const TOOLS = [
  { id: 'edit', name: 'Edit PDF', d: 'Add text anywhere on a page, then download.', run: r => editTool(r, false) },
  { id: 'sign', name: 'Sign PDF', d: 'Draw your signature once, place it on any page.', run: r => editTool(r, true) },
  { id: 'pdf2xlsx', name: 'PDF to Excel', d: 'Turn a PDF into a spreadsheet, one sheet per table or block, like Smallpdf.', run: pdf2xlsxTool },
  { id: 'merge', name: 'Merge PDF', d: 'Combine several PDFs into one, in the order you choose.', run: mergeTool },
  { id: 'split', name: 'Split PDF', d: 'Extract page ranges, or save every page as its own file.', run: splitTool },
  { id: 'organize', name: 'Organize pages', d: 'Rotate, reorder and delete pages.', run: organizeTool },
  { id: 'compress', name: 'Compress PDF', d: 'Shrink a heavy scan to fit upload limits.', run: compressTool },
  { id: 'img2pdf', name: 'Images to PDF', d: 'Turn photos and screenshots into one PDF.', run: imgTool },
  { id: 'pdf2img', name: 'PDF to images', d: 'Save each page as PNG or JPG.', run: pdf2imgTool },
  { id: 'watermark', name: 'Watermark', d: 'Stamp text across every page.', run: watermarkTool },
  { id: 'numbers', name: 'Page numbers', d: 'Number the pages of a document.', run: numbersTool }
];
function go(id) { cur = id; render(); scrollTo(0, 0); }
function render() {
  const t = TOOLS.find(x => x.id === cur);
  app.replaceChildren();
  if (!t) {
    app.append(h('h1', {}, 'Fill, merge, split and sign PDFs.'), h('p', { class: 'lede' }, 'Pick a tool, drop in a file, download the result. Everything runs in this tab, so bids and IDs never leave your computer.'), h('div', { class: 'grid' }, TOOLS.map(x => h('button', { class: 'tool', onclick: () => go(x.id) }, h('b', {}, x.name), h('span', {}, x.d)))), h('footer', {}, 'Word and PowerPoint conversion, password protection and OCR for scans need a server, so they are not included.'));
    return;
  }
  const box = h('div');
  app.append(h('button', { class: 'back', onclick: () => go(null) }, '← All tools'), h('h2', {}, t.name), h('p', { class: 'lede' }, t.d), box);
  t.run(box);
}
document.getElementById('logo').onclick = () => go(null);
render();
