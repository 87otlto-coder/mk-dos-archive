/* Authenticate O135 source constants independently of the Python producer. */
import fs from 'node:fs';
import {readMK2StageEffectCoroutinesO135} from '../src/games/mk2/research/stageEffectCoroutineO135.ts';
const [exeFile,reportFile]=process.argv.slice(2);
if(!exeFile||!reportFile)throw Error('Usage: node ... original-MK2.EXE O135-report.json');
const exe=new Uint8Array(fs.readFileSync(exeFile)),report=JSON.parse(fs.readFileSync(reportFile));
let checks=0;
function same(a,b,why){if(JSON.stringify(a)!==JSON.stringify(b))throw Error('Mismatch '+why);checks++}
for(const stage of ['tomb','portal']){
 const js=await readMK2StageEffectCoroutinesO135(exe,stage),py=report.stages[stage];
 same(js.schedulerRegistrationPhysical,report.scheduler.registrationPhysical,'scheduler');
 same(js.yieldPhysical,report.scheduler.yieldPhysical,'yield');
 same(js.functionEntryPoints,py.functions.map(f=>f.functionPhysical),'target functions');
 same(js.sourcePointerObjects,stage==='tomb'?py.sourcePointerAssignments.map(v=>v.targetObject2):py.otherSourcePointers.map(v=>v.targetObject2),'original source pointer targets');
 for(const x of ['sourceDelaysAreNotFramesOrSeconds','fullNativeSpritesStillExportable'])same(js[x],true,'source honesty');
 for(const x of ['animationFrameOrderKnown','animationFrameRateKnown','renderedObjectBindingKnown','observedInFight'])same(js[x],false,'no fake animation');
 if(stage==='tomb'){
  same(js.sixCountYieldSites,py.sixCountYieldSites,'Tomb yield locations');
  same(js.comparisonThresholds,py.comparisonThresholds,'Tomb comparison constants');
 }else{
  same(js.positionOutputField,py.boundedUpdate.objectFieldWritten,'Portal object field');
  same(js.boundedUpdate.initial,py.boundedUpdate.initial,'Portal init');
  same(js.boundedUpdate.step,py.boundedUpdate.delta,'Portal step');
  same(js.boundedUpdate.positiveLimit,py.boundedUpdate.positiveThreshold,'Portal upper');
  same(js.boundedUpdate.negativeLimit,py.boundedUpdate.negativeThreshold,'Portal lower');
  same(js.boundedUpdate.ascendingStepCount,py.boundedUpdate.sourceAscendingValues.length,'positive code steps');
  same(js.boundedUpdate.descendingStepCount,py.boundedUpdate.sourceDescendingValues.length,'negative code steps');
  same(js.boundedUpdate.sourceArithmeticIsNotPlayback,true,'no invented playback');
 }
}
console.log(JSON.stringify({status:'PASS_O135_STATIC_BROWSER_PARITY',checks}));
