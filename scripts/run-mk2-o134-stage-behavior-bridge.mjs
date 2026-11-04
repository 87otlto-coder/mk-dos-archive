/* Read only original EXE, compare independently sourced callback candidates. */
import fs from 'node:fs';
import {readMK2StageBehaviorCallbacksO134} from '../src/games/mk2/research/stageBehaviorCallbacksO134.ts';
const [gameFile,reportFile]=process.argv.slice(2);
if(!gameFile||!reportFile)throw Error('Provide MK2.EXE and O134 callback report');
const exe=new Uint8Array(fs.readFileSync(gameFile));
const r=JSON.parse(fs.readFileSync(reportFile,'utf8'));let checks=0;
function eq(a,b,m){if(a!==b)throw Error(m+': '+a+' != '+b);checks++}
for(const stage of ['tomb','portal']){
 const c=await readMK2StageBehaviorCallbacksO134(exe,stage),p=r.examinedBehaviorCandidates[stage];
 eq(c.callbackPhysical,p.callbackPhysical,'callback '+stage);
 eq(c.stageIndex,p.stageIndex,'stage '+stage);
 eq(c.registrations.length,p.registrations.length,'calls '+stage);
 for(const [i,a] of c.registrations.entries()){
  const b=p.registrations[i];for(const field of ['scope','moveFunctionPointerPhysical',
    'registrationCallPhysical','registerRoutinePhysical','argumentEBX',
    'registeredFunctionObject1','registeredFunctionPhysical'])eq(a[field],b[field],stage+' '+i+' '+field);
 }
 eq(c.animationFrameSequenceKnown,false,'no fake frame order');
 eq(c.animationFrameDurationKnown,false,'no fake timing');
 eq(c.registeredFunctionRuntimeExecutionObserved,false,'no fake runtime');
 eq(c.uncroppedAssetsPreserved,true,'native pixels preserved');
}
console.log(JSON.stringify({status:'PASS_O134_BROWSER_CODE_SOURCE_PARITY',checks}));
