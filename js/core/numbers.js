// Turning cell text into Excel numbers, and match-quality labels.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // "₱12,500.00", "(1,200)", "15%" -> {v,z}; codes like 007 or long IDs stay text
  num(s) {
    let t = String(s).trim(), neg = false, pct = false;
    if (/^\(.*\)$/.test(t)) {
      neg = true;
      t = t.slice(1, -1).trim();
    }
    if (/^[-−–]/.test(t)) {
      neg = true;
      t = t.slice(1).trim();
    }
    t = t.replace(/^(₱|PHP|Php|\$)\s*/, '');
    if (t.endsWith('%')) {
      pct = true;
      t = t.slice(0, -1).trim();
    }
    const m = t.match(/^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?$/);
    if (!m)
      return null;
    const ip = m[1].replace(/,/g, '');
    if ((ip.length > 1 && ip[0] === '0') || ip.length > 15)
      return null;
    const d = m[2] ? m[2].length : 0;
    let v = +(ip + (m[2] ? '.' + m[2] : ''));
    if (neg)
      v = -v;
    if (pct)
      v /= 100;
    return { v, z: pct ? '0' + (d ? '.' + '0'.repeat(d) : '') + '%' : (m[1].includes(',') ? '#,##0' : '0') + (d ? '.' + '0'.repeat(d) : '') };
  },
  label(c) { return c >= .75 ? 'Good' : c >= .5 ? 'Check' : 'Low'; }
});
