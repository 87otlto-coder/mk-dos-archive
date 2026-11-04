#!/usr/bin/env node
/** Browser/Node proof: original EXE counted palette 80-word records reproduce O116 independent screenshots. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
if(!process.argv[2])throw Error('usage: node scripts/run-mk2-o118-native-stage-palette-bridge.mjs ORIGINAL_MK2_DIR');
const src=await import(pathToFileURL(resolve('src/games/mk2/research/nativeStageFloorPaletteO118.ts')).href);
const ref=await import(pathToFileURL(resolve('src/games/mk2/research/observedStageFloorPreviewO116.ts')).href);
const dir=resolve(process.argv[2]);let checks=0;
function demand(v,m){if(!v)throw Error(m);checks++;}
async function rejects(f,m){let failed=false;try{await f();}catch{failed=true;}demand(failed,m);}
const exe=new Uint8Array(await readFile(resolve(dir,'mk2.exe')));
for(const stage of ['tomb','portal']){
 const gra=new Uint8Array(await readFile(resolve(dir,`${stage}.gra`)));
 const pal=await src.paletteFromCanonicalMK2ExeO118(exe,stage);
 demand(pal.size===80,stage+' counted record');
 const rendered=await ref.renderMK2ObservedStageFloorO116(stage,gra);
 const compared=await src.verifyO118PreviewAgainstExe(exe,stage,gra,rendered.sourceLeft,0,rendered.rgba);
 demand(compared.matched===compared.total&&compared.matched===320*rendered.height,stage+' all observed RGBA pixels match original EXE');
 demand(compared.qualification===src.O118_QUALIFICATION,stage+' status');
 const witnessHash=createHash('sha256').update(rendered.rgba).digest('hex');
 demand(witnessHash===(stage==='tomb'?'836860df914d45c5db111312c9ba0e08308f72232f0833f8fd6d4bab5e1f244f':'7847decd98d78d2e23cd1dcf6550eb676c6cbe08e268fd2f16cf426e2e177200'),stage+' old evidence stable');
 await rejects(()=>src.paletteFromCanonicalMK2ExeO118(exe,stage==='tomb'?'arena':'battle'),stage+' no unsupported stage');
 const forged=exe.slice();forged[0x893c8]^=1;
 await rejects(()=>src.paletteFromCanonicalMK2ExeO118(forged,stage),stage+' corrupt EXE rejected');
 const rgba=rendered.rgba.slice();rgba[0]^=1;
 await rejects(()=>src.verifyO118PreviewAgainstExe(exe,stage,gra,rendered.sourceLeft,0,rgba),stage+' changed screenshot pixel rejected');
 const indexChanged=gra.slice();indexChanged[stage==='tomb'?63776+rendered.sourceLeft:56916+rendered.sourceLeft]=255;
 await rejects(()=>src.verifyO118PreviewAgainstExe(exe,stage,indexChanged,rendered.sourceLeft,0,rendered.rgba),stage+' invalid pixel index rejected');
 await rejects(()=>src.verifyO118PreviewAgainstExe(exe,stage,gra,-1,0,rendered.rgba),stage+' invalid viewport rejected');
 await rejects(()=>src.verifyO118PreviewAgainstExe(exe,stage,gra,rendered.sourceLeft,0,rendered.rgba.subarray(0,10)),stage+' invalid buffer length rejected');
 console.log(stage,compared.matched,'EXE matched pixels, record offset',compared.recordPhysical.toString(16));
}
console.log(JSON.stringify({status:'PASS',checks,description:'Counted EXE palette sources exactly reproduce O116 pinned screenshot colors; not runtime palette handle'},null,2));
