// Merge PDF: combine several PDFs into one.
function mergeTool(root) {
  const run = h('button', { class: 'btn primary', disabled: '', onclick: () => busy(run, async () => {
      const out = await PDFDocument.create();
      for (const f of L.files()) {
        const d = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
        (await out.copyPages(d, d.getPageIndices())).forEach(p => out.addPage(p));
      }
      await save(await out.save(), 'merged.pdf');
    }) }, 'Merge PDFs');
  const L = fileList(fs => { run.disabled = fs.length < 2; });
  pick(root, ['application/pdf'], true, 'Choose PDFs to merge', L.add);
  root.append(L.el, h('p', { class: 'note' }, 'Add at least two files. Use the arrows to set the order.'), h('div', { class: 'bar' }, run));
}
