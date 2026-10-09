// node tests/run.mjs tests/samples/26-2091.pdf [more.pdf ...]   -> prints every sheet the converter would write
import { X, analyze } from './load.mjs';
for (const f of process.argv.slice(2)) {
  const r = await analyze(f);
  console.log(`\n=== ${f} | pages ${r.pages} | scanned ${r.scanned} | skipped pages [${r.emptyPages}] | sheets ${r.sheets.length}`);
  r.sheets.forEach((s, i) => {
    console.log(`-- Table ${i + 1}: ${s.kind}, page ${s.page}, ${s.rows.length} rows x ${s.cw.length} cols, widths [${s.cw}], row heights [${s.rh}], merges ${JSON.stringify(s.merges)}`);
    s.rows.slice(0, 4).forEach(row => console.log('   | ' + row.map(c => c.v != null ? `<${c.v} ${c.z}>` : JSON.stringify((c.t || '').slice(0, 60))).join(' | ')));
  });
}
