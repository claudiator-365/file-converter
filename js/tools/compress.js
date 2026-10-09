// Compress PDF: re-render pages as JPEG to shrink scans.
function compressTool(root) {
  onePdf(root, async (f, buf) => {
    const lvl = sel([['1.2,0.5', 'Smallest file'], ['1.6,0.65', 'Balanced'], ['2.2,0.8', 'Best quality']], '1.6,0.65'), msg = h('p', { class: 'note' });
    const run = B('Compress', () => busy(run, async () => {
      const [k, q] = lvl.value.split(',').map(Number), view = await openPdfJs(buf), doc = await PDFDocument.create();
      for (let i = 1; i <= view.numPages; i++) {
        msg.textContent = `Page ${i} of ${view.numPages}…`;
        const pg = await view.getPage(i), b = pg.getViewport({ scale: 1 }), c = await pageToCanvas(pg, k);
        const img = await doc.embedJpg(new Uint8Array(await (await toBlob(c, 'image/jpeg', q)).arrayBuffer()));
        doc.addPage([b.width, b.height]).drawImage(img, { x: 0, y: 0, width: b.width, height: b.height });
      }
      const res = await doc.save();
      msg.textContent = `${fmt(f.size)} → ${fmt(res.length)}. ` + (res.length >= f.size ? 'This file was already small, so keep the original.' : 'Pages are now images, so text can no longer be selected.');
      await save(res, stem(f) + '-compressed.pdf');
    }), 'primary');
    root.append(h('div', { class: 'controls' }, L2('Quality', lvl)), h('div', { class: 'bar' }, run), msg);
  });
}
