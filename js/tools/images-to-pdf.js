// Images to PDF: PNG/JPG files into one PDF.
function imgTool(root) {
  const size = sel([['fit', 'Same size as the image'], ['a4', 'A4 page, image centered']], 'fit');
  const run = h('button', { class: 'btn primary', disabled: '', onclick: () => busy(run, async () => {
      const o = await PDFDocument.create();
      for (const f of L.files()) {
        const by = new Uint8Array(await f.arrayBuffer()), img = f.type === 'image/png' ? await o.embedPng(by) : await o.embedJpg(by);
        let w = img.width, hh = img.height;
        if (size.value === 'fit') {
          const k = Math.min(1, 1000 / Math.max(w, hh));
          w *= k;
          hh *= k;
          o.addPage([w, hh]).drawImage(img, { x: 0, y: 0, width: w, height: hh });
        }
        else {
          const PW = 595.28, PH = 841.89, m = 28, k = Math.min((PW - 2 * m) / w, (PH - 2 * m) / hh);
          w *= k;
          hh *= k;
          o.addPage([PW, PH]).drawImage(img, { x: (PW - w) / 2, y: (PH - hh) / 2, width: w, height: hh });
        }
      }
      await save(await o.save(), 'images.pdf');
    }) }, 'Create PDF');
  const L = fileList(fs => { run.disabled = !fs.length; });
  pick(root, ['image/png', 'image/jpeg'], true, 'Choose PNG or JPG images', L.add);
  root.append(L.el, h('div', { class: 'controls' }, L2('Page size', size)), h('div', { class: 'bar' }, run));
}
