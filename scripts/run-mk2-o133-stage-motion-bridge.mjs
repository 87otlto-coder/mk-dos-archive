/* Independent Node/browser bridge for O133 source motion words, not animation claims. */
import fs from 'node:fs';
import {readMK2StageMotionSourceO133} from '../src/games/mk2/research/stageMotionSourceInputsO133.ts';
const [exeFile,reportFile]=process.argv.slice(2);
if(!exeFile||!reportFile)throw Error('Usage: node --experimental-strip-types scripts/run-mk2-o133-stage-motion-bridge.mjs MK2.EXE O133_STAGE_MOTION_INPUTS.json');
const exe=new Uint8Array(fs.readFileSync(exeFile)),report=JSON.parse(fs.readFileSync(reportFile,'utf8'));
let checks=0;
for(const [stage,index] of [['tomb',1],['portal',7]]){
 const candidate=await readMK2StageMotionSourceO133(exe,stage);
 const source=report.stages.find(s=>s.stageIndex===index);
 function eq(a,b,name){if(a!==b)throw Error(`${stage} ${name}: ${a} != ${b}`);checks++}
 eq(candidate.sourceTableObject2,source.sourceTableByMode[0].sourceTableObject2,'table');
 eq(candidate.stageIndex,index,'stage index');
 for(let i=0;i<9;i++)eq(candidate.rawSigned16_16[i],source.sourceWordsSigned16_16[i],`coefficient ${i}`);
 for(const [name,value] of Object.entries(candidate.modeCandidates)){
  const v=source.sourceTableByMode.find(x=>x.mode===name);
  eq(value.rootObject2,v.rootObject2,`mode ${name} root`);
  eq(value.inputObject2,v.sourceTableObject2,`mode ${name} input`);
 }
 eq(candidate.animationFrameSequenceRecovered,false,'frame evidence');
 eq(candidate.parallaxMultiplierRecovered,false,'parallax evidence');
 eq(candidate.nativeSourceMustRemainUncropped,true,'source extent');
}
console.log(JSON.stringify({status:'PASS_O133_BROWSER_SOURCE_PARITY',checks,stages:2}));
