#!/usr/bin/env python3
"""O139–O141 static source-provenance reports, canonical MK2 only.
Do not confuse task scheduler counts with elapsed time or FPS.
"""
import argparse, hashlib, json, struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
BASE=0xa0c54
# Physical code offsets are deliberately retained; they are NOT DOSBox addresses.
ANCHORS={
'O139':{
 'taskSpawnEntry':(0x67222,'5551a1085b0300'),
 'taskLinkIntoScheduler':(0x67235,'8b0e89088906'),
 'taskInitialCount':(0x67242,'66c740060100'),
 'taskInitialContinuation':(0x67248,'89501c'),
 'taskRenderObjectBinding':(0x6726f,'897818'),
 'taskPayloadCallback':(0x67276,'c7404c00000000'),
 'taskResumeRenderObject':(0x67182,'8b7e18'),
 'portalHelperListCapture':(0x82801,'8b156c5a070089505c'),
 'portalHelperObjectCapture':(0x827f2,'895054'),
 'portalHelperContextCapture':(0x827f6,'8b15705a0700895058'),
 'callbackLoadSavedList':(0x8280f,'8b465c'),
 'callbackInstallList':(0x82812,'a3785a0700'),
 'callbackSeedDescriptor':(0x82818,'8b1089156c5a0700'),
 'callbackInitSpriteCall':(0x8289d,'e8a61cfeff'),
 'graphicsDescriptorBind':(0x64528,'a16c5a070089473c'),
 'graphicsDescriptorShape':(0x64531,'8b5008895728'),
 'graphicsDescriptorDimensions':(0x64539,'8b1089572c'),
 'towerListInstall':(0x82e6c,'c7056c5a070090640100'),
 'towerSharedHelperCall':(0x82e76,'e864f9ffff'),
 'portalListInstallA':(0x82746,'c7056c5a0700b4640100'),
 'portalListInstallB':(0x82764,'c7056c5a0700b4640100')},
'O140':{
 'countdownSet':(0x6433f,'983dff0f0000'),
 'countdownInitialOne':(0x6434a,'b801000000894640'),
 'countdownDecrement':(0x6435a,'ff4e40'),
 'countdownNonzeroSkip':(0x6435d,'752e'),
 'countdownReload':(0x64360,'8b563c895640'),
 'countdownReadCurrentToken':(0x64367,'8b1d785a07008b1b'),
 'countdownSkipZero':(0x64375,'7416'),
 'countdownObjectMode':(0x64377,'8b5f34f7c302000000'),
 'countdownNormalFrameRead':(0x64382,'e83e290200'),
 'countdownAlternateReader':(0x64388,'e8ecfaffff'),
 'scriptLoopEntry':(0x86c99,'528d6dfc'),
 'scriptCallNext':(0x86ca1,'e81f000000'),
 'scriptConditionalExit':(0x86ca6,'720a'),
 'scriptYield':(0x86cab,'e85f04feff'),
 'scriptTerminateYield':(0x86cba,'e85004feff'),
 'streamRead':(0x86cc5,'8b15785a07008b1a'),
 'streamAdvance':(0x86ccd,'8305785a070004'),
 'streamClassifyPointer':(0x86cd4,'f7c30000f0ff'),
 'streamCallConsumer':(0x86d26,'e851ca0000'),
 'streamLoopMarker':(0x86d14,'83fb0175c3'),
 'streamLoopBackPointer':(0x86d1a,'8b52048915785a0700'),
 'streamZeroStop':(0x86d3b,'83fb007412'),
 'streamReturnCarry':(0x86d52,'f9c3'),
 'streamReturnClear':(0x86d50,'f8c3'),
 'yieldEntry':(0x6710f,'5a66894606'),
 'yieldSaveContinuation':(0x67114,'89561c'),
 'schedulerDecrement':(0x67158,'66ff4e06'),
 'schedulerResume':(0x67185,'ff661c'),
 'tombAInit':(0x82d51,'c705785a070014780100'),
 'tombAYield':(0x82d65,'b806000000e8a043feff'),
 'tombAAdvance':(0x82d6f,'e8e615feff'),
 'tombBInit':(0x82db3,'c705785a0700ec770100'),
 'tombBYield':(0x82dc7,'b806000000e83e43feff'),
 'tombBAdvance':(0x82dd1,'e88415feff'),
 'portalSwayInitialCount':(0x82826,'b806000000e80f1bfeff'),
 'portalSwayYield':(0x8283a,'b801000000e8cb48feff'),
 'portalSwayAdvance':(0x82844,'e8111bfeff'),
 'portalHangingInit':(0x828ff,'c705785a0700d8640100'),
 'portalHangingWait':(0x82909,'b806000000'),
 'portalHangingDriver':(0x82918,'e97c430000'),
 'portalElectricInit':(0x82994,'c705785a0700f8640100'),
 'portalElectricWait':(0x8299e,'b803000000'),
 'portalElectricDriver':(0x829ad,'e9e7420000')},
'O141':{
 'currentDescriptor':(0x93793,'8b4f3c'),
 'pointerEquality':(0x93796,'3bcb'),
 'sameDescriptorBranch':(0x93798,'7504'),
 'sameModeCompare':(0x9379a,'3bea'),
 'sameModeSkip':(0x9379c,'745c'),
 'oldDescriptorTransform':(0x937a2,'8b472ce89c000000'),
 'newDescriptorHeader':(0x937ba,'8b4b088b03'),
 'newDescriptorTransform':(0x937bf,'e882000000'),
 'writeNewDescriptor':(0x937d3,'895f3c'),
 'positionDeltaY':(0x937e4,'016f1c'),
 'positionDeltaX':(0x937e7,'014718'),
 'sourceDescriptorX':(0x93848,'8b4b04'),
 'sourceDescriptorY':(0x9385a,'c1e110'),
 'sourceFlipTest':(0x93870,'f6c210'),
 'positionRetainWhenSame':(0x937fa,'8b474c85c0'),
 'objectLinkOnEqual':(0x93801,'8b5710895010'),
 'renderPositionX':(0x93825,'8b4f18'),
 'renderPositionY':(0x93828,'8b571c'),
 'renderApplyOffsetX':(0x9382b,'030d705a0700'),
 'renderApplyOffsetY':(0x93831,'0315745a0700')}
}
TRACKS=[('tomb_flying_a',0x17814,8,'countdown_step_with_scheduler_six_yield',0x82d33),
('tomb_flying_b',0x177ec,8,'countdown_step_with_scheduler_six_yield',0x82d9a),
('portal_swaying',0x164b4,7,'saved_task_list_countdown_six_one_yield_loop',0x8280c),
('portal_hanging',0x164d8,7,'sequence_runner_scheduler_six_yield',0x828ff),
('portal_electric',0x164f8,6,'sequence_runner_scheduler_three_yield',0x8291f),
('tower_original_effect',0x16490,7,'shared_task_list_countdown_six_one_yield_loop',0x8280c)]
def require(condition,why):
 if not condition:raise ValueError(why)
