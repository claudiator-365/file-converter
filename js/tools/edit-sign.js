// Edit PDF and Sign PDF: click-to-place text and signature editor.
function editTool(root, signFirst) {
  let bytes, view, pi = 0, np = 1, S = 1, items = [], pending = null, rendering = false, sig = null;
  try {
    sig = JSON.parse(localStorage.getItem('folio-sig') || 'null');
  }
  catch (e) { }
  const size = sel([[9, '9 pt'], [10, '10 pt'], [11, '11 pt'], [12, '12 pt'], [14, '14 pt'], [18, '18 pt'], [24, '24 pt']], 11);
  const color = h('input', { type: 'color', value: '#111111', title: 'Text color' });
  const hint = h('span', { class: 'note' }, 'Click the page to add text.');
  const pl = h('span', { class: 'note' });
  const dlb = B('Download', () => busy(dlb, exportPdf), 'primary');
  const bar = h('div', { class: 'bar sticky', style: 'display:none' }, B('←', () => nav(-1), 'sm'), pl, B('→', () => nav(1), 'sm'), size, color, B('Signature', openPad), hint, h('span', { class: 'sp' }), B('Close', () => go(cur)), dlb);
  const cv = h('canvas'), stage = h('div', { class: 'stage' }, cv), holder = h('div', { class: 'pagewrap', style: 'display:none' }, stage);
  const dz = pick(root, ['application/pdf'], false, 'Choose a PDF to ' + (signFirst ? 'sign' : 'edit'), async (f) => {
    bytes = new Uint8Array(await f.arrayBuffer());
    view = await pdfjsLib.getDocument({ data: bytes.slice() }).promise;
    np = view.numPages;
    dz.style.display = 'none';
    bar.style.display = 'flex';
    holder.style.display = 'flex';
    await show();
    if (signFirst)
      openPad();
  });
  root.append(bar, holder);
  async function nav(d) { const n = pi + d; if (rendering || n < 0 || n >= np)
    return; pi = n; await show(); }
  async function show() {
    rendering = true;
    try {
      const pg = await view.getPage(pi + 1), base = pg.getViewport({ scale: 1 });
      S = Math.min(2, (Math.min(root.clientWidth, 920) - 24) / base.width);
      const dpr = window.devicePixelRatio || 1, vp = pg.getViewport({ scale: S * dpr });
      cv.width = vp.width;
      cv.height = vp.height;
      cv.style.width = stage.style.width = base.width * S + 'px';
      cv.style.height = stage.style.height = base.height * S + 'px';
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      pl.textContent = `Page ${pi + 1} of ${np}`;
      stage.querySelectorAll('.item').forEach(e => e.remove());
      items.filter(it => it.page === pi).forEach(mount);
    }
    finally {
      rendering = false;
    }
  }
  cv.onclick = e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / S, y = (e.clientY - r.top) / S;
    if (pending) {
      const w = 150;
      add({ type: 'img', page: pi, x: x - w / 2, y: y - w * pending.ratio / 2, w, ratio: pending.ratio, data: pending.data });
      pending = null;
      hint.textContent = 'Click the page to add text.';
    }
    else
      add({ type: 'txt', page: pi, x, y, size: +size.value, color: color.value, text: '' });
  };
  function add(it) { items.push(it); mount(it); if (it.type === 'txt')
    it.el.querySelector('.txt').focus(); }
  function mount(it) {
    const el = h('div', { class: 'item' });
    it.el = el;
    const place = () => { el.style.left = it.x * S + 'px'; el.style.top = it.y * S + 'px'; };
    const grip = h('span', { class: 'grip', title: 'Drag to move' }, '⠿');
    const del = h('span', { class: 'x', title: 'Remove', onclick: () => { items = items.filter(i => i !== it); el.remove(); } }, '×');
    let body;
    if (it.type === 'txt') {
      body = h('div', { class: 'txt', contenteditable: 'true', spellcheck: 'false' });
      body.textContent = it.text;
      body.style.fontSize = it.size * S + 'px';
      body.style.color = it.color;
      body.oninput = () => { it.text = body.innerText; };
      body.onblur = () => { if (!it.text.trim()) {
        items = items.filter(i => i !== it);
        el.remove();
      } };
      el.append(grip, del, body);
    }
    else {
      body = h('img', { src: it.data, draggable: 'false' });
      body.style.width = it.w * S + 'px';
      const rs = h('span', { class: 'rs', title: 'Resize' });
      rs.onpointerdown = e => {
        e.preventDefault();
        rs.setPointerCapture(e.pointerId);
        const sx = e.clientX, w0 = it.w;
        rs.onpointermove = ev => { it.w = Math.max(30, w0 + (ev.clientX - sx) / S); body.style.width = it.w * S + 'px'; };
        rs.onpointerup = () => { rs.onpointermove = null; rs.onpointerup = null; };
      };
      el.append(grip, del, body, rs);
    }
    grip.onpointerdown = e => {
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ox = it.x, oy = it.y;
      grip.onpointermove = ev => { it.x = ox + (ev.clientX - sx) / S; it.y = oy + (ev.clientY - sy) / S; place(); };
      grip.onpointerup = () => { grip.onpointermove = null; grip.onpointerup = null; };
    };
    place();
    stage.append(el);
  }
  function openPad() {
    const c = h('canvas', { width: 560, height: 200, class: 'pad' }), g = c.getContext('2d');
    g.lineWidth = 3.2;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = '#111';
    let down = false;
    const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    c.onpointerdown = e => { c.setPointerCapture(e.pointerId); down = true; const [x, y] = pt(e); g.beginPath(); g.moveTo(x, y); g.lineTo(x + .1, y + .1); g.stroke(); };
    c.onpointermove = e => { if (!down)
      return; const [x, y] = pt(e); g.lineTo(x, y); g.stroke(); };
    c.onpointerup = () => { down = false; };
    const close = () => m.remove();
    const use = (url, ratio) => { pending = { data: url, ratio }; hint.textContent = 'Click the page where the signature goes.'; close(); };
    const m = h('div', { class: 'modal' }, h('div', { class: 'dlg' }, h('b', {}, 'Draw your signature'), c, h('div', { class: 'bar' }, B('Clear', () => g.clearRect(0, 0, c.width, c.height)), sig ? B('Use saved signature', () => use(sig.url, sig.ratio)) : '', h('span', { class: 'sp' }), B('Cancel', close), B('Use this signature', () => {
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (d[(y * c.width + x) * 4 + 3] > 20) {
            if (x < x0)
              x0 = x;
            if (x > x1)
              x1 = x;
            if (y < y0)
              y0 = y;
            if (y > y1)
              y1 = y;
          }
      if (x1 < 0)
        return alert('Draw your signature first.');
      x0 = Math.max(0, x0 - 6);
      y0 = Math.max(0, y0 - 6);
      x1 = Math.min(c.width - 1, x1 + 6);
      y1 = Math.min(c.height - 1, y1 + 6);
      const o = h('canvas');
      o.width = x1 - x0 + 1;
      o.height = y1 - y0 + 1;
      o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
      sig = { url: o.toDataURL('image/png'), ratio: o.height / o.width };
      try {
        localStorage.setItem('folio-sig', JSON.stringify(sig));
      }
      catch (e) { }
      use(sig.url, sig.ratio);
    }, 'primary'))));
    document.body.append(m);
  }
  async function exportPdf() {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true }), font = await doc.embedFont(StandardFonts.Helvetica), pgs = doc.getPages();
    for (const it of items) {
      const pg = pgs[it.page];
      if (!pg)
        continue;
      const { width: W, height: H } = pg.getSize(), rot = ((pg.getRotation().angle % 360) + 360) % 360;
      const map = (u, v) => rot === 90 ? [v, u] : rot === 180 ? [W - u, H - v] : rot === 270 ? [W - v, H - u] : [u, H - v];
      if (it.type === 'txt') {
        const t = (it.text || '').replace(/\r/g, '');
        if (!t.trim())
          continue;
        const hx = it.color, col = rgb(parseInt(hx.slice(1, 3), 16) / 255, parseInt(hx.slice(3, 5), 16) / 255, parseInt(hx.slice(5, 7), 16) / 255);
        t.split('\n').forEach((line, k) => {
          if (!line)
            return;
          const [x, y] = map(it.x, it.y + it.size * .85 + k * it.size * 1.2);
          pg.drawText(clean(line), { x, y, size: it.size, font, color: col, rotate: degrees(rot) });
        });
      }
      else {
        const u8 = Uint8Array.from(atob(it.data.split(',')[1]), ch => ch.charCodeAt(0)), img = await doc.embedPng(u8), hh = it.w * it.ratio, [x, y] = map(it.x, it.y + hh);
        pg.drawImage(img, { x, y, width: it.w, height: hh, rotate: degrees(rot) });
      }
    }
    await save(await doc.save(), 'edited.pdf');
  }
}
