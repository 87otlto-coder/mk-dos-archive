/** Dependency-light TypeScript/TSX syntax gate for source releases.
 * Run after npm ci: node scripts/check-source-syntax.cjs
 * Only checks syntax (not types, imports, or a Vite/browser build).
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
let ts;
try { ts = require('typescript'); }
catch {
  // Authoring environment fallback; normal Windows installs resolve local node_modules.
  try { ts = require(process.env.TYPESCRIPT_PATH || '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript'); }
  catch { console.error('TypeScript not installed. Run npm ci first.'); process.exit(2); }
}
const root = path.join(__dirname, '..', 'src');
let checked = 0;
let failures = 0;
function visit(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) { visit(file); continue; }
    if (!item.isFile() || !/\.tsx?$/.test(item.name)) continue;
    const input = fs.readFileSync(file, 'utf8');
    const kind = item.name.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, kind);
    checked++;
    for (const error of source.parseDiagnostics) {
      const pos = source.getLineAndCharacterOfPosition(error.start || 0);
      const detail = ts.flattenDiagnosticMessageText(error.messageText, ' ');
      console.error(`${path.relative(root, file)}:${pos.line + 1}:${pos.character + 1}: ${detail}`);
      failures++;
    }
  }
}
visit(root);
console.log(`TypeScript syntax gate: ${checked} source files, ${failures} syntax errors`);
if (failures) process.exitCode = 1;
