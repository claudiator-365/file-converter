// Runs the whole analysis for a PDF document and returns the list of sheets.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  async analyze(doc, Util, OPS, onProg) {
    const per = [], plain = [], emptyPages = [];
    let chars = 0;
    for (let p = 1; p <= doc.numPages; p++) {
      if (onProg)
        onProg(p, doc.numPages);
      const pg = await doc.getPage(p), vp = pg.getViewport({ scale: 1 });
      let items = X.items(await pg.getTextContent(), vp, Util);
      const n = items.reduce((a, i) => a + i.s.trim().length, 0);
      chars += n;
      if (n < 5) {
        emptyPages.push(p);
        continue;
      }
      const { H, V } = X.segs(await pg.getOperatorList(), OPS, vp, Util), g = X.grids(H, V, items), sheets = g.sheets.map(s => ({ ...s, page: p }));
      items = items.filter(i => !g.used.has(i));
      const t = X.tables(X.rows(items), vp.width, p);
      t.tables.forEach((x, k) => { x.firstOnPage = k === 0; x.lastOnPage = k === t.tables.length - 1; plain.push(x); });
      const rest = X.rows(t.rest.flatMap(r => r.items), { k: 2.6, pad: true });
      X.blocks(rest, H, vp.width).forEach(b => sheets.push({ ...b, page: p }));
      per.push(...sheets);
    }
    X.merge(plain).forEach(t => per.push({ ...X.plainSheet(t), page: t.page }));
    per.sort((a, b) => a.page - b.page || a.top - b.top || a.left - b.left);
    return { scanned: emptyPages.length === doc.numPages, emptyPages, sheets: per, chars, pages: doc.numPages };
  }
});
