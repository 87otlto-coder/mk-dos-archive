#!/usr/bin/env python3
"""Independent original-byte and output audit for O139–O141.
Does not import the report producer. All observed code windows are fixed independently.
"""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# This independent table intentionally records different-sized patches from producer.
CHECKS={
'O139':[(0x67222,'5551'),(0x67235,'8b0e89088906'),(0x67242,'66c740060100'),(0x67248,'89501c'),(0x6726f,'897818'),(0x67182,'8b7e18'),
(0x827f2,'895054'),(0x827f6,'8b15705a0700895058'),(0x82801,'8b156c5a070089505c'),(0x8280f,'8b465c'),(0x82812,'a3785a0700'),(0x82818,'8b1089156c5a0700'),
(0x64528,'a16c5a070089473c'),(0x64531,'8b5008895728'),(0x64539,'8b1089572c'),(0x82746,'c7056c5a0700b4640100'),(0x82764,'c7056c5a0700b4640100'),(0x82e6c,'c7056c5a070090640100')],
'O140':[(0x6433f,'983dff0f0000'),(0x6434a,'b801000000894640'),(0x6435a,'ff4e40'),(0x64360,'8b563c895640'),(0x64367,'8b1d785a07008b1b'),(0x64375,'7416'),(0x64377,'8b5f34f7c302000000'),
(0x64382,'e83e290200'),(0x64388,'e8ecfaffff'),(0x86ca1,'e81f000000'),(0x86ca6,'720a'),(0x86cab,'e85f04feff'),(0x86cba,'e85004feff'),
(0x86cc5,'8b15785a07008b1a'),(0x86ccd,'8305785a070004'),(0x86cd4,'f7c30000f0ff'),(0x86d14,'83fb0175c3'),(0x86d26,'e851ca0000'),(0x86d3b,'83fb007412'),(0x86d50,'f8c3'),(0x86d52,'f9c3'),
(0x6710f,'5a66894606'),(0x67114,'89561c'),(0x67158,'66ff4e06'),(0x67185,'ff661c'),
(0x82d51,'c705785a070014780100'),(0x82d65,'b806000000'),(0x82d6f,'e8e615feff'),(0x82db3,'c705785a0700ec770100'),(0x82dc7,'b806000000'),(0x82dd1,'e88415feff'),
(0x82826,'b806000000'),(0x8283a,'b801000000'),(0x82844,'e8111bfeff'),(0x828ff,'c705785a0700d8640100'),(0x82909,'b806000000'),(0x82918,'e97c430000'),(0x82994,'c705785a0700f8640100'),(0x8299e,'b803000000'),(0x829ad,'e9e7420000')],
'O141':[(0x9378f,'0fb76f24'),(0x9377c,'0fb75724'),(0x93793,'8b4f3c'),(0x93796,'3bcb'),(0x93798,'7504'),(0x9379a,'3bea'),(0x9379c,'745c'),
(0x937a2,'8b472ce89c000000'),(0x937ba,'8b4b088b03'),(0x937bf,'e882000000'),(0x937c4,'66c7474a0000'),(0x937ca,'89472c894f28895724895f3c'),
(0x937d8,'2b05705a07002b2d745a0700'),(0x937e4,'016f1c'),(0x937e7,'014718'),(0x937fa,'8b474c85c0'),(0x93801,'8b5710895010'),
(0x93825,'8b4f18'),(0x93828,'8b571c'),(0x9382b,'030d705a0700'),(0x93831,'0315745a0700'),(0x93848,'8b4b04'),(0x9385a,'c1e110'),(0x93870,'f6c210')]}
EDGES={0x827eb:0x67222,0x82e76:0x827df,0x82750:0x827df,0x8276e:0x827df,
       0x8289d:0x64548,0x64548:0x64522,0x86d26:0x9377c,0x64382:0x86cc5,0x64388:0x63e79,
       0x82918:0x86c99,0x829ad:0x86c99,0x82d6f:0x6435a,0x82dd1:0x6435a,0x82844:0x6435a,0x8283f:0x6710f}
