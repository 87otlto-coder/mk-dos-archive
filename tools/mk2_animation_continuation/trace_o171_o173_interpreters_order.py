#!/usr/bin/env python3
"""O171–O173: strictly source-backed original MK2 sprite stream grammars and list traversal.
Never execute original callbacks; never interpret source file offsets as runtime addresses.
"""
import argparse, hashlib, json, struct, sys
from pathlib import Path
EXE_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1=0x61c54; O2=0xa0c54; TABLE=0x7a4
TARGET_OFFSETS=[0x224f,0x22ac,0x22bd,0x22c7,0x22e2,0x230b,0x2297,0x2282,0x2263,0x225c]
HANDLER_OPERANDS=['return','jump_to_DWORD_pointer','call_helper_no_extra_operands','signed_i16_then_helper','two_signed_i16_then_helper','DWORD_then_helper_and_carry','DWORD_indirect_code_call','DWORD_then_helper','WORD_condition_then_DWORD_jump_or_skip','call_helper_and_continue']
W171={
 'alternateEntry':(0x63e79,'a1785a07008b00'),
 'advance':(0x63e80,'8305785a070004'),
 'zeroTest':(0x63e87,'a9ffffffff7415'),
 'dispatchMax':(0x63e8e,'83f8097611'),
 'dispatchScaleAndTable':(0x63ea4,'c1e00205a40700008b00ffe0'),
 'zeroHandler':(0x63ea3,'c3'),
 'oneJump':(0x63f00,'a1785a07008b00a3785a0700'),
 'twoCall':(0x63f11,'e8af030000'),
 'threeSignedWord':(0x63f1b,'a1785a07000fbf00'),
 'fourSignedWords':(0x63f36,'a1785a07000fbf00'),
 'fiveDWORD':(0x63f5f,'a1785a07008b00'),
 'fiveCarry':(0x63f7c,'f9c3'),
 'sixIndirectCall':(0x63eeb,'a1785a07008b00'),
 'sixCallIndirect':(0x63ef9,'ffd0'),
 'sevenDWORDHelper':(0x63ed6,'a1785a07008b00'),
 'eightWORDHelper':(0x63eb7,'a1785a07000fb700'),
 'eightConditional':(0x63ecb,'7233'),
 'nineHelper':(0x63eb0,'e823040000'),
 'oversizeCall':(0x63e93,'e847020000'),
 'oversizeClearCarry':(0x63ea2,'f8'),
}
W172={
 'normalReaderCursor':(0x86cc5,'8b15785a07008b1a'),
 'normalFirstAdvance':(0x86ccd,'8305785a070004'),
 'descriptorClassHighBits':(0x86cd4,'f7c30000f0ff'),
 'nonPointerClassFlagConstruct':(0x86cdc,'b800000200668bc3'),
 'classEqualsSpecial':(0x86ce4,'3bd8'),
 'globalFlagClearBit4':(0x86ce8,'8325685a0700ef'),
 'specialLowerBits':(0x86cef,'81e3ffff0000'),
 'globalFlagOrLowerBits':(0x86cf5,'091d685a0700'),
 'callOriginalConsumer':(0x86d26,'e851ca0000'),
 'lookaheadClass':(0x86d33,'f7c30000f0ff'),
 'lookaheadZeroTest':(0x86d3b,'83fb00'),
 'lookaheadOneTest':(0x86d40,'83fb01'),
 'lookaheadRewindPointer':(0x86d46,'8b5204'),
 'lookaheadCursorWrite':(0x86d49,'8915785a0700'),
 'returnClearCarry':(0x86d50,'f8c3'),
 'returnSetCarry':(0x86d52,'f9c3'),
}
W173={
 'headForDefaultList':(0x665fa,'ba58430800'),
 'firstSortKey':(0x665ff,'8b5820'),
 'secondSortKey':(0x66603,'8b501c'),
 'readExistingLink':(0x66613,'8b12'),
 'existingFirstKey':(0x6661d,'8b4a20'),
 'signedFirstKeyCompare':(0x66620,'3bd9'),
 'greaterFollowNext':(0x66622,'7fe9'),
 'lessInsertBefore':(0x66624,'7c0b'),
 'existingSecondKey':(0x66626,'8b4a1c'),
 'signedSecondKeyCompare':(0x66629,'390d6c5a0700'),
 'greaterSecondFollowNext':(0x6662f,'7fdc'),
 'newNodeNext':(0x66631,'8910'),
 'positiveRendererGetNext':(0x93390,'8b6d00'),
 'positiveRendererNextTest':(0x93393,'85ed'),
 'positiveRendererRepeat':(0x93395,'0f8549feffff'),
 'positiveStageListSelect':(0x935a1,'8be8'),
 'positiveStageDrawIteratorCall':(0x935a3,'e8e8fdffff'),
 'movementGate':(0x931f6,'f705885a0700ffffffff'),
 'xStoredMotion':(0x93205,'015d18'),
 'yStoredMotion':(0x9320b,'015d1c'),
 'drawEnabledGate':(0x9320e,'f705d462050001000000'),
}

