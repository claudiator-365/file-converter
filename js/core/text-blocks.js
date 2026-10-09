// Everything that is not a table: text split into blocks (Smallpdf-style).
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // everything else: horizontal bands of text, columns inside a band, one cell per column (like Smallpdf's text blocks)
  blocks(rows, H, pageW) {
    const out = [];
    if (!rows.length)
      return out;
    const hm = X.median(rows.map(r => r.h)), bands = [];
    let cur = [rows[0]];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1], b = rows[i], rule = b.y - a.y > hm * 1.8 && H.some(l => l.y > a.y + a.h * .4 && l.y < b.y - b.h * .8 && l.x1 - l.x0 >= 30), sep = !a.cells.some(p => b.cells.some(q => p.x0 < q.x1 && q.x0 < p.x1));
      if (b.y - a.y > hm * 2.5 || rule || (sep && b.y - a.y > hm * 1.5)) {
        bands.push(cur);
        cur = [b];
      }
      else
        cur.push(b);
    }
    bands.push(cur);
    for (const bd of bands) {
      const cs = bd.flatMap(r => r.cells.map(c => ({ ...c, r }))), cb = X.cols(cs, 0), colOf = c => { let best = 0, bo = -1e9; cb.forEach((b, k) => { const o = Math.min(b[1], c.x1) - Math.max(b[0], c.x0); if (o > bo) {
        bo = o;
        best = k;
      } }); return best; };
      const lines = cb.map(() => []);
      cs.forEach(c => lines[colOf(c)].push(c));
      const cells = cb.map((b, k) => {
        const ls = lines[k], byRow = [];
        ls.forEach(c => { const e = byRow.find(x => x.r === c.r); if (e)
          e.cs.push(c);
        else
          byRow.push({ r: c.r, cs: [c] }); });
        byRow.sort((p, q) => p.r.y - q.r.y);
        const txt = byRow.map(e => e.cs.sort((p, q) => p.x0 - q.x0).map(c => c.t).join(' ')).join('\n'), ft = X.fontOf(ls.map(c => ({ f: c.f, h: c.h })));
        const ext = byRow.map(e => [Math.min(...e.cs.map(c => c.x0)), Math.max(...e.cs.map(c => c.x1))]), mid = (b[0] + b[1]) / 2;
        let al = 'left';
        if (ext.length > 1) {
          if (ext.every(e => Math.abs((e[0] + e[1]) / 2 - mid) <= 3) && ext.some(e => e[0] - b[0] > 6))
            al = 'center';
          else if (ext.every(e => Math.abs(e[1] - b[1]) <= 3) && ext.some(e => e[0] - b[0] > 3))
            al = 'right';
        }
        else if (cb.length === 1 && Math.abs(mid - pageW / 2) <= pageW * .03 && b[1] - b[0] < pageW * .9)
          al = 'center';
        return { t: txt, al, fn: ft.fn, fs: ft.fs };
      });
      const tot = pageW * .9 / CFG.colWidthPt, ext = cb.map(b => (b[1] - b[0]) / CFG.colWidthPt), sum = ext.reduce((a, b) => a + b, 0), extra = Math.max(0, tot - sum) / cb.length;
      const ys = bd.map(r => r.y);
      out.push({ kind: 'block', top: bd[0].y, left: cb[0][0], cw: cb.length === 1 ? [+tot.toFixed(1)] : ext.map(e => +(e + extra).toFixed(1)), rh: [+Math.max(12, Math.max(...ys) - Math.min(...ys) + hm * 1.4).toFixed(2)], rows: [cells], merges: [], border: false, conf: 1 });
    }
    return out;
  }
});
