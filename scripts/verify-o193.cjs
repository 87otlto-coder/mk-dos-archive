/* O193 focused regression: no React runtime or commercial fixture included. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const vmRequire = (filename) => {
  filename = path.resolve(filename);
  if (cache.has(filename)) return cache.get(filename).exports;
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  cache.set(filename, mod);
  const requireLocal = (key) => {
    if (key.startsWith('.')) { let resolved = path.resolve(path.dirname(filename), key); if (!fs.existsSync(resolved)) resolved += '.ts'; return vmRequire(resolved); }
    return require(key);
  };
  new Function('require', 'exports', 'module', '__filename', '__dirname', compiled)(requireLocal, mod.exports, mod, filename, path.dirname(filename));
  return mod.exports;
};
const mkSource = (directory) => {
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(x => x.isDirectory() ? walk(path.join(dir, x.name)) : [path.join(dir, x.name)]);
  const list = walk(directory).map(p => ({ path: path.relative(directory, p).replaceAll(path.sep, '/'), name: path.basename(p), extension: path.extname(p).slice(1).toUpperCase(), size: fs.statSync(p).size }));
  return { directoryName: path.basename(directory), isSynthetic: false, listRecursive: async () => list,
    readSlice: async (p, offset, length) => new Uint8Array(fs.readFileSync(path.join(directory,p)).subarray(offset, offset + length)) };
};
const test = async () => {
  let assertions=0; const check=(value,message)=>{assert.ok(value,message);assertions++;};
  const prov = vmRequire(path.join(root,'src/components/researchProvenanceDisplay.ts'));
  const fmt=prov.describeResearchProvenance;
  check(fmt(null)===null,'null record absent');
  check(fmt({fileName:'MK1.EXE',byteLength:1157222,sha256:'a'.repeat(64)}).includes('1,157,222 B'),'normal provenance');
  check(fmt({fileName:'MK1.EXE'}).includes('size not reported · hash not reported'),'partial provenance');
  check(fmt({fileName:'MK1.EXE',byteLength:undefined,sha256:null}).includes('size not reported'),'undefined safe');
  check(fmt({byteLength:-9,sha256:123}).includes('hash not reported'),'invalid safe');
  const researchUi=fs.readFileSync(path.join(root,'src/components/ResearchQuickActions.tsx'),'utf8');
  check(researchUi.includes('describeResearchProvenance(provenance)'),'guarded UI provenance');
  check(!researchUi.includes('provenance.byteLength.toLocaleString()'),'unsafe provenance removed');
  const {discoverStageGallery}=vmRequire(path.join(root,'src/components/stageGalleryModel.ts'));
  const mk1=mkSource(process.env.MK1_FIXTURE);
  const inv=await mk1.listRecursive();
  const h=crypto.createHash('sha256').update(fs.readFileSync(path.join(process.env.MK1_FIXTURE,'MK1.EXE'))).digest('hex');
  check(h==='750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14','original MK1 fixture hash');
  const cards=discoverStageGallery(inv,'mk1');
  check(cards.length===17,`MK1 HDRS candidates count ${cards.length}`);
  check(cards.every(c=>inv.some(x=>x.name.toUpperCase()===c.file)),'only real MK1 files');
  check(cards.every(c=>c.note.includes('not yet verified')),'source labels qualify identity');
  check(discoverStageGallery(inv,'mk1','FU4').length===1,'filter works');
  check(discoverStageGallery(inv,'unknown').length===0,'unknown has no invented stages');
  // Other case-sensitive file source entries and original MK2 fixture.
  const mk2=mkSource(process.env.MK2_FIXTURE);
  const mk2List=await mk2.listRecursive();
  const cards2=discoverStageGallery(mk2List,'mk2');
  check(cards2.some(c=>c.file==='PORTAL.GRA') && cards2.some(c=>c.file==='TOMB.GRA') && cards2.some(c=>c.file==='TOWER.GRA'),'MK2 source stage lookup case independent');
  const {readMK2OriginalEffectFramesO136}=vmRequire(path.join(root,'src/games/mk2/research/stageOriginalEffectFramesO136.ts'));
  const exe=await mk2.readSlice('mk2.exe',0,861133);
  for(const [stage,counts] of [['portal',[7,7,6]],['tomb',[8,8]],['tower',[7]]]){
    const p=stage+'.gra', entry=mk2List.find(x=>x.name.toLowerCase()===p);
    const gra=await mk2.readSlice(entry.path,0,entry.size);
    const tracks=await readMK2OriginalEffectFramesO136(exe,gra,stage);
    check(tracks.length===counts.length,`${stage} tracks`);
    check(tracks.every((t,i)=>t.frames.length===counts[i]),`${stage} frame lengths`);
    const mutated=gra.slice(); mutated[0]^=1;
    await assert.rejects(readMK2OriginalEffectFramesO136(exe,mutated,stage),/original stage GRA/);
    assertions++;
  }
  console.log(`O193 focused fixture verification passed: ${assertions} checks (MK1 original fixture + MK2 original fixture).`);
};
test().catch(e=>{console.error(e);process.exitCode=1});
