#!/usr/bin/env python3
"""Independent O110H validation directly from canonical MK2 executable."""
import hashlib
import json
import struct
import sys
from pathlib import Path

EXPECTED_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ROOT=0x75b00
OBJ=(0x61c54,0xa0c54)
CALLS={
 'reset':(0x7b41f,2),'find':(0x7b404,2),'request':(0x7b439,23),
 'release':(0x7b505,2),'clearCount':(0x7b536,0),'evictPointer':(0x7b55e,0),
 'stageDraw':(0x9e118,1),'stagePixelBlit':(0x659c6,1),
}
# Validates separately anchored low-level machine instructions, not author prose.
PROOFS={
 'reset': (0x7b427,bytes.fromhex('bf005b0700b97800000033c0f3ab')),
 'pointer_compare':(0x7b43e,bytes.fromhex('3904dd005b0700')),
 'reuse_branch':(0x7b445,bytes.fromhex('0f84ac000000')),
 'capacity':(0x7b44c,bytes.fromhex('80fb3c')),
 'unused_refcount':(0x7b458,bytes.fromhex('66f704dd045b0700ffff')),
 'previous_base':(0x7b464,bytes.fromhex('8a14dd065b0700')),
 'previous_count':(0x7b472,bytes.fromhex('660311')),
 'base_initial':(0x7b453,bytes.fromhex('ba01000000')),
 'queue':(0x7b4a3,bytes.fromhex('e828feffff')),
 'pointer_store':(0x7b4aa,bytes.fromhex('8904dd005b0700')),
 'start_store':(0x7b4b1,bytes.fromhex('8814dd065b0700')),
 'shift_start':(0x7b4d7,bytes.fromhex('8814dd065b0700')),
 'return_slot':(0x7b4f7,bytes.fromhex('8bc3')),
 'increment_refcount':(0x7b4f9,bytes.fromhex('66ff04dd045b0700')),
 'release_bound':(0x7b505,bytes.fromhex('83f83c')),
 'release_decrement':(0x7b514,bytes.fromhex('66ff0cc5045b0700')),
 'release_zero_ptr':(0x7b52a,bytes.fromhex('c704c5005b070000000000')),
 'clear_count':(0x7b552,bytes.fromhex('66c704c5045b07000000')),
 'evict_pointer':(0x7b576,bytes.fromhex('8904dd005b0700')),
 'evict_refcount':(0x7b57d,bytes.fromhex('668904dd045b0700')),
 'draw_slot_one':(0x9e18b,bytes.fromhex('b801000000')),
 'draw_index_load':(0x9e165,bytes.fromhex('a17f740700')),
 'dynamic_palette_base':(0x659ea,bytes.fromhex('8a04c5065b0700')),
}


