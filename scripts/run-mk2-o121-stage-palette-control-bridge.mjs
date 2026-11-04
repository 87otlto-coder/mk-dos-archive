#!/usr/bin/env node
/** O121 browser metadata ↔ independently audited executable control graph. */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const {O121_STAGE_SETUP_CONTROL:live,O121_ALTERNATIVE_RESOURCE:alt,mk2PaletteControlGraphStatusO121:status}=
 await import(pathToFileURL(resolve('src/games/mk2/research/stagePaletteControlO121.ts')).href);
const report=JSON.parse(await readFile(resolve('research_outputs/O121_STAGE_PALETTE_CONTROL_RESOURCE_BINDINGS.json')));
let checks=0;
function ck(v,msg){if(!v)throw Error(`O121 browser evidence: ${msg}`);checks++}
ck(report.status==='PASS_STATIC_CONDITIONAL_BINDINGS','static status');
for(const [stage,label,alternative] of [['tomb','tomb80','tomb79'],['portal','portal80','portal79']]){
 const f=report.families.find(x=>x.familyLabel===label),a=report.families.find(x=>x.familyLabel===alternative),c=live[stage];
 ck(!!f&&!!a,'family existence');
 ck(c.sourceRecord===f.palettePhysical,'source palette origin');
 ck(c.sourceResource===f.resourceName&&c.resourceId===f.resourceID,'stage resource ID/name');
 ck(c.paletteSlot===f.verifiedSlot,'selected palette table slot');
 ck(c.setupRecords===f.setupCount,'setup count');
 ck(c.controlEntries===f.controlCount,'control count');
 ck(c.distinctSpriteDescriptors===f.distinctDescriptorOffsets,'sprite descriptor count');
 ck(c.colorMatchingAlternativeRecord===a.palettePhysical,'lookalike palette origin');
 ck(a.resourceName===alt.name&&a.resourceID===alt.resourceId,'separate 79-color graphics owner');
 ck(a.setupCount===alt.setupRecordsPerCandidate&&a.controlCount===alt.controlEntriesPerCandidate,'alternative setup group');
 ck(status(stage).includes('Actual runtime setup selection, palette handle, and DAC index remain unmeasured.'),'no inflated runtime claim');
}
ck(!report.limitations.livePaletteHandle,'no runtime handle');
ck(!report.limitations.activatedSetupObjectAtRuntime,'no runtime setup');
ck(report.totals.controlEntries===135,'total control corpus');
console.log(JSON.stringify({status:'PASS',checks,meaning:'Conditional palette slot and resource provenance; runtime handle unmeasured'},null,2));
