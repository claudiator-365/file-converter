// PDF to images: each page as PNG or JPG.
function pdf2imgTool(root) {
  onePdf(root, async (f, buf) => {
    const kind = sel([['png', 'PNG'], ['jpg', 'JPG']], 'png'), res = sel([['1.5', 'Screen'], ['2.5', 'Print quality']], '2.5'), msg = h('p', { class: 'note' });
    const run = B('Convert', () => busy(run, async () => {
      const view = await openPdfJs(buf), ext = kind.value, mime = ext === 'png' ? 'image/png' : 'image/jpeg', out = [];
      for (let i = 1; i <= view.numPages; i++) {
        msg.textContent = `Page ${i} of ${view.numPages}…`;
        out.push([`${stem(f)}-${i}.${ext}`, await toBlob(await pageToCanvas(await view.getPage(i), +res.value), mime, .92)]);
      }
      msg.textContent = '';
      if (out.length === 1)
        await save(out[0][1], out[0][0]);
      else {
        const z = new JSZip();
        out.forEach(([n, b]) => z.file(n, b));
        await save(await z.generateAsync({ type: 'blob' }), stem(f) + '-images.zip');
      }
    }), 'primary');
    root.append(h('div', { class: 'controls' }, L2('Format', kind), L2('Resolution', res)), h('div', { class: 'bar' }, run), msg);
  });
}