def check_report(game,report):
 count=0
 def verify(cond,description):
  nonlocal count
  assert cond,description
  count+=1
 verify(hashlib.sha256(game).hexdigest()==EXPECTED_SHA,'exe fingerprint')
 verify(report['format']=='mk2_o110h_palette_handle_lifecycle_v1','format')
 verify(report['status']=='PASS_STATIC_SOURCE_MECHANICS_ONLY','status')
 verify(report['sourceExeSHA256']==EXPECTED_SHA,'reported hash')
 verify(report['sourceObject1Range']==list(OBJ),'range')
 info=report['entryTable']
 required={'linearBase':ROOT,'entryCount':60,'entryStrideBytes':8,
  'pointerFieldOffset':0,'referenceCountFieldOffset':4,'referenceCountWidthBits':16,
  'bankStartFieldOffset':6,'bankStartWidthBits':8,
  'resetDWORDCount':120,'resetTotalBytes':480}
 verify(info==required,'entry table layout')
 verify(60*8==120*4 and ROOT+480==0x75ce0,'table extent')
 for k,(offset,blob) in PROOFS.items():
  verify(game[offset:offset+len(blob)]==blob,'instruction: '+k)
 anchored=report['targetByteAnchors']
 verify(set(anchored)==set([
  'tableReset','findEntry','requestMatchSearch','requestReuseJump','requestSlotLimit',
  'requestUnusedEntryTest','requestActiveBankBase','requestActivePalettePointer',
  'requestActivePaletteCount','requestEmptyEntryBranch','requestFallbackFirstBank',
  'requestEncodePaletteQueue','requestPointerStore','requestBankStartStore',
  'requestNextSlotLimit','requestNextActiveTest','requestShiftFollowingBase',
  'requestReturnSlot','requestIncrementReference','releaseSlotBounds','releaseDecrement',
  'releaseClearPointerOnZero','clearCountOnActive','evictComparePointer',
  'evictClearPointer','evictClearRefcount','stageSlotOneLiteral',
  'stageSourceIndexLoad','blitterIndexedHandleBase']),'anchor completeness')
 for name,data in anchored.items():
  offset=int(data['offset']);raw=bytes.fromhex(data['hex'])
  verify(game[offset:offset+len(raw)]==raw,'report anchor '+name)
 mapping=report['exactE8DestinationEncodings']
 verify(set(mapping)==set(CALLS),'call target set')
 for name,(destination,number) in CALLS.items():
  positions=[]
  for p in range(*OBJ):
   if p+5>OBJ[1]:break
   if game[p]!=0xe8:continue
   displacement=struct.unpack_from('<i',game,p+1)[0]
   if p+5+displacement==destination:positions.append(p)
  verify(len(positions)==number,'call count '+name)
  verify(mapping[name]=={'target':destination,'positions':positions,
         'encodings':[game[p:p+5].hex() for p in positions]},'call sites '+name)
 verify(mapping['stageDraw']['positions']==[0x93585],'unique draw')
 verify(mapping['stagePixelBlit']['positions']==[0x9e191],'unique renderer entry')
 alloc=report['allocator']; release=report['release'];ops=report['otherOperations']
 verify(alloc['entryPointPhysical']==0x7b439 and alloc['initialBankBaseForNoPreviousLiveEntries']==1,'allocator anchor')
 verify(alloc['selectedSourceActualStageRuntimeHandle']=='UNRESOLVED','ownership fail-closed')
 for fld in ('matchingPointerReturnsExistingIndex','matchingPointerIncrementsReferenceCount','insertsPalettePointerInFirstFreeSlot','newPaletteBankPlacementDependsOnExistingLiveEntries','bankBaseStoredAs8Bits'):
  verify(alloc[fld] is True,'allocator behavior '+fld)
 verify(alloc['emptySlotPredicate']=='referenceCount==0' and alloc['returnValue']=='slot index in EAX','slot semantics')
 verify(release=={'entryPointPhysical':0x7b505,'decrementsRefcount':True,
  'zeroCountClearsPointer':True,'zeroCountClearsBankBase':False},'release behavior')
 verify(ops=={'findByPointer':0x7b404,'resetAll':0x7b41f,'zeroReferenceCount':0x7b536,'evictPointerAndCount':0x7b55e},'aux operations')
 consumer=report['stageConsumer']
 verify(consumer=={'stageDrawPhysical':0x9e118,'soleExactE8CallPhysical':0x93585,
    'paletteHandleLiteral':1,'sourceIndexGlobal':0x7747f,
    'blitterPhysical':0x659c6,'blitterPaletteBankDynamicLookupPhysical':0x659ea,
    'resolvedRuntimeHandleOneRecord':'UNKNOWN','concreteFinalStageRGBProven':False},'consumer bounds')
 examples=report['conditionalIllustrations']
 verify(len(examples)==4 and [e['name'] for e in examples]==[
   'fresh_allocator_then_record_A','fresh_allocator_then_record_B_then_A',
   'fresh_allocator_then_record_A_then_B','same_record_requested_again'],'scenarios')
 verify((examples[0]['assignedHandle'],examples[0]['assignedBankBase'],examples[0]['paletteRecordCount'])==(0,1,48),'fresh first A')
 verify((examples[1]['assignedHandle'],examples[1]['assignedBankBase'],examples[1]['paletteRecordCount'])==(1,65,48),'B then A')
 verify((examples[2]['assignedHandle'],examples[2]['assignedBankBase'],examples[2]['paletteRecordCount'])==(1,49,64),'A then B')
 verify(examples[3]['referenceCountChange']==1 and examples[3]['assignedHandle']=='same as prior A','reuse')
 verify('not DOSBox traces' in ' '.join(report['limitations']),'limitations explicit')
 return count

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: script <original-mk2-dir> <O110H-report>')
 game=(Path(sys.argv[1])/'mk2.exe').read_bytes()
 report=json.loads(Path(sys.argv[2]).read_text())
 checks=check_report(game,report)
 print(json.dumps({'status':'PASS','checks':checks,'failed':0,'runtimePaletteSlotOne':'UNKNOWN'}))
