// Text and number formatting helpers.
const fmt = n => n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB';
const stem = f => f.name.replace(/\.[^.]+$/, '');
const clean = s => String(s).replace(/₱/g, 'PHP ').replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
function ranges(s, n) {
  const out = [];
  if (!s.trim()) {
    for (let i = 0; i < n; i++)
      out.push(i);
    return out;
  }
  for (const part of s.split(',')) {
    const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m)
      throw Error('Could not read "' + part.trim() + '". Use numbers like 1-3, 5.');
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > n || a > b)
      throw Error('Pages must be between 1 and ' + n + '.');
    for (let i = a; i <= b; i++)
      out.push(i - 1);
  }
  return out;
}
