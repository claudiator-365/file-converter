// Settings you are likely to change. Loaded first.
const CFG = {
  // Excel column width = PDF points / this number (calibrated against Smallpdf output)
  colWidthPt: 4.3,
  // PDF to Excel limits
  maxUploadMB: 50,
  maxPages: 300,
  // Libraries loaded on demand / by pdf.js
  excelJsUrl: 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',
  pdfWorkerUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
};
