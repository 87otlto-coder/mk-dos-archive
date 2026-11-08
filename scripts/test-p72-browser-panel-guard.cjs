#!/usr/bin/env node
/** P72 real-UI guard: every MK3 FTR-only condition must match real .FTR paths.
 * The original Chrome P72 comparison timed out because the JSX comparison
 * condition accidentally used /\\.FTR$/i instead of /\.FTR$/i.
 * No game data required: inspect the actual TSX regular-expression literals.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../src/components/AssetBrowser.tsx'),'utf8');
const tree=ts.createSourceFile('AssetBrowser.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const literalRegex=[];
function visit(node) {
  if(node.kind===ts.SyntaxKind.RegularExpressionLiteral) {
    const text=node.getText(tree);
    if(/FTR/.test(text))literalRegex.push(text);
  }
  ts.forEachChild(node,visit);
}
visit(tree);
assert.equal(tree.parseDiagnostics.length,0,'AssetBrowser TSX must parse');
assert.equal(literalRegex.length,2,'FTR export and palette-comparison predicates must both exist');
assert(source.includes('className="asset-palette-comparison"'),'P72 real browser panel missing');
assert(source.includes('Original IFF CMAP comparison — not fighter palette ownership'),
  'P72 original Chrome expected heading missing');
for(const sourceLiteral of literalRegex) {
  const end=sourceLiteral.lastIndexOf('/');
  assert(end>0,'invalid literal FTR regexp');
  const regexp=new RegExp(sourceLiteral.slice(1,end),sourceLiteral.slice(end+1));
  for(const originalPath of ['BLADE.FTR','BLADE.ftr','FIGHTERS/BLADE.FTR'])
    assert(regexp.test(originalPath),
      'actual TSX FTR predicate rejects original path '+originalPath+': '+sourceLiteral);
  for(const unrelated of ['BLADE-FTR','BLADE.FTR.bak','OTHER.MK3','FIGHTERS/BLADE.FTR.txt'])
    assert(!regexp.test(unrelated),
      'actual TSX FTR predicate admits non-FTR resource '+unrelated+': '+sourceLiteral);
}
console.log(JSON.stringify({pass:'P72_BROWSER_PANEL_GUARD',status:'PASS',
  realTsxFtrPredicatesChecked:literalRegex.length,
  originalFtrPathsAccepted:3,
  invalidFtrPathsRejected:4,
  originalPaletteComparisonHeadingPresent:true,
  syntheticOnly:true},null,2));