def exact(exe,w):
 for name,(p,s) in w.items():
  if exe[p:p+len(bytes.fromhex(s))]!=bytes.fromhex(s):raise ValueError('Original byte mismatch '+name)
def ptrs(exe):
 return [struct.unpack_from('<I',exe,O2+TABLE+i*4)[0] for i in range(10)]
def rel(exe,at):return at+5+struct.unpack_from('<i',exe,at+1)[0]
def source(exe):
 if len(exe)!=861133 or hashlib.sha256(exe).hexdigest()!=EXE_HASH:raise ValueError('Canonical MK2.EXE only')
 for w in (W171,W172,W173):exact(exe,w)
 if ptrs(exe)!=TARGET_OFFSETS:raise ValueError('Wrong original alternate command table')
 if rel(exe,0x935a3)!=0x93390 or rel(exe,0x86d26)!=0x9377c:raise ValueError('Wrong consumer/join')
 # Typed relocations validate this table as original executable-owned dispatcher, not byte coincidences.
 sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'mk2_native_stage_palettes'))
 from trace_o120_setup_graph import fixups
 fx=fixups(exe)
 f=fx.get((1,0x63ea8-O1))
 if not f or (f['kind'],f['targetObject'],f['targetOffset'])!=(7,2,TABLE):raise ValueError('Typed jump table source pointer absent')
 for i,p in enumerate(ptrs(exe)):
  e=fx.get((2,TABLE+i*4))
  if not e or (e['kind'],e['targetObject'],e['targetOffset'])!=(7,1,p):raise ValueError('Unrelocated alternate command handler')
 return True

def witnesses(w):return [{'label':name,'physicalOffset':f'0x{p:X}','originalBytes':s} for name,(p,s) in w.items()]
def make(exe):
 source(exe)
 return {
 'O171':{'schema':'mk2_o171_alternate_animation_command_dispatch_v1','originalExeSHA256':EXE_HASH,
  'table':{'object2Offset':TABLE,'physicalFileOffset':O2+TABLE,'entries':[{'token':i,'originalObject1Target':p,'physicalHandler':O1+p,'operandForm':HANDLER_OPERANDS[i]} for i,p in enumerate(ptrs(exe))],
   'sourcePointerRelocationObject':2,'entryRelocationTargetObject':1},
  'witnesses':witnesses(W171),'unknownCommand':'values greater than 9 call 0x640DF and return carry clear',
  'limits':{'handlersSourceProven':True,'callbacksEverExecutedInFight':False,'safeToBlindlyDecodeAllListsAsThisGrammar':False,'zeroTokenSetsCarry':False,'animationTimingKnown':False}},
 'O172':{'schema':'mk2_o172_original_normal_stream_special_flags_v1','originalExeSHA256':EXE_HASH,
  'witnesses':witnesses(W172),'cursorGlobalOperand':0x75a78,'specialClass':{'constructedPrefix':0x20000,'sourceLow16':True,'condition':'EBX equals 0x20000 OR low16(EBX)','flagStorageOperand':0x75a68,'clearMask':0xffffffef,'orSourceLow16':True},
  'sourceFirstDescriptorConsumer':0x9377c,'sourceLoopToken':1,'sourceZeroToken':0,'carrySetOnlyOnSourceZero':True,
  'limits':{'separateFromAlternateInterpreter':True,'specialFlagMeaningFullyKnown':False,'runtimeFlagsKnown':False,'actualDrawStateProven':False}},
 'O173':{'schema':'mk2_o173_within_list_original_insert_and_draw_order_v1','originalExeSHA256':EXE_HASH,
  'witnesses':witnesses(W173),'linkedNodeNextField':0,'insertKeyOffsets':[0x20,0x1c],
  'ordering':'signed_int32_lexicographic_ascending_at_insertion; equals inserted before existing',
  'positiveControlTokenToRenderer':{'rootInEBPAtPhysical':0x935a1,'callIteratorAtPhysical':0x935a3,'iterateAtPhysical':0x93390,'nextField':0},
  'conditionalMotion':{'mutatedPositionFields':[0x18,0x1c],'motionGateOperand':0x75a88,'drawGateOperand':0x562d4},
  'limits':{'withinListInsertionOrderSourceProven':True,'linkedTraversalUsesSameNextField':True,'laterPositionsMayMutate':True,'alwaysCurrentlySorted':False,'interListDrawOrderProven':False,'runtimeListContentsObserved':False}},
 }
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--outdir',required=True);a=p.parse_args();out=Path(a.outdir)
 if out.exists():raise ValueError('No output overwrite')
 r=make(Path(a.exe).read_bytes());out.mkdir(parents=True)
 for k,v in r.items():(out/(k+'_REPORT.json')).write_text(json.dumps(v,indent=2)+'\n')
 print('PASS O171-O173 original alternate interpreter, normal stream flag controls, within-list order; no timing claims')
