// Writes the analysed sheets into an ExcelJS workbook.
// Adds methods to the shared `X` object (see core/namespace.js).
Object.assign(X, {
  // build an ExcelJS workbook, one "Table N" sheet per detected region (like Smallpdf)
  book(E, res, withBlocks) {
    const wb = new E.Workbook(), thin = { style: 'thin' };
    let n = 0;
    for (const sh of res.sheets) {
      if (sh.kind === 'block' && !withBlocks)
        continue;
      const ws = wb.addWorksheet('Table ' + (++n));
      sh.rows.forEach((row, ri) => row.forEach((cell, ci) => {
        const c = ws.getCell(ri + 1, ci + 1);
        if (cell.v != null) {
          c.value = cell.v;
          c.numFmt = cell.z;
        }
        else if (cell.t)
          c.value = cell.t;
        c.font = { name: cell.fn || 'Arial', size: cell.fs || 9 };
        c.alignment = { horizontal: cell.al || 'left', vertical: 'top', wrapText: true };
        if (sh.border)
          c.border = { top: thin, left: thin, bottom: thin, right: thin };
      }));
      sh.merges.forEach(m => ws.mergeCells(m[0] + 1, m[1] + 1, m[2] + 1, m[3] + 1));
      sh.cw.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
      sh.rh.forEach((h, i) => { ws.getRow(i + 1).height = h; });
    }
    return wb;
  }
});
