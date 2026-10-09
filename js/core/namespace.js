// The table-extraction engine lives on one shared object, `X`.
// Each file in js/core/ adds its own methods to it with Object.assign(X, {...}).
// This file must load first.
const X = {};
