#!/usr/bin/env python3
"""Independent O134 callback/callsite verifier. No producer imports."""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1=0x61c54;O2=0xa0c54
TABLES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
SITES={'tomb':(0x82ce7,0x82cfa),'portal':(0x82793,0x827bf,0x827d2,0x827e6)}
STAGES=('DEDPOOL.GRA','TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PIT.GRA','PORTAL.GRA','ARENA.GRA','CAVE.GRA')

def audit(exe,report):
 checks=0
 def need(ok,label):
  nonlocal checks;checks+=1
  if not ok:raise AssertionError('O134 independent: '+label)
 def dw(at):return struct.unpack_from('<I',exe,at)[0]
 # Independently reparse LE page relocation streams instead of using the producer.
 fixup_sources={}
 le=0x28f0c
 need(exe[le:le+2]==b'LE','LE header')
 page_base=le+struct.unpack_from('<I',exe,le+0x68)[0]
 block=le+struct.unpack_from('<I',exe,le+0x6c)[0]
 for page in range(113):
  at=block+struct.unpack_from('<I',exe,page_base+page*4)[0]
  stop=block+struct.unpack_from('<I',exe,page_base+(page+1)*4)[0]
  obj=1 if page<63 else 2
  page_in_object=page if obj==1 else page-63
  while at<stop:
   kind=exe[at]&15;flags=exe[at+1];source=struct.unpack_from('<h',exe,at+2)[0];at+=4
   target_obj=struct.unpack_from('<H',exe,at)[0] if flags&64 else exe[at]
   at+=2 if flags&64 else 1
   target=None
   if kind!=2:
    target=struct.unpack_from('<I' if flags&16 else '<H',exe,at)[0]
    at+=4 if flags&16 else 2
   if flags&4:at+=4 if flags&32 else 2
   fixup_sources[(obj,page_in_object*4096+source)]=(kind,flags,target_obj,target)
  need(at==stop,'relocation page boundary')
 def relocated(obj,source,tobj,target):
  need(fixup_sources.get((obj,source))==(7,16,tobj,target),'typed LE relocation '+hex(source))
 def sd(at):return struct.unpack_from('<i',exe,at)[0]
 need(len(exe)==861133 and hashlib.sha256(exe).hexdigest()==HASH,'original identity')
 need(report['schema']=='mk2_o134_stage_initializer_callback_sources_v1' and report['exeSHA256']==HASH,'report identity')
 need(exe[0x81f41:0x81f4a]==bytes.fromhex('8b1883c00450ffd358'),'loader callback instructions')
 need(report['sourceLoaderPhysical']==0x81f41 and report['rootCallbackFieldOffset']==16,'loader metadata')
 need(len(report['firstTenStages'])==10,'stage count')
 for idx,row in enumerate(report['firstTenStages']):
  need(row['stageIndex']==idx and row['resourceName']==STAGES[idx],'stage ordinal')
  need(len(row['modeCandidates'])==3,'mode count')
  observed=[]
  for mode,base in TABLES.items():
   root=dw(O2+base+idx*4);ptr=dw(O2+root+16)
   need(O1+ptr<len(exe) and O1+ptr>=O1,'callback in EXE')
   selected=next(x for x in row['modeCandidates'] if x['mode']==mode)
   need(selected['rootObject2']==root and selected['callbackPointerFieldObject2']==root+16 and
        selected['callbackObject1']==ptr and selected['callbackPhysical']==O1+ptr,'mode callback bytes')
   observed.append(ptr)
  need(len(set(observed))==1 and row['callbackObject1']==observed[0] and row['callbackPhysical']==O1+observed[0],'callback stability')
 need(report['firstTenStages'][1]['callbackPhysical']==0x82cd7,'Tomb callback')
 need(report['firstTenStages'][7]['callbackPhysical']==0x8272a,'Portal callback')
 need(exe[0x82cd7:0x82ce0]==bytes.fromhex('833d4c010300007426'),'Tomb mode branch')
 need(exe[0x8272a:0x82737]==bytes.fromhex('833d4c010300000f84a7000000'),'Portal mode branch')
 for stage,locs in SITES.items():
  row=report['examinedBehaviorCandidates'][stage]
  need(row['callbackPhysical']==report['firstTenStages'][1 if stage=='tomb' else 7]['callbackPhysical'],'stage callback identity')
  need(row['registrationSiteCount']==len(locs) and len(row['registrations'])==len(locs),'site count')
  targets=[]
  for at,rec in zip(locs,row['registrations']):
   need(exe[at-5:at+1]==bytes.fromhex('bb06000000ba'),'EBX6 plus MOV EDX')
   need(exe[at+5]==0xe8 and at+10+sd(at+6)==0x67222,'call relative target')
   ptr=dw(at+1);targets.append(O1+ptr)
   relocated(1,at+1-O1,1,ptr)
   need((rec['moveFunctionPointerPhysical'],rec['registrationCallPhysical'],rec['registerRoutinePhysical'],rec['argumentEBX'],
      rec['registeredFunctionObject1'],rec['registeredFunctionPhysical'])==(at,at+5,0x67222,6,ptr,O1+ptr),'report code target')
   need(rec['scope']==('nested_helper' if at==0x827e6 else 'init_callback'),'reported scope')
  need(row['distinctFunctionTargets']==sorted(set(targets)),'registered target list')
 for at in (0x82750,0x8276e):need(exe[at]==0xe8 and at+5+sd(at+1)==0x827df,'Portal helper call')
 need(report['portalNestedHelperPhysical']==0x827df,'Portal helper metadata')
 need(report['portalObjectFieldWrites']==[0x54,0x58,0x5c] and exe[0x827f2:0x827f5]==b'\x89\x50\x54' and
      exe[0x827fc:0x827ff]==b'\x89\x50\x58' and exe[0x82807:0x8280a]==b'\x89\x50\x5c','Portal per-object field writes')
 limits=report['limitations']
 for v in ('selectedCandidateCalledDuringFight','registeredFunctionsExecuteDuringFight','registeredFunctionIsAnimationFrameSequence',
           'animationFramesRecovered','animationLoopOrTimingRecovered','cameraParallaxRateRecovered'):
  need(limits[v] is False,'unsupported claim '+v)
 need(limits['sourceGraphicsRemainUncropped'] is True,'uncropped preservation')
 return {'status':'PASS_O134_INDEPENDENT','assertions':checks,'stageRootsChecked':30,'registrationCallSitesChecked':6,'distinctOriginalRoutineTargets':5}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--report',type=Path,required=True);a=ap.parse_args()
 print(json.dumps(audit(a.exe.read_bytes(),json.loads(a.report.read_text())),indent=2))
