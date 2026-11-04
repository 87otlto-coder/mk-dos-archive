#!/usr/bin/env python3
"""O110R/S: bounded source-side stage-selector and command-walker provenance.
Static control paths only; no assertion about actually executing a particular route.
"""
import hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
LO,HI=0x61c54,0xa0c54
# R: source selector copy and mode-conditioned next-selector table choices
R={
 'stageSelectorSourceLoad':(0x82321,'a1805a0700'),
 'stageSelectorCopy':(0x82326,'a37f740700'),
 'advanceIndexScale':(0x8232c,'c1e002'),
 'variantTwoBase':(0x8232f,'baec5b0100'),
 'variantModeTwoTest':(0x82334,'833d4c01030002'),
 'variantOneBase':(0x8233d,'ba685c0100'),
 'variantModeOneTest':(0x82342,'833d4c01030001'),
 'variantDefaultBase':(0x8234b,'bae45c0100'),
 'advanceBaseAdd':(0x82350,'03c2'),
 'advanceTableIndirect':(0x82353,'8b00'),
 'advanceStore':(0x82355,'a3805a0700'),
 'stageSourceRead':(0x9e165,'a17f740700'),
 'stageSourceDeltaLookup':(0x9e16a,'03348554ef0200')}
# S: command walker; 0xffff_ffff (-1) sentinel triggers stage routine, while nonnegative
# command values enter the alternate branch (not a claim about command semantics).
S={
 'walkerSourceCursorLoad':(0x93547,'8b0d985a0700'),
 'walkerReadTag':(0x9354d,'8b01'),
 'walkerCursorAdvance':(0x9354f,'83c104'),
 'walkerSentinelTest':(0x93552,'a9ffffffff'),
 'walkerZeroBranch':(0x93557,'7451'),
 'walkerNegativeBranch':(0x93559,'7931'),
 'walkerNegativeIncrement':(0x9355b,'40'),
 'walkerNegativeSpecial':(0x9355c,'7410'),
 'walkerPositiveModeCheck':(0x9355e,'833d4c01030000'),
 'walkerSpecialReadRawSourcePointer':(0x9356e,'8b31'),
 'walkerSpecialPointerDeref':(0x93573,'8b36'),
 'walkerSpecialReadY':(0x93575,'8b39'),
 'walkerSpecialReadRowCount':(0x9357a,'8b19'),
 'walkerAdvanceCursorStore':(0x9357f,'890d985a0700'),
 'walkerDrawCall':(0x93585,'e88eab0000'),
 'walkerPositiveReadSourcePointer':(0x9358c,'8b31'),
 'walkerPositiveReadWord':(0x93591,'668b36'),
 'walkerPositiveWriteStageState':(0x93594,'668935685a0700'),
 'walkerPositiveCursorStore':(0x9359b,'890d985a0700'),
 'walkerPositiveDispatch':(0x935a3,'e8e8fdffff'),
 'rendererGateTest':(0x9e118,'f705d462050001000000'),
 'rendererSourceIndex':(0x9e165,'a17f740700'),
 'rendererPaletteHandleOne':(0x9e18b,'b801000000'),
 'rendererRasterCall':(0x9e191,'e83078fcff')}

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <canonical-mk2-dir> <outdir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();out=Path(sys.argv[2]);out.mkdir(exist_ok=True,parents=True)
 assert hashlib.sha256(b).hexdigest()==SHA
 for name,(at,hx) in list(R.items())+list(S.items()):assert b[at:at+len(hx)//2].hex()==hx,(name,hex(at))
 refs=[i for i in range(LO,HI-3) if b[i:i+4]==bytes.fromhex('7f740700')]
 assert refs==[0x82327,0x9e166]
 assert b[0x8233b:0x8233d]==bytes.fromhex('7413')
 assert b[0x82349:0x8234b]==bytes.fromhex('7405')
 r={'format':'mk2_o110r_stage_source_selector_local_provenance_v1','status':'SOURCE_CODE_CONDITIONAL_ONLY',
    'sourceExeSHA256':SHA,'selectorGlobal':0x7747f,'mutableNextSelectorGlobal':0x75a80,
    'modeGlobal':0x3014c,'exactDirectSelectorOccurrences':refs,
    'locations':{name:{'at':at,'hex':hx} for name,(at,hx) in R.items()},
    'transitions':{'copyFromMutableSelectorPhysical':0x82321,
       'copyIntoRenderSelectorPhysical':0x82326,
       'advanceUsesOldSelectorTimesFour':True,
       'tableBaseIfMode2':0x15bec,'tableBaseIfMode1':0x15c68,
       'tableBaseOtherwise':0x15ce4,
       'mutatingReadBackToMutableSelectorAt':0x82355,
       'rendererReadsCopyAt':0x9e165,
       'rendererAppliesIndirectSelectedOffsetAt':0x9e16a},
    'qualifications':{'modeTableContentsDecoded':False,'runtimeChosenVariantKnown':False,
      'stageResourceIdentityForSourceSelectorKnown':False,'stageRuntimePaletteHandleOneKnown':False,
      'directOccurrenceCensusIsNotAliasCompleteness':True}}
 # Bounded conditional branches and control data from original code.
 calls=[(0x93585,0x9e118),(0x935a3,0x93390),(0x9e191,0x659c6),(0x93567,0x938ca)]
 for at,dest in calls:assert b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==dest
 for at,target in [(0x93557,0x935aa),(0x93559,0x9358c),(0x9355c,0x9356e)]:
  assert at+2+struct.unpack_from('<b',b,at+1)[0]==target
 s={'format':'mk2_o110s_stage_command_walker_bounded_dispatch_v1','status':'SOURCE_CODE_CONDITIONAL_ONLY',
    'sourceExeSHA256':SHA,'parentO110RSourceSelectorSHA256':None,
    'locations':{name:{'at':at,'hex':hx} for name,(at,hx) in S.items()},
    'calls':[{'at':a,'destination':d} for a,d in calls],
    'branches':[{'at':a,'target':d} for a,d in [(0x93557,0x935aa),(0x93559,0x9358c),(0x9355c,0x9356e)]],
    'walker':{'cursorGlobal':0x75a98,'stageSentinelUnsigned':0xffffffff,
              'specialCommandIsNegativeOneAfterIncrement':True,
              'onSpecialReadsPointerThenDereferences':True,
              'specialReadsDestinationYAndRows':True,
              'specialCallsStageRenderer':True,
              'otherNegativeCommandModeDependent':True,
              'nonnegativeCommandSeparateDispatch':True},
    'renderer':{'renderFlagBit0Test':0x9e118,'stageIndexCopyGlobal':0x7747f,
        'paletteHandleOneLiteralAt':0x9e18b,'rasterCallAt':0x9e191},
    'qualifications':{'observedCommandStreamOrder':False,'runtimeStageRowCounts':False,
        'actualPaletteHandleOneRecord':False,'actualCompositedScene':False,
        'completeControlFlowOrIndirectCallInventory':False}}
 out1=out/'MK2_O110R.json';out1.write_text(json.dumps(r,indent=2)+'\n')
 s['parentO110RSourceSelectorSHA256']=hashlib.sha256(out1.read_bytes()).hexdigest()
 (out/'MK2_O110S.json').write_text(json.dumps(s,indent=2)+'\n')
 print(json.dumps({'status':'PASS','passes':['O110R','O110S'],'selectorDirectSites':len(refs),'boundedDispatchCalls':len(calls),'out':str(out)}))
if __name__=='__main__':main()
