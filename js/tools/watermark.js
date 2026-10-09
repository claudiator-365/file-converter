// Watermark: stamp text across every page.
function watermarkTool(root) {
  onePdf(root, async (f, buf) => {
    const txt = h('input', { type: 'text', value: 'CONFIDENTIAL' }), sz = h('input', { type: 'number', value: 64, min: 8, max: 200 }), op = h('input', { type: 'range', min: .05, max: .8, step: .05, value: .25 }), ang = h('input', { type: 'number', value: 45, min: -90, max: 90 });
    const run = B('Add watermark', () => busy(run, async () => {
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true }), font = await doc.embedFont(StandardFonts.HelveticaBold);
      const t = clean(txt.value), size = +sz.value, th = +ang.value * Math.PI / 180, c = Math.cos(th), s = Math.sin(th), tw = font.widthOfTextAtSize(t, size);
      for (const pg of doc.getPages()) {
        const { width: W, height: H } = pg.getSize();
        pg.drawText(t, { x: W / 2 - (tw / 2) * c + size * .35 * s, y: H / 2 - (tw / 2) * s - size * .35 * c, size, font, color: rgb(.5, .5, .5), opacity: +op.value, rotate: degrees(+ang.value) });
      }
      await save(await doc.save(), stem(f) + '-watermarked.pdf');
    }), 'primary');
    root.append(h('div', { class: 'controls' }, L2('Text', txt), L2('Size', sz), L2('Angle', ang), L2('Opacity', op)), h('div', { class: 'bar' }, run));
  });
}
