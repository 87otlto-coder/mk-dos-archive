#!/usr/bin/env python3
"""Independent O110R/S bounded source-walker verifier. No producer imports."""
import hashlib,json,struct,sys
from pathlib import Path
SRC='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def digest(b):return hashlib.sha256(b).hexdigest()
def verify(b,r,s,rb):
 k=0
 def ck(x,msg):
  nonlocal k
  if not x:raise AssertionError(msg)
  k+=1
 ck(digest(b)==SRC,'canonical source')
 ck(r['format']=='mk2_o110r_stage_source_selector_local_provenance_v1','R format')
 ck(s['format']=='mk2_o110s_stage_command_walker_bounded_dispatch_v1','S format')
 ck(r['status']=='SOURCE_CODE_CONDITIONAL_ONLY' and s['status']=='SOURCE_CODE_CONDITIONAL_ONLY','status')
 ck(r['sourceExeSHA256']==SRC and s['sourceExeSHA256']==SRC,'report executable')
 ck(s['parentO110RSourceSelectorSHA256']==digest(rb),'parent linkage')
 for item in [r,s]:
  for name,entry in item['locations'].items():
   at=entry['at'];hx=entry['hex']
   ck(b[at:at+len(hx)//2].hex()==hx,'authentic source opcode '+name)
 # Independent direct operand discovery, not trusting reported positions/count.
 target=struct.pack('<I',0x7747f)
 refs=[p for p in range(0x61c54,0xa0c54-3) if b[p:p+4]==target]
 ck(refs==[0x82327,0x9e166] and r['exactDirectSelectorOccurrences']==refs,'stage selector direct refs')
 ck(b[0x82321:0x8232b].hex()=='a1805a0700a37f740700','source copied to renderer')
 ck(b[0x8232b:0x8232c].hex()=='52','push saved edx')
 ck(b[0x8232c:0x8232f].hex()=='c1e002','selector index x4')
 for p,q in ((0x8232f,'baec5b0100'),(0x8233d,'ba685c0100'),(0x8234b,'bae45c0100')):
  ck(b[p:p+5].hex()==q,'mode-table base')
 ck(b[0x82334:0x8233b].hex()=='833d4c01030002','mode == 2')
 ck(b[0x8233b:0x8233d].hex()=='7413' and 0x8233d+(0x13)==0x82350,'mode2 branch')
 ck(b[0x82342:0x82349].hex()=='833d4c01030001','mode == 1')
 ck(b[0x82349:0x8234b].hex()=='7405','mode1 branch')
 ck(b[0x82350:0x8235a].hex()=='03c25a8b00a3805a0700','advance table and store')
 ck(b[0x9e165:0x9e171].hex()=='a17f74070003348554ef0200','renderer indirect delta')
 ck(r['selectorGlobal']==0x7747f and r['mutableNextSelectorGlobal']==0x75a80 and r['modeGlobal']==0x3014c,'global identities')
 for key,num in [('copyFromMutableSelectorPhysical',0x82321),('copyIntoRenderSelectorPhysical',0x82326),
    ('mutatingReadBackToMutableSelectorAt',0x82355),('rendererReadsCopyAt',0x9e165),('rendererAppliesIndirectSelectedOffsetAt',0x9e16a),
    ('tableBaseIfMode2',0x15bec),('tableBaseIfMode1',0x15c68),('tableBaseOtherwise',0x15ce4)]:
  ck(r['transitions'][key]==num,'transition '+key)
 ck(r['transitions']['advanceUsesOldSelectorTimesFour'] is True,'index stride')
 ck(r['qualifications']=={'modeTableContentsDecoded':False,'runtimeChosenVariantKnown':False,
   'stageResourceIdentityForSourceSelectorKnown':False,'stageRuntimePaletteHandleOneKnown':False,
   'directOccurrenceCensusIsNotAliasCompleteness':True},'R runtime restrictions')
 # Exact command walker decoding, confirmed CALL targets and signed branches.
 cmd=[(0x93585,0x9e118),(0x935a3,0x93390),(0x9e191,0x659c6),(0x93567,0x938ca)]
 ck(s['calls']==[{'at':a,'destination':d} for a,d in cmd],'command E8 map')
 for at,dst in cmd:
  ck(b[at]==0xe8 and at+5+struct.unpack_from('<i',b,at+1)[0]==dst,'call rel32 '+hex(at))
 branch=[(0x93557,0x935aa),(0x93559,0x9358c),(0x9355c,0x9356e)]
 ck(s['branches']==[{'at':a,'target':d} for a,d in branch],'branch mapping')
 for at,dst in branch:
  ck(at+2+struct.unpack_from('<b',b,at+1)[0]==dst,'short branch '+hex(at))
 ck(b[0x93552:0x9355e].hex()=='a9ffffffff74517931407410','tag parser')
 ck(b[0x9356e:0x93588].hex()=='8b3183c1048b368b3983c1048b1983c104890d985a0700e88eab','special args') if False else None
 for p,hexstr in ((0x9356e,'8b31'),(0x93570,'83c104'),(0x93573,'8b36'),(0x93575,'8b39'),(0x93577,'83c104'),(0x9357a,'8b19'),(0x9357c,'83c104'),(0x9357f,'890d985a0700'),(0x93585,'e88eab0000'),(0x9358c,'8b31'),(0x93591,'668b36'),(0x93594,'668935685a0700')):
  ck(b[p:p+len(hexstr)//2].hex()==hexstr,'walker special argument '+hex(p))
 walk=s['walker'];ck(walk['cursorGlobal']==0x75a98,'walker cursor')
 ck(walk['stageSentinelUnsigned']==0xffffffff and walk['specialCommandIsNegativeOneAfterIncrement'] is True,'correct sentinel -1')
 for key in ('onSpecialReadsPointerThenDereferences','specialReadsDestinationYAndRows',
    'specialCallsStageRenderer','otherNegativeCommandModeDependent','nonnegativeCommandSeparateDispatch'):
  ck(walk[key] is True,'walker qualification '+key)
 ck(s['renderer']=={'renderFlagBit0Test':0x9e118,'stageIndexCopyGlobal':0x7747f,
     'paletteHandleOneLiteralAt':0x9e18b,'rasterCallAt':0x9e191},'renderer handoff')
 for key in ('observedCommandStreamOrder','runtimeStageRowCounts','actualPaletteHandleOneRecord',
             'actualCompositedScene','completeControlFlowOrIndirectCallInventory'):
  ck(s['qualifications'][key] is False,'unknown status '+key)
 return {'status':'PASS','checks':k,'selectorReferences':2,'specialCommandTag':-1,'runtimeSceneCompositingProven':False}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage <fixture-dir> <report-dir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();d=Path(sys.argv[2]);raw=(d/'MK2_O110R.json').read_bytes()
 print(json.dumps(verify(b,json.loads(raw),json.loads((d/'MK2_O110S.json').read_bytes()),raw)))
