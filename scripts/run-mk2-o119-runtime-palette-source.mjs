#!/usr/bin/env node
/** Tiny TS proof for evidence metadata: no original copyrighted files needed. */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {O119_RUNTIME_SOURCE_WITNESSES:w,mk2PaletteRuntimeSourceStatusO119:status,O119_RUNTIME_QUALIFICATION:q}=
 await import(pathToFileURL(resolve('src/games/mk2/research/runtimeStagePaletteSourceO119.ts')).href);
const report=JSON.parse(await readFile(resolve('research_outputs/O119_80_VS_79_RUNTIME_PALETTE_IMAGES.json')));
let checks=0;
function ok(b,m){if(!b)throw Error('O119 TS: '+m);checks++}
for(const stage of ['tomb','portal']){
 const v=w[stage],pos=report.cases[String(v.positiveCase)],neg=report.cases[String(v.negativeCase)];
 ok(pos.patch.recordPhysical===v.sourceRecord,stage+' stage identity');
 ok(pos.patch.sourceIndex===v.sourceColorIndex,stage+' color index');
 ok(pos.screenshot.exactInjectedRGBPixels===v.positiveRgbPixelCount,stage+' positive pixel count');
 ok(neg.screenshot.exactInjectedRGBPixels===v.negativeRgbPixelCount,stage+' control count');
 ok(pos.screenshot.screenshotSHA256===v.positiveScreenshotSHA256,stage+' positive file provenance');
 ok(neg.screenshot.screenshotSHA256===v.negativeScreenshotSHA256,stage+' control provenance');
 ok(status(stage).includes('Live palette handle and DAC bank remain unknown'),stage+' qualification');
}
ok(q.includes('LIVE_VGA_HANDLE_UNRESOLVED'),'no fabricated runtime handle');
console.log(JSON.stringify({checks,status:'PASS',meaning:'Runtime source-record perturbation, not VGA handle assignment'},null,2));
