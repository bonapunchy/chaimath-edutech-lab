/* Load a browser-only script (window.X = ...) in a bare VM context for tests. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

module.exports = function loadBrowser(files, extra = {}) {
  const ctx = { console, ...extra };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), ctx, { filename: file });
  }
  return ctx;
};
