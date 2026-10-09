// pdf.js helpers: open a PDF for reading, render a page to a canvas.
const openPdfJs = buf => pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
async function pageToCanvas(pg, scale) {
  const vp = pg.getViewport({ scale });
  const c = h('canvas');
  c.width = Math.round(vp.width);
  c.height = Math.round(vp.height);
  const x = c.getContext('2d');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, c.width, c.height);
  await pg.render({ canvasContext: x, viewport: vp }).promise;
  return c;
}
const toBlob = (c, t, q) => new Promise(r => c.toBlob(r, t, q));
