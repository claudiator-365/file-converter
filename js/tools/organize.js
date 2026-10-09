// Organize pages: rotate, reorder, delete pages.
function organizeTool(root) {
  onePdf(root, async (f, buf) => {
    const status = h('p', { class: 'note' }, 'Loading pages…');
    root.append(status);
    const view = await openPdfJs(buf);
    let pages = [];
    for (let i = 0; i < view.numPages; i++)
      pages.push({ i, rot: 0, c: await pageToCanvas(await view.getPage(i + 1), .3) });
    status.remove();
    const grid = h('div', { class: 'thumbs' });
    const run = B('Save PDF', () => busy(run, async () => {
      const src = await PDFDocument.load(buf, { ignoreEncryption: true }), o = await PDFDocument.create();
      const cp = await o.copyPages(src, pages.map(p => p.i));
      cp.forEach((pg, k) => { pg.setRotation(degrees((((pg.getRotation().angle + pages[k].rot) % 360) + 360) % 360)); o.addPage(pg); });
      await save(await o.save(), stem(f) + '-organized.pdf');
    }), 'primary');
    function draw() {
      grid.replaceChildren(...pages.map((p, k) => {
        const r = p.rot % 180 !== 0, c = p.c;
        const fit = r ? Math.min(160 / c.height, 190 / c.width) : Math.min(160 / c.width, 190 / c.height);
        c.style.width = c.width * fit + 'px';
        c.style.height = c.height * fit + 'px';
        c.style.transform = `rotate(${p.rot}deg)`;
        const mv = d => () => { const j = k + d; if (j >= 0 && j < pages.length) {
          [pages[k], pages[j]] = [pages[j], pages[k]];
          draw();
        } };
        return h('div', {}, h('div', { class: 'th' }, c), h('div', { class: 'note', style: 'text-align:center' }, 'Page ' + (p.i + 1)), h('div', { class: 'tc' }, B('↺', () => { p.rot -= 90; draw(); }, 'sm'), B('↻', () => { p.rot += 90; draw(); }, 'sm'), B('◀', mv(-1), 'sm'), B('▶', mv(1), 'sm'), B('✕', () => { pages.splice(k, 1); draw(); }, 'sm')));
      }));
      run.disabled = !pages.length;
    }
    root.append(h('p', { class: 'note' }, 'Rotate, move or delete pages, then save.'), grid, h('div', { class: 'bar' }, run));
    draw();
  });
}
