// Split PDF: extract page ranges, or one file per page.
function splitTool(root) {
  onePdf(root, async (f, buf) => {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true }), n = src.getPageCount();
    const inp = h('input', { type: 'text', placeholder: 'e.g. 1-3, 5, 8-10' }), mode = sel([['one', 'One file with those pages'], ['each', 'A separate file per page (zip)']], 'one');
    const run = B('Split', () => busy(run, async () => {
      const idx = ranges(inp.value, n);
      if (mode.value === 'one') {
        const o = await PDFDocument.create();
        (await o.copyPages(src, idx)).forEach(p => o.addPage(p));
        await save(await o.save(), stem(f) + '-extract.pdf');
      }
      else {
        const z = new JSZip();
        for (const i of idx) {
          const o = await PDFDocument.create();
          (await o.copyPages(src, [i])).forEach(p => o.addPage(p));
          z.file(`${stem(f)}-p${i + 1}.pdf`, await o.save());
        }
        await save(await z.generateAsync({ type: 'blob' }), stem(f) + '-pages.zip');
      }
    }), 'primary');
    root.append(h('p', { class: 'note' }, n + ' pages. Leave Pages blank to use all of them.'), h('div', { class: 'controls' }, L2('Pages', inp), L2('Output', mode)), h('div', { class: 'bar' }, run));
  });
}
