// Globals shared by all files: library handles, the #app element, current tool, downloads hook.
const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = CFG.pdfWorkerUrl;
const app = document.getElementById('app');
let cur = null, dl = null;
try {
  (window.claude ? claude.use('downloads') : Promise.resolve(null)).then(x => dl = x).catch(() => { });
}
catch (e) { }
