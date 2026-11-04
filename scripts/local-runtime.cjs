// Portable TypeScript research runner; uses the project's existing compiler.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => {
  const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  module._compile(result.outputText, file);
};
function sourceFromDirectory(root) {
  root = path.resolve(root);
  const entries = [], cache = new Map();
  function walk(dir, rel = '') { for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = rel ? `${rel}/${e.name}` : e.name, p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, name);
    else if (e.isFile()) entries.push({ path: name, name: e.name, extension: path.extname(e.name).slice(1).toUpperCase(), size: fs.statSync(p).size });
  } }
  walk(root);
  return { directoryName: path.basename(root), isSynthetic: false, async listRecursive() { return entries; }, async readSlice(name, offset, length) {
    const p = path.resolve(root, name);
    if (!p.startsWith(root + path.sep)) throw new Error('Path outside source');
    if (!cache.has(name)) cache.set(name, new Uint8Array(fs.readFileSync(p)));
    return cache.get(name).slice(offset, offset + length);
  } };
}
module.exports = { sourceFromDirectory };