TRACKS={
 'tomb_flying_a':(0x17814,8,'countdown_step_with_scheduler_six_yield',0x82d33),
 'tomb_flying_b':(0x177ec,8,'countdown_step_with_scheduler_six_yield',0x82d9a),
 'portal_swaying':(0x164b4,7,'saved_task_list_countdown_six_one_yield_loop',0x8280c),
 'portal_hanging':(0x164d8,7,'sequence_runner_scheduler_six_yield',0x828ff),
 'portal_electric':(0x164f8,6,'sequence_runner_scheduler_three_yield',0x8291f),
 'tower_original_effect':(0x16490,7,'shared_task_list_countdown_six_one_yield_loop',0x8280c)}
SCHEMAS={'O139':'mk2_o139_effect_task_object_binding_v1','O140':'mk2_o140_effect_animation_advance_routes_v1','O141':'mk2_o141_sprite_descriptor_anchor_transforms_v1'}
LIMITS={'O139':set(['live number of spawned effects','exact absolute sprite X/Y','renderer draw order','effect actually visible']),
'O140':set(['scheduler dispatch Hz','wall clock seconds per effect frame','guaranteed frame-on-every-yield','live branch/mode conditions','stage effects visible in actual fights']),
'O141':set(['actual in-game world position','camera-relative sprite viewport position','effect parallax','runtime palette identity','timed animation export'])}
class SourceVerificationError(AssertionError):pass
def verify(exe, reports):
 count=0
 def chk(cond,msg):
  nonlocal count
  if not cond:raise SourceVerificationError(msg)
  count+=1
 chk(len(exe)==861133,'expected EXE size')
 chk(hashlib.sha256(exe).hexdigest()==SHA,'original EXE hash')
 chk(set(reports)==set(SCHEMAS),'exact report population')
 for key,expected in SCHEMAS.items():
  r=reports[key]
  chk(r.get('schema')==expected,f'{key} schema')
  chk(r['source']['canonicalExeSHA256']==SHA,f'{key} source identity')
  chk(r['source']['sourcePhysicalOffsetsNotRuntimeAddresses'] is True,'physical address qualification')
  chk(set(r['notEstablished'])==LIMITS[key],f'{key} unresolved limits retained')
  # Reject fabricated/moved witness labels, or passing by merely repeating forged evidence.
  declared=r['witnesses'];chk(len(declared)==len({x['physical'] for x in declared.values()}),f'{key} witness physical uniqueness')
  for label,row in declared.items():
   at=row['physical'];raw=bytes.fromhex(row['originalBytes'])
   chk(0<=at<len(exe) and raw==exe[at:at+len(raw)],f'{key} witness {label}')
  chk(len(declared)=={'O139':21,'O140':43,'O141':20}[key],f'{key} expected number of witnesses')
  for at,hexbytes in CHECKS[key]:chk(exe[at:at+len(bytes.fromhex(hexbytes))]==bytes.fromhex(hexbytes),f'{key} independently anchored code {at:x}')
  for entry in r['source']['edges'].values():
   at=entry['callOrJumpAtPhysical'];target=entry['targetPhysical']
   chk(at in EDGES and target==EDGES[at],f'{key} authorized direct edge')
  chk(len(r['source']['edges'])==len(EDGES),f'{key} full direct edges')
 for site,target in EDGES.items():
  chk(exe[site] in (0xe8,0xe9),f'call/jmp opcode {site:#x}')
  chk(site+5+struct.unpack_from('<i',exe,site+1)[0]==target,f'direct control edge {site:#x}')
 a=reports['O139'];d=reports['O140'];g=reports['O141']
 chk(a['taskSavedRenderObjectField']==24 and a['taskRestoresRenderObjectAtPhysical']==0x67182,'coroutine preserves EDI')
 chk(len(a['stageTaskLinkages'])==2,'two specifically linked stage initializers')
 for stage,src,initializer in [('Portal',0x164b4,0x8272a),('Tower',0x16490,0x82e38)]:
  entries=[x for x in a['stageTaskLinkages'] if x['stage']==stage]
  chk(len(entries)==1,'stage uniqueness')
  x=entries[0]
  chk((x['listObject2'],x['initializer'],x['helper'],x['callback'],x['firstDescriptorBindToRenderObject'])==(src,initializer,0x827df,0x8280c,0x64522),'stage linked field signatures')
  chk(x['taskSavedFields']=={'initPositionInput':0x54,'context':0x58,'effectList':0x5c},'task capture field map')
 chk(d['countdownTaskFields']=={'resetCount':60,'remainingCount':64},'countdown task offsets')
 chk(d['schedulerTaskFields']=={'yieldCounter':6,'continuation':28},'saved scheduling offsets')
 chk(d['sourceSchedulerYields']=={'tombFlyingA':6,'tombFlyingB':6,'portalSway':1,'portalHanging':6,'portalElectric':3},'scheduler source literals')
 chk(d['sourceCountdownInitialValues']=={'tombFlyingA':1,'tombFlyingB':1,'portalSwayAndTower':6},'source countdown literals')
 chk(d['animationAdvanceConditional']=={'renderObjectFlagField':52,'alternateInterpreterBit':2,
     'normalInterpreterPhysical':0x86cc5,'alternateInterpreterPhysical':0x63e79,'zeroNextTokenSkipsUpdate':True},'advance mode route')
 chk(d['sequenceDriverPhysical']==0x86c99 and d['streamConsumerPhysical']==0x9377c,'consumer linkage')
 chk(len(d['frameTracks'])==len(TRACKS),'source track count')
 for r in d['frameTracks']:
  key=r['track'];chk(key in TRACKS,'authorized original track')
  offset,num,path,callback=TRACKS[key]
  chk((r['originalListObject2'],r['originalDescriptorCount'],r['sourcePath'],r['sourceCallbackPhysical'])==(offset,num,path,callback),'track provenance')
  base=0xa0c54+offset
  ptrs=list(struct.unpack_from('<'+str(num)+'I',exe,base))
  chk(r['originalDescriptorPointersObject2']==ptrs,'independent descriptor sequence')
  chk(all(0<p<0x30000 for p in ptrs),'bounded source descriptor pointer')
  marker=struct.unpack_from('<I',exe,base+4*num)[0]
  wantzero=key in ('portal_hanging','portal_electric')
  chk(marker==(0 if wantzero else 1),'actual terminator type')
  if marker==1:chk(struct.unpack_from('<I',exe,base+4*(num+1))[0]==offset,'original restart pointer')
  chk(r['termination']==('zero_terminator' if wantzero else f'loop_pointer_to_0x{offset:x}'),'terminator description')
 chk(set(x['track'] for x in d['frameTracks'])==set(TRACKS),'all six tracks exactly')
 chk(sum(x['originalDescriptorCount'] for x in d['frameTracks'])==43,'43 original frame list references')
 chk(g['consumerPhysical']==0x9377c and g['descriptorPointerRenderObjectField']==60,'descriptor location')
 chk(g['objectPositionFixedPointFields']==[24,28],'position object fields')
 chk(g['descriptorGeometryFields']==[0,4,8],'descriptor fields')
 chk(g['oldAndNewDescriptorTransformsPhysical']==0x93846,'source anchor helper')
 chk(g['descriptorEqualitySkipsReconfiguration'] is True,'pointer equality path')
 chk(g['objectPositionMutationStyle']=='add old vs new source-descriptor-dependent correction, not assign absolute coordinates','no invented positions')
 return {'status':'PASS_O139_O140_O141_INDEPENDENT_STATIC_SOURCE','assertions':count,'stageTracks':6,'sourceFrameDescriptors':43,
         'executableHash':SHA,'timingVerified':False,'runtimeVisibilityVerified':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--report-dir',required=True);args=p.parse_args()
 reports={k:json.loads((Path(args.report_dir)/(k+'_REPORT.json')).read_text()) for k in SCHEMAS}
 print(json.dumps(verify(Path(args.exe).read_bytes(),reports),indent=2))
