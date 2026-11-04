#!/usr/bin/env python3
"""Independent O110U verification against source operands and conditional VGA writes."""
import hashlib,json,struct,sys
from pathlib import Path
H='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PRESETS=[('reset_zero',0,[0,1,1,1],0x8000),('literal_fullwhite',0x7fff,[0,63,63,63],0xffff),
 ('zero_already_uploaded',0x8000,[],0x8000),('fullwhite_already_uploaded',0xffff,[],0xffff),
 ('arbitrary_15bit_value',0x1234,[0,((0x1234>>9)&63)|1,((0x1234>>4)&63)|1,((0x1234<<1)&63)|1],0x9234)]

def verify(b,r):
 checks=0
 def ck(v,n):
  nonlocal checks
  if not v:raise AssertionError(n)
  checks+=1
 ck(hashlib.sha256(b).hexdigest()==H,'original source')
 ck(r['sourceExeSHA256']==H and r['format']=='mk2_o110u_vga_zero_dac6_conditional_replay_v1','identity')
 ck(r['status']=='SOURCE_AUTHENTICATED_OFFLINE_ONLY','not a runtime observation')
 ck(r['entryZeroStateGlobal']==0x75ce8 and r['uploadedFlagMask']==0x8000,'state bit')
 for addr,hx in r['sourceAnchors'].items():
  at=int(addr,16);ck(b[at:at+len(hx)//2].hex()==hx,'authentic source opcode '+addr)
 for at,target in [(0x7b315,0x7b325),(0x7b338,0x7b373)]:
  ck(at+2+struct.unpack_from('<b',b,at+1)[0]==target,'source conditional branch')
 for kind,value,sites in [('white',0x7fff,[0x84e17,0x93df5]),('zero',0,[0x84e35,0x93e13])]:
  ck(r['confirmedDirectLiteralWriters'][kind]==sites,'direct literal sites')
  for at in sites:
   ck(b[at:at+6].hex()=='c705e85c0700','literal writer opcode')
   ck(struct.unpack_from('<I',b,at+6)[0]==value,'literal source value')
 ck(len(r['cases'])==5,'example count')
 for item,(name,val,writes,nextvalue) in zip(r['cases'],PRESETS):
  ck(item['name']==name and item['syntheticGlobal']==val,'synthetic input')
  expected=item['expectedDACPath']
  ck(expected['nextValue']==nextvalue,'post write mask')
  ck(expected['writeCount']==len(writes),'number of port writes')
  ck(expected['path']==('HIGH_BIT_ALREADY_SET' if val&0x8000 else 'WRITE_INDEX_ZERO_ONCE'),'conditional path')
  events=expected['events']
  ck(events==([[0x3c8,0]]+[[0x3c9,v] for v in writes[1:]] if writes else []),'hardware port stream')
  if writes:ck(all((a[1]&1) for a in events[1:]),'DAC OR-one invariant')
 for k in ('writeUsesIndexZeroAt3c8','writesDAC6To3c9','setsUploadedFlagAfterDACWrites',
           'highBitAlreadySetSkipsDAC0Write','lowColourBitsMayBeMutatedElsewhere'):
  ck(r['model'][k] is True,'source model '+k)
 for k in ('sampleGlobalValuesAreHypothetical','visiblePaletteZeroColorProven',
           'fullExactAliasWriterCensusProven','sourceLiteralWriterExecutionObserved','sampleVgaRetraceWaitModeled'):
  ck(r['limitations'][k]==(k=='sampleGlobalValuesAreHypothetical'),'negative contract '+k)
 return {'status':'PASS','checks':checks,'samples':5,'liveColorZeroVerified':False}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage <fixture-dir> <report>')
 print(json.dumps(verify((Path(sys.argv[1])/'mk2.exe').read_bytes(),json.loads(Path(sys.argv[2]).read_text()))))
