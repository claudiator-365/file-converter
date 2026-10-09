// Reading the lines and box borders drawn on a PDF page (pdf.js operator list).
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // horizontal / vertical rules and rectangle borders from a pdf.js operator list (pdf.js 3.x and 4+/5.x formats)
  segs(ol, O, vp, Util) {
    const H = [], V = [], paint = [O.stroke, O.closeStroke, O.fill, O.eoFill, O.fillStroke, O.eoFillStroke, O.closeFillStroke, O.closeEOFillStroke];
    const strokes = [O.stroke, O.closeStroke, O.fillStroke, O.eoFillStroke, O.closeFillStroke, O.closeEOFillStroke];
    let ctm = [1, 0, 0, 1, 0, 0], stack = [], pend = [];
    const sub = (path, closed, stk) => {
      const T = Util.transform(vp.transform, ctm), p = path.map(q => [T[0] * q[0] + T[2] * q[1] + T[4], T[1] * q[0] + T[3] * q[1] + T[5]]);
      const xs = p.map(q => q[0]), ys = p.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const ax = p.every(q => (Math.abs(q[0] - x0) < .6 || Math.abs(q[0] - x1) < .6) && (Math.abs(q[1] - y0) < .6 || Math.abs(q[1] - y1) < .6));
      const ln = (a, b) => {
        const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
        if (dy < .6 && dx >= 3)
          H.push({ y: (a[1] + b[1]) / 2, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]) });
        else if (dx < .6 && dy >= 3)
          V.push({ x: (a[0] + b[0]) / 2, y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) });
      };
      if (p.length >= 4 && ax && (closed || p.length === 5) && x1 - x0 > 0 && y1 - y0 > 0) {
        if (y1 - y0 <= 2.5)
          ln([x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]);
        else if (x1 - x0 <= 2.5)
          ln([(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]);
        else if (stk) {
          ln([x0, y0], [x1, y0]);
          ln([x0, y1], [x1, y1]);
          ln([x0, y0], [x0, y1]);
          ln([x1, y0], [x1, y1]);
        }
      }
      else {
        for (let i = 1; i < p.length; i++)
          ln(p[i - 1], p[i]);
        if (closed && p.length > 2)
          ln(p[p.length - 1], p[0]);
      }
    };
    const commit = (subs, stk) => subs.forEach(s => sub(s.p, s.c, stk));
    ol.fnArray.forEach((fn, i) => {
      const a = ol.argsArray[i];
      if (fn === O.save)
        stack.push(ctm.slice());
      else if (fn === O.restore) {
        if (stack.length)
          ctm = stack.pop();
      }
      else if (fn === O.transform)
        ctm = Util.transform(ctm, a);
      else if (fn === O.constructPath) {
        const subs = [];
        if (Array.isArray(a[0])) { // pdf.js 3.x: [ops[], coords[]]
          const ops = a[0], c = a[1];
          let ci = 0, cur = null;
          for (const op of ops) {
            if (op === O.moveTo) {
              cur = { p: [[c[ci], c[ci + 1]]], c: false };
              subs.push(cur);
              ci += 2;
            }
            else if (op === O.lineTo) {
              if (cur)
                cur.p.push([c[ci], c[ci + 1]]);
              ci += 2;
            }
            else if (op === O.rectangle) {
              const x = c[ci], y = c[ci + 1], w = c[ci + 2], h = c[ci + 3];
              ci += 4;
              subs.push({ p: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], c: true });
              cur = null;
            }
            else if (op === O.closePath) {
              if (cur)
                cur.c = true;
            }
            else if (op === O.curveTo)
              ci += 6;
            else if (op === O.curveTo2 || op === O.curveTo3)
              ci += 4;
          }
          pend.push(...subs);
        }
        else { // pdf.js 4+/5.x: [paintOp, [Float32Array(path)], minMax]; path ops 0 move,1 line,2 curve,3 quad,4 close
          const d = a[1] && a[1][0];
          if (!d)
            return;
          let k = 0, cur = null;
          while (k < d.length) {
            const op = d[k++];
            if (op === 0) {
              cur = { p: [[d[k], d[k + 1]]], c: false };
              subs.push(cur);
              k += 2;
            }
            else if (op === 1) {
              if (cur)
                cur.p.push([d[k], d[k + 1]]);
              k += 2;
            }
            else if (op === 2)
              k += 6;
            else if (op === 3)
              k += 4;
            else if (op === 4) {
              if (cur)
                cur.c = true;
            }
            else
              break;
          }
          if (paint.includes(a[0]))
            commit(subs, strokes.includes(a[0]));
        }
      }
      else if (paint.includes(fn)) {
        commit(pend, strokes.includes(fn));
        pend = [];
      }
      else if (fn === O.endPath)
        pend = [];
    });
    const mg = (arr, k, lo, hi) => { arr.sort((p, q) => p[k] - q[k] || p[lo] - q[lo]); const o = []; for (const s of arr) {
      const m = o[o.length - 1];
      if (m && Math.abs(s[k] - m[k]) <= 1.5 && s[lo] <= m[hi] + 2)
        m[hi] = Math.max(m[hi], s[hi]);
      else
        o.push({ ...s });
    } return o; };
    return { H: mg(H, 'y', 'x0', 'x1'), V: mg(V, 'x', 'y0', 'y1') };
  }
});