def read_source(path):
 b=Path(path).read_bytes();require(len(b)==861133 and hashlib.sha256(b).hexdigest()==SHA,'source identity is not canonical MK2.EXE');return b
def check_anchor(b,k,at,raw):require(b[at:at+len(bytes.fromhex(raw))]==bytes.fromhex(raw),f'original opcode mismatch at {k} {at:#x}')
def rel32(b,at):
 require(b[at] in (0xe8,0xe9),f'rel32 opcode {at:#x}');return at+5+struct.unpack_from('<i',b,at+1)[0]
def make_reports(b):
 for group,records in ANCHORS.items():
  for k,(at,raw) in records.items():check_anchor(b,k,at,raw)
 edges={'portalHelperToSpawn':(0x827eb,0x67222),'towerToSharedHelper':(0x82e76,0x827df),
 'portalInitialToHelperA':(0x82750,0x827df),'portalInitialToHelperB':(0x8276e,0x827df),
 'callbackFirstSpriteToInit':(0x8289d,0x64548),'spriteInitToDescriptorBinder':(0x64548,0x64522),
 'streamToObjectConsumer':(0x86d26,0x9377c),'normalCountdownToStream':(0x64382,0x86cc5),
 'alternateCountdownToDifferentReader':(0x64388,0x63e79),
 'portalHangingToSequenceRunner':(0x82918,0x86c99),'portalElectricToSequenceRunner':(0x829ad,0x86c99),
 'tombAToCountdown':(0x82d6f,0x6435a),'tombBToCountdown':(0x82dd1,0x6435a),
 'portalSwayToCountdown':(0x82844,0x6435a),'portalSwayYieldToScheduler':(0x8283f,0x6710f)}
 for k,(at,target) in edges.items():require(rel32(b,at)==target,f'direct control edge {k}')
 tracks=[]
 for name,src,num,path,callback in TRACKS:
  ptrs=[struct.unpack_from('<I',b,BASE+src+j*4)[0] for j in range(num)]
  require(all(0<p<0x30000 for p in ptrs),'invalid descriptor pointer')
  tracks.append({'track':name,'originalListObject2':src,'originalDescriptorCount':num,
    'originalDescriptorPointersObject2':ptrs,'sourcePath':path,'sourceCallbackPhysical':callback})
 loop_forms={'tomb_flying_a':'loop_pointer_to_0x17814','tomb_flying_b':'loop_pointer_to_0x177ec',
   'portal_swaying':'loop_pointer_to_0x164b4','portal_hanging':'zero_terminator',
   'portal_electric':'zero_terminator','tower_original_effect':'loop_pointer_to_0x16490'}
 for r in tracks:
  end=BASE+r['originalListObject2']+4*r['originalDescriptorCount']
  x=struct.unpack_from('<I',b,end)[0]; expected=0 if 'zero' in loop_forms[r['track']] else 1
  require(x==expected,'list terminator')
  if x==1:require(struct.unpack_from('<I',b,end+4)[0]==r['originalListObject2'],'list loop pointer')
  r['termination']=loop_forms[r['track']]
 common={'canonicalExeSHA256':SHA,'sourcePhysicalOffsetsNotRuntimeAddresses':True,
   'edges':{k:{'callOrJumpAtPhysical':a,'targetPhysical':t} for k,(a,t) in edges.items()}}
 report139={'schema':'mk2_o139_effect_task_object_binding_v1','source':common,
 'witnesses':{k:{'physical':a,'originalBytes':raw} for k,(a,raw) in ANCHORS['O139'].items()},
 'stageTaskLinkages':[
 {'stage':'Portal','listObject2':0x164b4,'initializer':0x8272a,'helper':0x827df,'callback':0x8280c,
  'taskSavedFields':{'initPositionInput':0x54,'context':0x58,'effectList':0x5c},
  'firstDescriptorBindToRenderObject':0x64522},
 {'stage':'Tower','listObject2':0x16490,'initializer':0x82e38,'helper':0x827df,'callback':0x8280c,
  'taskSavedFields':{'initPositionInput':0x54,'context':0x58,'effectList':0x5c},
  'firstDescriptorBindToRenderObject':0x64522}],
 'taskSavedRenderObjectField':0x18,'taskRestoresRenderObjectAtPhysical':0x67182,
 'notEstablished':['live number of spawned effects','exact absolute sprite X/Y','renderer draw order','effect actually visible']}
 report140={'schema':'mk2_o140_effect_animation_advance_routes_v1','source':common,
 'witnesses':{k:{'physical':a,'originalBytes':raw} for k,(a,raw) in ANCHORS['O140'].items()},
 'frameTracks':tracks,'countdownTaskFields':{'resetCount':0x3c,'remainingCount':0x40},
 'schedulerTaskFields':{'yieldCounter':0x06,'continuation':0x1c},
 'animationAdvanceConditional':{'renderObjectFlagField':0x34,'alternateInterpreterBit':2,
   'normalInterpreterPhysical':0x86cc5,'alternateInterpreterPhysical':0x63e79,
   'zeroNextTokenSkipsUpdate':True},
 'sequenceDriverPhysical':0x86c99,'streamConsumerPhysical':0x9377c,
 'sourceSchedulerYields':{'tombFlyingA':6,'tombFlyingB':6,'portalSway':1,'portalHanging':6,'portalElectric':3},
 'sourceCountdownInitialValues':{'tombFlyingA':1,'tombFlyingB':1,'portalSwayAndTower':6},
 'notEstablished':['scheduler dispatch Hz','wall clock seconds per effect frame','guaranteed frame-on-every-yield','live branch/mode conditions','stage effects visible in actual fights']}
 report141={'schema':'mk2_o141_sprite_descriptor_anchor_transforms_v1','source':common,
 'witnesses':{k:{'physical':a,'originalBytes':raw} for k,(a,raw) in ANCHORS['O141'].items()},
 'consumerPhysical':0x9377c,'descriptorPointerRenderObjectField':0x3c,
 'objectPositionFixedPointFields':[0x18,0x1c],
 'descriptorGeometryFields':[0,4,8],
 'oldAndNewDescriptorTransformsPhysical':0x93846,
 'descriptorEqualitySkipsReconfiguration':True,
 'objectPositionMutationStyle':'add old vs new source-descriptor-dependent correction, not assign absolute coordinates',
 'notEstablished':['actual in-game world position','camera-relative sprite viewport position','effect parallax','runtime palette identity','timed animation export']}
 return {'O139':report139,'O140':report140,'O141':report141}
def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--outdir',required=True);opts=a.parse_args()
 dest=Path(opts.outdir);require(not dest.exists(),'refusing to overwrite destination');dest.mkdir(parents=True)
 for k,v in make_reports(read_source(opts.exe)).items():
  (dest/(k+'_REPORT.json')).write_text(json.dumps(v,indent=2)+'\n')
 print('PASS O139–O141 original source static traces (timing unverified)')
if __name__=='__main__':main()
