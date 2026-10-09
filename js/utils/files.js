// File helpers: saving downloads, drop-zone file picker, file lists.
async function save(data, name) {
  if (!dl) { // opened outside claude.ai (locally or on your own host): ordinary browser download
    const a = h('a', { href: URL.createObjectURL(data instanceof Blob ? data : new Blob([data])), download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return;
  }
  try {
    await dl.save({ filename: name, data });
  }
  catch (e) {
    if (e && e.code !== 'declined')
      alert('Could not save: ' + (e.message || e.code));
  }
}
function pick(root, accept, multiple, label, cb) {
  const inp = h('input', { type: 'file', accept: accept.join(','), style: 'display:none' });
  inp.multiple = !!multiple;
  const ok = f => accept.some(a => a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a);
  const go2 = fs => { fs = [...fs].filter(ok); if (fs.length)
    cb(multiple ? fs : fs[0]);
  else
    alert('That file type is not supported by this tool.'); };
  inp.onchange = () => { go2(inp.files); inp.value = ''; };
  const dz = h('div', { class: 'drop', tabindex: '0', onclick: () => inp.click(), onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inp.click();
    } },
    ondragover: e => { e.preventDefault(); dz.classList.add('over'); }, ondragleave: () => dz.classList.remove('over'),
    ondrop: e => { e.preventDefault(); dz.classList.remove('over'); go2(e.dataTransfer.files); } }, h('b', {}, label), h('span', {}, 'or drop it here'));
  root.append(inp, dz);
  return dz;
}
function onePdf(root, setup) {
  pick(root, ['application/pdf'], false, 'Choose a PDF', async (f) => {
    const buf = await f.arrayBuffer();
    root.replaceChildren(h('div', { class: 'bar' }, h('span', { class: 'note' }, f.name + ' · ' + fmt(f.size)), B('Change file', () => go(cur), 'sm')));
    await setup(f, buf);
  });
}
function fileList(onChange) {
  let files = [];
  const el = h('div', { class: 'list' });
  function draw() {
    el.replaceChildren(...files.map((f, i) => h('div', { class: 'row' }, h('span', { class: 'nm' }, f.name), h('span', { class: 'sz' }, fmt(f.size)), B('↑', () => { if (i > 0) {
      [files[i - 1], files[i]] = [files[i], files[i - 1]];
      draw();
    } }, 'sm'), B('↓', () => { if (i < files.length - 1) {
      [files[i + 1], files[i]] = [files[i], files[i + 1]];
      draw();
    } }, 'sm'), B('Remove', () => { files.splice(i, 1); draw(); }, 'sm'))));
    onChange(files);
  }
  return { el, files: () => files, add: fs => { files.push(...fs); draw(); } };
}
