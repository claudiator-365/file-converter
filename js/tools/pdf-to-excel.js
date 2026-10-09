// PDF to Excel: UI around the table-extraction engine in js/core/.
const loadScript = u => new Promise((ok, no) => { if (window.ExcelJS)
  return ok(); const s = h('script', { src: u }); s.onload = ok; s.onerror = () => no(Error('The Excel library could not be loaded. Check your connection and try again.')); document.head.append(s); });
function pdf2xlsxTool(root) {
  pick(root, ['application/pdf'], false, 'Choose a PDF with tables', async (f) => {
    if (!f.size)
      return alert('That file is empty.');
    if (f.size > CFG.maxUploadMB * 1024 * 1024)
      return alert('That file is ' + fmt(f.size) + '. The limit is ' + CFG.maxUploadMB + ' MB.');
    const buf = await f.arrayBuffer();
    if (!new TextDecoder('latin1').decode(buf.slice(0, 1024)).includes('%PDF-'))
      return alert('That file is not a valid PDF.');
    const st = h('p', { class: 'note' }, 'Opening…'), pr = h('progress', { max: 1, value: 0 });
    root.replaceChildren(h('div', { class: 'bar' }, h('span', { class: 'note' }, f.name + ' · ' + fmt(f.size)), B('Change file', () => go(cur), 'sm')), st, pr);
    let res;
    try {
      const doc = await openPdfJs(buf);
      if (doc.numPages > CFG.maxPages)
        throw Error('This PDF has ' + doc.numPages + ' pages. The limit is ' + CFG.maxPages + '.');
      res = await X.analyze(doc, pdfjsLib.Util, pdfjsLib.OPS, (p, n) => { st.textContent = `Reading page ${p} of ${n}…`; pr.value = p / n; });
    }
    catch (e) {
      pr.remove();
      st.className = 'warn';
      st.textContent = e.name === 'PasswordException' ? 'This PDF is password protected. Remove the password and try again.' : (e.name === 'InvalidPDFException' || e.name === 'FormatError') ? 'This PDF is damaged or not a valid PDF.' : 'Could not read this PDF: ' + (e.message || e);
      return;
    }
    pr.remove();
    st.remove();
    showResult(f, res);
  });
  function showResult(f, res) {
    const warn = t => root.append(h('div', { class: 'warn' }, t));
    if (res.scanned) {
      warn('No text found. This looks like a scanned PDF (pages are pictures). Reading scans needs OCR, and OCR can\'t run inside this page because its engine and language data can\'t be loaded here. Nothing was converted. Run the file through OCR first (for example "Recognize text" in Acrobat), then open the searchable PDF here.');
      return;
    }
    if (res.emptyPages.length)
      warn('Page' + (res.emptyPages.length > 1 ? 's ' : ' ') + res.emptyPages.join(', ') + ' have no text (probably scans) and were skipped.');
    const tabs = res.sheets.filter(s => s.kind !== 'block');
    if (!tabs.length)
      warn('No tables were found in this PDF. Its text is still exported as text blocks.');
    else if (tabs.some(s => s.conf < .75))
      warn('Some tables have rows that don\'t line up with their columns. Compare them with the PDF before relying on the numbers.');
    const withText = h('input', { type: 'checkbox', checked: '' }), list = h('div'), dlb = B('Download Excel', () => busy(dlb, async () => {
      await loadScript(CFG.excelJsUrl);
      if (!window.ExcelJS)
        throw Error('The Excel library did not load.');
      await save(await X.book(ExcelJS, res, withText.checked).xlsx.writeBuffer(), stem(f) + '.xlsx');
    }), 'primary');
    const kind = { ruled: 'ruled table', plain: 'table without borders', block: 'text block' };
    function draw() {
      const inc = res.sheets.filter(s => s.kind !== 'block' || withText.checked);
      dlb.disabled = !inc.length;
      list.replaceChildren(h('p', { class: 'note' }, `${tabs.length} table${tabs.length === 1 ? '' : 's'} and ${res.sheets.length - tabs.length} text block${res.sheets.length - tabs.length === 1 ? '' : 's'} found in ${res.pages} page${res.pages === 1 ? '' : 's'}. Each becomes one sheet.`), ...inc.map((s, i) => {
        const tb = h('table');
        s.rows.slice(0, 8).forEach(r => tb.append(h('tr', {}, r.map(c => h('td', { style: 'text-align:' + (c.al || 'left') }, c.v != null ? String(c.v) : (c.t || ''))))));
        return h('div', {}, h('p', { class: 'note' }, `Table ${i + 1} · page ${s.page} · ${kind[s.kind]} · ${s.rows.length} row${s.rows.length === 1 ? '' : 's'} × ${s.cw.length} column${s.cw.length === 1 ? '' : 's'}` + (s.kind === 'plain' ? ' · ' + X.label(s.conf) + ' match' : '') + (s.rows.length > 8 ? ' · first 8 rows shown' : '')), h('div', { class: 'pv' }, tb));
      }));
    }
    withText.onchange = draw;
    root.append(list, h('div', { class: 'controls' }, h('label', { style: 'flex-direction:row;gap:6px;align-items:center' }, withText, 'Include text blocks (non-table text) as sheets')), h('div', { class: 'bar' }, dlb));
    draw();
  }
}
