// Page numbers: number the pages of a document.
function numbersTool(root) {
  onePdf(root, async (f, buf) => {
    const pos = sel([['bc', 'Bottom center'], ['br', 'Bottom right'], ['bl', 'Bottom left'], ['tc', 'Top center'], ['tr', 'Top right']], 'bc'), start = h('input', { type: 'number', value: 1 }), style = sel([['n', '1, 2, 3'], ['of', 'Page 1 of N']], 'n');
    const run = B('Add numbers', () => busy(run, async () => {
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true }), font = await doc.embedFont(StandardFonts.Helvetica), pgs = doc.getPages(), s0 = +start.value || 1, last = s0 + pgs.length - 1;
      pgs.forEach((pg, i) => {
        const { width: W, height: H } = pg.getSize(), t = style.value === 'n' ? String(s0 + i) : `Page ${s0 + i} of ${last}`, tw = font.widthOfTextAtSize(t, 10), p = pos.value;
        const x = p[1] === 'c' ? (W - tw) / 2 : p[1] === 'l' ? 36 : W - 36 - tw, y = p[0] === 'b' ? 24 : H - 34;
        pg.drawText(t, { x, y, size: 10, font, color: rgb(.1, .1, .1) });
      });
      await save(await doc.save(), stem(f) + '-numbered.pdf');
    }), 'primary');
    root.append(h('div', { class: 'controls' }, L2('Position', pos), L2('Start at', start), L2('Style', style)), h('div', { class: 'bar' }, run));
  });
}
