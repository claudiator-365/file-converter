// Tables without borders: found from aligned text; joins tables that continue across pages.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // find tables on one page: runs of multi-cell rows, columns from where cells never overlap vertically
  tables(rows, pageW, pg) {
    const out = [], used = new Set();
    if (rows.length < 2)
      return { tables: out, rest: rows };
    const hm = X.median(rows.flatMap(r => r.cells.map(c => c.h))), gaps = [];
    for (let i = 1; i < rows.length; i++)
      gaps.push(rows[i].y - rows[i - 1].y);
    const mg = X.median(gaps), brk = Math.max(hm * 3.6, mg * 2.6), cont = Math.max(hm * 2.2, mg * 1.9), runs = [];
    let run = null;
    for (const r of rows) {
      const m = r.cells.length > 1;
      if (run && r.y - run[run.length - 1].y <= (m ? brk : cont))
        run.push(r);
      else {
        if (run)
          runs.push(run);
        run = m ? [r] : null;
      }
    }
    if (run)
      runs.push(run);
    for (const rn of runs) {
      while (rn.length && rn[rn.length - 1].cells.length < 2)
        rn.pop();
      const multi = rn.filter(r => r.cells.length > 1);
      if (multi.length < 2)
        continue;
      const cnt = {};
      multi.forEach(r => { cnt[r.cells.length] = (cnt[r.cells.length] || 0) + 1; });
      const mode = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || b - a)[0];
      while (rn.length && rn[0].cells.length < Math.max(2, Math.ceil(mode * .5)))
        rn.shift();
      const body = rn.filter(r => r.cells.length > 1);
      if (body.length < 2)
        continue;
      const cs = body.flatMap(r => r.cells), bands = X.cols(cs, Math.floor(body.length * .1));
      if (bands.length < 3)
        continue;
      const bi = c => { let best = 0, bo = -1e9; bands.forEach((b, k) => { const o = Math.min(b[1], c.x1) - Math.max(b[0], c.x0); if (o > bo) {
        bo = o;
        best = k;
      } }); return best; };
      const pitch = X.median(body.slice(1).map((r, i) => r.y - body[i].y)) || hm * 1.3, trows = [];
      let conflicts = 0;
      for (const r of rn) {
        const cells = Array(bands.length).fill('');
        let clash = false;
        for (const c of r.cells) {
          const k = bi(c);
          if (cells[k]) {
            cells[k] += ' ' + c.t;
            clash = true;
          }
          else
            cells[k] = c.t;
        }
        if (r.cells.length === 1 && trows.length) {
          const k = bi(r.cells[0]), p = trows[trows.length - 1];
          if (p.cells[k] && r.y - p.y <= pitch * 1.5) {
            p.cells[k] += ' ' + r.cells[0].t;
            p.y = r.y;
            continue;
          }
        }
        if (clash)
          conflicts++;
        trows.push({ y: r.y, cells });
      }
      const full = trows.filter(t => t.cells.filter(Boolean).length >= Math.ceil(bands.length * .8)).length;
      const conf = (full / trows.length) * .75 + (1 - conflicts / trows.length) * .25;
      if (trows.length < 3 || conf < .6)
        continue;
      out.push({ page: pg, last: pg, bands, rows: trows.map(t => t.cells), pageW, conf, top: rn[0].y });
      rn.forEach(r => used.add(r));
    }
    return { tables: out, rest: rows.filter(r => !used.has(r)) };
  },
  // a table that continues on the next page (same columns) becomes one table
  merge(ts) {
    const out = [];
    for (const t of ts) {
      const p = out[out.length - 1];
      if (p && t.firstOnPage && p.lastOnPage && t.page === p.last + 1 && t.bands.length === p.bands.length && t.bands.every((b, k) => Math.min(b[1], p.bands[k][1]) - Math.max(b[0], p.bands[k][0]) > 0)) {
        const same = t.rows[0].join('|').toLowerCase() === p.rows[0].join('|').toLowerCase();
        p.rows.push(...(same ? t.rows.slice(1) : t.rows));
        p.last = t.page;
        p.lastOnPage = t.lastOnPage;
        p.conf = Math.min(p.conf, t.conf);
      }
      else
        out.push(t);
    }
    out.forEach(t => { t.header = t.rows.length > 1 && t.rows[0].every(s => !s || !X.num(s)) && t.rows[0].some(Boolean); });
    return out;
  },
  // Smallpdf-style sheet for a borderless aligned table
  plainSheet(t) {
    const ft = X.fontOf([]);
    return { kind: 'plain', top: t.top, left: t.bands[0][0], page: t.page, cw: t.bands.map(b => +Math.min(60, Math.max(6, (b[1] - b[0]) / CFG.colWidthPt + 2)).toFixed(1)), rh: [],
      rows: t.rows.map((r, ri) => r.map(s => { if (!s)
        return {}; const n = t.header && ri === 0 ? null : X.num(s); return n ? { v: n.v, z: n.z, al: 'right', fn: 'Arial', fs: 9 } : { t: s, al: 'left', fn: 'Arial', fs: 9 }; })), merges: [], border: false, conf: t.conf };
  }
});
