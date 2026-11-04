#!/usr/bin/env node
/* O122 Node TypeScript -> independently derived Python exact RGBA parity. */
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [exefile,tombfile,portalfile]=process.argv.slice(2);
if(!exefile||!tombfile||!portalfile)throw Error('Provide MK2.EXE, TOMB.GRA, PORTAL.GRA from original game');
const {renderMK2IndexedSetupLayerO122}=await import('../src/games/mk2/research/stageIndexedMosaicsO122.ts');
const report=JSON.parse(await readFile('research_outputs/O122_INDEXED_LAYER_REPORT.json'));
const exe=new Uint8Array(await readFile(exefile));const gra={tomb:new Uint8Array(await readFile(tombfile)),portal:new Uint8Array(await readFile(portalfile))};
let checks=0;
function ck(value,msg){if(!value)throw Error(`O122 browser parity: ${msg}`);checks++}
for(const stage of ['tomb','portal']){
 const family=stage+'80';
 for(const r of report.mosaics.filter(r=>r.family===family)){
  const a=await renderMK2IndexedSetupLayerO122(exe,gra[stage],stage,r.setupObject2Offset);
  const hashed=field=>createHash('sha256').update(a[field]).digest('hex');
  ck(hashed('rgba')===r.rgbaSHA256,`rgba mismatch ${stage} ${r.setupObject2Offset}`);
  ck(hashed('indices')===r.indexCanvasSHA256,`indices mismatch ${stage} ${r.setupObject2Offset}`);
  ck(hashed('opacity')===r.alphaCanvasSHA256,`opacity mismatch ${stage} ${r.setupObject2Offset}`);
  ck(a.opaqueCanvasPixels===r.opaqueCanvasPixels,`opaque mismatch ${stage} ${r.setupObject2Offset}`);
  ck(a.overdrawOpaquePixels===r.overdrawOpaquePixels,`overdraw mismatch ${stage} ${r.setupObject2Offset}`);
  ck(a.clippedOpaquePixels===r.clippedOpaqueSourcePixels,`clipped mismatch ${stage} ${r.setupObject2Offset}`);
 }
}
ck(report.mosaics.length===10,'total decoded sprite setup count');
console.log(JSON.stringify({status:'PASS',checks,comparison:'Browser/Python byte-identical RGBA index+mask, original source verified'}));
