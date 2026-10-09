// Tables drawn with lines: builds the cell grid and merged cells from the rules.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // ruled tables: cells come from the drawn lines, merged where an inner line is missing
  grids(H, V, items) {
    const sg = [...H.map(s => ({ h: 1, s })), ...V.map(s => ({ h: 0, s }))], par = sg.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
    for (let i = 0; i < sg.length; i++)
      for (let j = i + 1; j < sg.length; j++) {
        const a = sg[i], b = sg[j];
        if (a.h === b.h)
          continue;
        const hh = a.h ? a.s : b.s, vv = a.h ? b.s : a.s;
        if (vv.x >= hh.x0 - 2 && vv.x <= hh.x1 + 2 && hh.y >= vv.y0 - 2 && hh.y <= vv.y1 + 2)
          par[f(i)] = f(j);
      }
    const comp = {};
    sg.forEach((s, i) => (comp[f(i)] = comp[f(i)] || []).push(s));
    const cl = a => { a = [...a].sort((p, q) => p - q); const o = []; for (const v of a)
      if (!o.length || v - o[o.length - 1] > 2.5)
        o.push(v); return o; };
    const used = new Set(), sheets = [];
    for (const g of Object.values(comp)) {
      const hs = g.filter(s => s.h).map(s => s.s), vs = g.filter(s => !s.h).map(s => s.s);
      if (hs.length < 2 || vs.length < 2)
        continue;
      const ys = cl(hs.map(s => s.y)), xs = cl(vs.map(s => s.x));
      if (ys.length < 2 || xs.length < 2)
        continue;
      const nr = ys.length - 1, nc = xs.length - 1, inb = it => { const cx = it.x + it.w / 2, cy = it.y - it.h * .3; return cx >= xs[0] - 1 && cx <= xs[nc] + 1 && cy >= ys[0] - 1 && cy <= ys[nr] + 1; };
      const mine = items.filter(inb);
      if (!mine.length)
        continue;
      const ve = (c, r) => vs.some(s => Math.abs(s.x - xs[c]) <= 3 && s.y0 <= ys[r] + 3 && s.y1 >= ys[r + 1] - 3), he = (r, c) => hs.some(s => Math.abs(s.y - ys[r]) <= 3 && s.x0 <= xs[c] + 3 && s.x1 >= xs[c + 1] - 3);
      const p2 = Array.from({ length: nr * nc }, (_, i) => i), f2 = i => p2[i] === i ? i : (p2[i] = f2(p2[i]));
      for (let r = 0; r < nr; r++)
        for (let c = 0; c < nc; c++) {
          if (c < nc - 1 && !ve(c + 1, r))
            p2[f2(r * nc + c)] = f2(r * nc + c + 1);
          if (r < nr - 1 && !he(r + 1, c))
            p2[f2(r * nc + c)] = f2((r + 1) * nc + c);
        }
      const gr = {};
      for (let i = 0; i < nr * nc; i++)
        (gr[f2(i)] = gr[f2(i)] || []).push(i);
      const own = Array(nr * nc).fill(null), merges = [], box = {};
      for (const m of Object.values(gr)) {
        const rs = m.map(i => Math.floor(i / nc)), cs = m.map(i => i % nc), r0 = Math.min(...rs), r1 = Math.max(...rs), c0 = Math.min(...cs), c1 = Math.max(...cs);
        if (m.length !== (r1 - r0 + 1) * (c1 - c0 + 1)) {
          m.forEach(i => { const r = Math.floor(i / nc), c = i % nc; own[i] = [r, c]; box[i] = [r, c, r, c]; });
          continue;
        }
        m.forEach(i => { own[i] = [r0, c0]; });
        box[r0 * nc + c0] = [r0, c0, r1, c1];
        if (m.length > 1)
          merges.push([r0, c0, r1, c1]);
      }
      const bucket = {};
      for (const it of mine) {
        let c = 0;
        while (c < nc - 1 && it.x + it.w / 2 >= xs[c + 1])
          c++;
        let r = 0;
        while (r < nr - 1 && it.y - it.h * .3 >= ys[r + 1])
          r++;
        const o = own[r * nc + c];
        (bucket[o[0] * nc + o[1]] = bucket[o[0] * nc + o[1]] || []).push(it);
        used.add(it);
      }
      const rows = Array.from({ length: nr }, () => Array.from({ length: nc }, () => ({})));
      for (const [k, b] of Object.entries(box)) {
        const [r0, c0, r1, c1] = b, its = bucket[k] || [], cell = rows[r0][c0];
        if (!its.length)
          continue;
        const rr = X.rows(its, { k: 3 }), t = rr.map(r => r.cells.map(c => c.t).join(' ')).join(' ').trim(), n = X.num(t), ft = X.fontOf(its);
        const l0 = Math.min(...rr.flatMap(r => r.cells.map(c => c.x0))), l1 = Math.max(...rr.flatMap(r => r.cells.map(c => c.x1))), lg = l0 - xs[c0], rg = xs[c1 + 1] - l1;
        cell.al = Math.abs(lg - rg) <= 4 && lg > 6 ? 'center' : rg < lg - 4 ? 'right' : 'left';
        cell.fn = ft.fn;
        cell.fs = ft.fs;
        if (n) {
          cell.v = n.v;
          cell.z = n.z;
        }
        else
          cell.t = t;
      }
      sheets.push({ kind: 'ruled', top: ys[0], left: xs[0], cw: xs.slice(1).map((x, i) => +((x - xs[i]) / CFG.colWidthPt).toFixed(1)), rh: ys.slice(1).map((y, i) => +(y - ys[i]).toFixed(2)), rows, merges, border: true, conf: 1 });
    }
    return { sheets, used };
  }
});
