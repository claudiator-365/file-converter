// node tests/preview_xlsx.mjs tests/samples/26-2091.pdf out.json && python3 tests/to_xlsx.py out.json out.xlsx
// Runs the real X.book() against a recording stand-in for ExcelJS; to_xlsx.py replays it with openpyxl
// so you can open the result and eyeball it without a browser.
import fs from 'fs';
import { X, analyze } from './load.mjs';
class WS { constructor(n){this.name=n;this.cells={};this.merges=[];this.cols={};this.rows={}}
  getCell(r,c){return this.cells[r+','+c]??={r,c}} mergeCells(a,b,c,d){this.merges.push([a,b,c,d])}
  getColumn(i){return this.cols[i]??={}} getRow(i){return this.rows[i]??={}} }
class WB { constructor(){this.sheets=[]} addWorksheet(n){const w=new WS(n);this.sheets.push(w);return w} }
const res = await analyze(process.argv[2]), wb = X.book({ Workbook: WB }, res, true);
fs.writeFileSync(process.argv[3], JSON.stringify(wb.sheets.map(s => ({ name: s.name, cells: Object.values(s.cells), merges: s.merges, cols: s.cols, rows: s.rows }))));
