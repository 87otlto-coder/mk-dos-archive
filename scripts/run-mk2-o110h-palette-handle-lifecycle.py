#!/usr/bin/env python3
"""O110H: original MK2 palette handle-table lifecycle; static bytes only.

Do not turn possible allocator states into claims about an observed stage.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path

EXE_SHA = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ_START, OBJ_END = 0x61c54, 0xa0c54
TARGETS = {'reset': 0x7b41f, 'find': 0x7b404, 'request': 0x7b439,
           'release': 0x7b505, 'clearCount': 0x7b536, 'evictPointer': 0x7b55e,
           'stageDraw': 0x9e118, 'stagePixelBlit': 0x659c6}
EXPECTED = {'reset': [0x64659,0x66d51], 'find':[0x64896,0x6502b],
 'request':[0x640c7,0x64600,0x6466a,0x707cd,0x74cee,0x771ba,0x779f4,0x77d7c,
  0x81dda,0x85abf,0x85c79,0x86b1f,0x989af,0x98c65,0x98c79,0x98d6f,
  0x995a6,0x9964f,0x997ba,0x9ab0e,0x9abd9,0x9d626,0x9e3be],
 'release':[0x7b3fd,0x86c7d], 'clearCount':[], 'evictPointer':[],
 'stageDraw':[0x93585], 'stagePixelBlit':[0x9e191]}
# Each declaration documents an opcode-anchored mechanism. Source bytes are
# checked again in a separate independent verifier.
ANCHORS = {
 'tableReset':(0x7b427,'bf005b0700b97800000033c0f3ab'),
 'findEntry':(0x7b407,'3904dd005b0700'),
 'requestMatchSearch':(0x7b43c,'33db3904dd005b0700'),
 'requestReuseJump':(0x7b445,'0f84ac000000'),
 'requestSlotLimit':(0x7b44c,'80fb3c'),
 'requestUnusedEntryTest':(0x7b458,'66f704dd045b0700ffff'),
 'requestActiveBankBase':(0x7b464,'8a14dd065b0700'),
 'requestActivePalettePointer':(0x7b46b,'8b0cdd005b0700'),
 'requestActivePaletteCount':(0x7b472,'660311'),
 'requestEmptyEntryBranch':(0x7b462,'7423'),
 'requestFallbackFirstBank':(0x7b453,'ba01000000'),
 'requestEncodePaletteQueue':(0x7b4a3,'e828feffff'),
 'requestPointerStore':(0x7b4aa,'8904dd005b0700'),
 'requestBankStartStore':(0x7b4b1,'8814dd065b0700'),
 'requestNextSlotLimit':(0x7b4ba,'80fb3c'),
 'requestNextActiveTest':(0x7b4bf,'66f704dd045b0700ffff'),
 'requestShiftFollowingBase':(0x7b4d7,'8814dd065b0700'),
 'requestReturnSlot':(0x7b4f7,'8bc3'),
 'requestIncrementReference':(0x7b4f9,'66ff04dd045b0700'),
 'releaseSlotBounds':(0x7b505,'83f83c'),
 'releaseDecrement':(0x7b514,'66ff0cc5045b0700'),
 'releaseClearPointerOnZero':(0x7b52a,'c704c5005b070000000000'),
 'clearCountOnActive':(0x7b552,'66c704c5045b07000000'),
 'evictComparePointer':(0x7b564,'3904dd005b0700'),
 'evictClearPointer':(0x7b576,'8904dd005b0700'),
 'evictClearRefcount':(0x7b57d,'668904dd045b0700'),
 'stageSlotOneLiteral':(0x9e18b,'b801000000'),
 'stageSourceIndexLoad':(0x9e165,'a17f740700'),
 'blitterIndexedHandleBase':(0x659ea,'8a04c5065b0700'),
}


def extract(b):
 assert hashlib.sha256(b).hexdigest() == EXE_SHA
 assert len(b) == 861133
 anchored={}
 for name, (addr, expected) in ANCHORS.items():
  raw=bytes.fromhex(expected)
  assert b[addr:addr+len(raw)] == raw, (name,hex(addr))
  anchored[name]={'offset':addr,'hex':expected}
 sites={}
 for name, dest in TARGETS.items():
  positions=[p for p in range(OBJ_START,OBJ_END-4) if b[p] == 0xe8 and p+5+struct.unpack_from('<i',b,p+1)[0] == dest]
  assert positions == EXPECTED[name], name
  sites[name]={'target':dest,'positions':positions,
               'encodings':[b[p:p+5].hex() for p in positions]}
 assert b[0x7b427:0x7b438].hex().startswith('bf005b0700b97800000033c0f3ab')
 return anchored,sites


def main():
 if len(sys.argv) != 3: raise SystemExit('usage: script.py <original-mk2-dir> <outdir>')
 fixture,out = (Path(p) for p in sys.argv[1:])
 b=(fixture/'mk2.exe').read_bytes()
 anchored,sites=extract(b)
 report={
 'format':'mk2_o110h_palette_handle_lifecycle_v1',
 'status':'PASS_STATIC_SOURCE_MECHANICS_ONLY',
 'sourceExeSHA256':EXE_SHA,
 'sourceObject1Range':[OBJ_START,OBJ_END],
 'targetByteAnchors':anchored,'exactE8DestinationEncodings':sites,
 'entryTable':{'linearBase':0x75b00, 'entryCount':60,'entryStrideBytes':8,
   'pointerFieldOffset':0,'referenceCountFieldOffset':4,'referenceCountWidthBits':16,
   'bankStartFieldOffset':6,'bankStartWidthBits':8,
   'resetDWORDCount':120,'resetTotalBytes':480},
 'allocator':{'entryPointPhysical':0x7b439,'matchingPointerReturnsExistingIndex':True,
  'matchingPointerIncrementsReferenceCount':True,'emptySlotPredicate':'referenceCount==0',
  'insertsPalettePointerInFirstFreeSlot':True,'newPaletteBankPlacementDependsOnExistingLiveEntries':True,
  'initialBankBaseForNoPreviousLiveEntries':1,
  'bankBaseStoredAs8Bits':True,'returnValue':'slot index in EAX',
  'exhaustionPath':0x7b47b,'selectedSourceActualStageRuntimeHandle':'UNRESOLVED'},
 'release':{'entryPointPhysical':0x7b505,'decrementsRefcount':True,
   'zeroCountClearsPointer':True,'zeroCountClearsBankBase':False},
 'otherOperations':{'findByPointer':0x7b404,'resetAll':0x7b41f,
    'zeroReferenceCount':0x7b536,'evictPointerAndCount':0x7b55e},
 'stageConsumer':{'stageDrawPhysical':0x9e118,'soleExactE8CallPhysical':0x93585,
    'paletteHandleLiteral':1,'sourceIndexGlobal':0x7747f,
    'blitterPhysical':0x659c6,'blitterPaletteBankDynamicLookupPhysical':0x659ea,
    'resolvedRuntimeHandleOneRecord':'UNKNOWN',
    'concreteFinalStageRGBProven':False},
 'conditionalIllustrations':[
  {'name':'fresh_allocator_then_record_A','precondition':'table reset; no active entries',
   'paletteRecordCount':48,'assignedHandle':0,'assignedBankBase':1},
  {'name':'fresh_allocator_then_record_B_then_A','precondition':'table reset; B 64 colors requested first and stays live',
   'paletteRecordCount':48,'assignedHandle':1,'assignedBankBase':65},
  {'name':'fresh_allocator_then_record_A_then_B','precondition':'table reset; A 48 colors requested first and stays live',
   'paletteRecordCount':64,'assignedHandle':1,'assignedBankBase':49},
  {'name':'same_record_requested_again','precondition':'record A pointer already present, referenceCount>0',
   'paletteRecordCount':48,'assignedHandle':'same as prior A','referenceCountChange':1}],
 'limitations':[
  'E8 destination-byte matches are a static census, not observed execution or an independently proven full CFG.',
  'No initial/reset call ordering relative to actual stage activation is established.',
  'The allocator output is a handle index, not necessarily palette handle 1.',
  'Downstream palette use reads mutable per-handle bank bases; requests may reuse slots and refcounts vary.',
  'Examples are constrained arithmetic illustrations, not DOSBox traces or observed gameplay palettes.',
  'No claim that a 48- or 64-color record is the complete color source for ARMORY.GRA.']}
 out.mkdir(parents=True,exist_ok=True)
 path=out/'MK2_O110H_PALETTE_HANDLE_LIFECYCLE.json'
 path.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'result':'PASS','report':str(path),'tableSlots':60,
  'requestCallsites':len(sites['request']['positions']),
  'slotOneRuntimeOwner':'UNKNOWN'},indent=2))

if __name__ == '__main__':main()
