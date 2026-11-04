#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(process.argv[2] ?? '.');
const o17Path = process.argv[3];
const o19Path = process.argv[4];
if (!o17Path || !o19Path) {
  console.error('Usage: node scripts/run-get-char-ani-consumer-census.mjs <MK1-directory> <o17.json> <o19.json> [out.json]');
  process.exit(2);
}
const outPath = path.resolve(process.argv[5] ?? `mk1_get_char_ani_consumer_census_${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mk1-o21-'));
const emit = path.join(tmp, 'emit');
fs.mkdirSync(emit, { recursive: true });
const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shim = path.join(tmp, 'node-shim.d.ts');
fs.writeFileSync(shim, "declare const process: { env?: Record<string,string|undefined>; platform: string };\n");
execFileSync('tsc', ['--target','ES2022','--module','commonjs','--moduleResolution','node','--esModuleInterop','--skipLibCheck','--outDir',emit,shim,'src/games/mk1/research/getCharAniConsumerCensus.ts'], { cwd: projectRoot, stdio:'inherit' });
const api = require(path.join(emit,'games/mk1/research/getCharAniConsumerCensus.js'));
function walk(dir, rel='', out=[]) {
  for (const ent of fs.readdirSync(dir,{withFileTypes:true})) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p,r,out);
    else if (ent.isFile()) out.push({path:r,name:ent.name,extension:ent.name.includes('.')?ent.name.split('.').pop().toUpperCase():'',size:fs.statSync(p).size});
  }
  return out;
}
const filesMeta=walk(root); const cache=new Map();
const source={directoryName:root,isSynthetic:false,async listRecursive(){return filesMeta;},async readSlice(p,o,l){if(!cache.has(p))cache.set(p,fs.readFileSync(path.join(root,p)));const b=cache.get(p);return new Uint8Array(b.subarray(o,o+l));}};
const o17=JSON.parse(fs.readFileSync(o17Path,'utf8'));
const o19=JSON.parse(fs.readFileSync(o19Path,'utf8'));
const report=await api.executeGetCharAniConsumerCensus(source,o17,o19);
fs.writeFileSync(outPath,JSON.stringify(report,null,2));
console.log(JSON.stringify({outPath,status:report.status,verdict:report.decision.verdict,summary:report.summary},null,2));
