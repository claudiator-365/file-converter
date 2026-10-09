// Tiny DOM helpers used by every tool.
const h = (t, a = {}, ...c) => { const e = document.createElement(t); for (const k in a) {
  if (k.startsWith('on'))
    e[k] = a[k];
  else
    e.setAttribute(k, a[k]);
} c.flat().forEach(x => e.append(x && x.nodeType ? x : document.createTextNode(x == null ? '' : x))); return e; };
const B = (t, fn, c = '') => h('button', { class: 'btn ' + c, onclick: fn }, t);
const sel = (o, v) => { const s = h('select', {}, ...o.map(x => h('option', { value: x[0] }, x[1]))); if (v != null)
  s.value = v; return s; };
const L2 = (t, el) => h('label', {}, t, el);
async function busy(b, fn) { const t = b.textContent; b.disabled = true; b.textContent = 'Working…'; try {
  await fn();
}
catch (e) {
  alert('Something went wrong: ' + (e.message || e));
} b.disabled = false; b.textContent = t; }
