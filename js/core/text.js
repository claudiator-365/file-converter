// Reading text out of a PDF page: text items, rows, cells, columns, fonts.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  median(a) { if (!a.length)
    return 0; const s = [...a].sort((p, q) => p - q), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
  // pdf.js textContent -> items in top-down page coordinates (y = baseline). Rotated text is skipped.
  items(tc, vp, Util) {
    const out = [];
    for (const it of tc.items) {
      if (!it.str || !it.str.trim())
        continue;
      const t = Util.transform(vp.transform, it.transform);
      if (Math.abs(t[1]) > Math.abs(t[0]) * .5)
        continue;
      out.push({ s: it.str, x: t[4], y: t[5], w: it.width * vp.scale, h: Math.hypot(t[2], t[3]) || it.height || 10, f: (tc.styles[it.fontName] || {}).fontFamily || '' });
    }
    return out;
  },
  // group items into visual rows, then split each row into cells wherever there is a wide gap
  rows(items, o = {}) {
    const K = o.k || .55, pad = !!o.pad;
    if (!items.length)
      return [];
    const hm = X.median(items.map(i => i.h)), tol = Math.max(2, hm * .55), rs = [];
    for (const it of [...items].sort((a, b) => a.y - b.y || a.x - b.x)) {
      const r = rs[rs.length - 1];
      if (r && Math.abs(it.y - r.y) <= tol) {
        r.items.push(it);
        r.y = (r.y * (r.items.length - 1) + it.y) / r.items.length;
      }
      else
        rs.push({ y: it.y, items: [it] });
    }
    for (const r of rs) {
      r.items.sort((a, b) => a.x - b.x);
      r.cells = [];
      let c = null;
      for (const it of r.items) {
        const gap = c ? it.x - c.x1 : 0, lim = Math.max(2, Math.min(it.h, c ? c.h : it.h) * K);
        if (c && gap < lim) {
          c.t += (gap > it.h * .12 ? (pad ? ' '.repeat(Math.max(1, Math.round(gap / (it.h * .28)))) : (!/\s$/.test(c.t) && !/^\s/.test(it.s) ? ' ' : '')) : '') + it.s;
          c.x1 = Math.max(c.x1, it.x + it.w);
        }
        else {
          c = { t: it.s, x0: it.x, x1: it.x + it.w, h: it.h, f: it.f };
          r.cells.push(c);
        }
      }
      r.cells.forEach(k => { k.t = k.t.replace(/[\u0003-\u001f]/g, ch => String.fromCharCode(ch.charCodeAt(0) + 29)).replace(/\u00a0/g, ' ').replace(/\u0b11(?=\s*\d)/g, '₱'); k.t = (pad ? k.t : k.t.replace(/\s+/g, ' ')).trim(); });
      r.h = Math.max(...r.items.map(i => i.h));
      r.cells = r.cells.filter(k => k.t);
    }
    return rs.filter(r => r.cells.length);
  },
  // x-ranges where cells overlap vertically = columns
  cols(cs, thr) {
    const x0 = Math.floor(Math.min(...cs.map(c => c.x0))), x1 = Math.ceil(Math.max(...cs.map(c => c.x1))), occ = new Int32Array(x1 - x0 + 2);
    cs.forEach(c => { for (let x = Math.floor(c.x0); x < Math.ceil(c.x1); x++)
      occ[x - x0]++; });
    const segs = [];
    let st = -1;
    for (let i = 0; i <= x1 - x0 + 1; i++) {
      const f = i <= x1 - x0 && occ[i] > thr;
      if (f && st < 0)
        st = i;
      if (!f && st >= 0) {
        segs.push([st + x0, i + x0]);
        st = -1;
      }
    }
    const b = [];
    for (const s of segs) {
      const m = b[b.length - 1];
      if (m && s[0] - m[1] < 3)
        m[1] = s[1];
      else
        b.push([...s]);
    }
    return b;
  },
  fontOf(its) {
    const f = its[0] ? its[0].f : '', n = /mono/.test(f) ? 'Courier New' : /serif/.test(f) && !/sans/.test(f) ? 'Times New Roman' : 'Arial';
    return { fn: n, fs: Math.min(14, Math.max(6, Math.round(X.median(its.map(i => i.h)) * 2) / 2)) };
  }
});
