#!/usr/bin/env python3
"""O110U: conditional VGA index-zero DAC6 update semantics from original MK2.EXE.
Only modeled source values, no observed runtime frame colors.
"""
import hashlib,json,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ANCHORS={
 0x7b30b:'f705e85c070000800000',
 0x7b315:'740e',
 0x7b32e:'f705e85c070000800000',
 0x7b338:'7539',
 0x7b33a:'bac8030000',
 0x7b33f:'33c0',
 0x7b341:'ee',
 0x7b342:'42',
 0x7b343:'a1e85c0700',
 0x7b34a:'c1e809243f0c01ee',
 0x7b354:'8bc7c1e804243f0c01ee',
 0x7b360:'8bc7d1e0243f0c01ee',
 0x7b369:'810de85c070000800000',
 0x7b373:'8b2dd8630500',
 0x84e17:'c705e85c0700ff7f0000',
 0x84e35:'c705e85c070000000000',
 0x93df5:'c705e85c0700ff7f0000',
 0x93e13:'c705e85c070000000000',
}

def eval0(value):
 value &= 0xffffffff
 if value & 0x8000:return {'writeCount':0,'events':[],'nextValue':value,'path':'HIGH_BIT_ALREADY_SET'}
 channels=[((value>>9)&0x3f)|1,((value>>4)&0x3f)|1,((value<<1)&0x3f)|1]
 return {'writeCount':4,'events':[[0x3c8,0]]+[[0x3c9,v] for v in channels],
         'nextValue':value|0x8000,'path':'WRITE_INDEX_ZERO_ONCE'}

def main():
 if len(sys.argv)!=3:raise SystemExit('usage <original-mk2-dir> <outdir>')
 b=(Path(sys.argv[1])/'mk2.exe').read_bytes();assert hashlib.sha256(b).hexdigest()==SHA
 for off,hx in ANCHORS.items():assert b[off:off+len(hx)//2].hex()==hx,hex(off)
 cases=[{'name':tag,'syntheticGlobal':v,'expectedDACPath':eval0(v)} for tag,v in [
  ('reset_zero',0),('literal_fullwhite',0x7fff),('zero_already_uploaded',0x8000),
  ('fullwhite_already_uploaded',0xffff),('arbitrary_15bit_value',0x1234)]]
 assert cases[0]['expectedDACPath']['events']==[[0x3c8,0],[0x3c9,1],[0x3c9,1],[0x3c9,1]]
 assert cases[1]['expectedDACPath']['events']==[[0x3c8,0],[0x3c9,63],[0x3c9,63],[0x3c9,63]]
 assert not cases[2]['expectedDACPath']['events'] and not cases[3]['expectedDACPath']['events']
 report={'format':'mk2_o110u_vga_zero_dac6_conditional_replay_v1','status':'SOURCE_AUTHENTICATED_OFFLINE_ONLY',
 'sourceExeSHA256':SHA,'entryZeroStateGlobal':0x75ce8,'uploadedFlagMask':0x8000,
 'sourceAnchors':{hex(at):hx for at,hx in ANCHORS.items()},
 'confirmedDirectLiteralWriters':{'white':[0x84e17,0x93df5],'zero':[0x84e35,0x93e13]},
 'cases':cases,'model':{'writeUsesIndexZeroAt3c8':True,'writesDAC6To3c9':True,
   'channelRule':'((word>>9)&63)|1,((word>>4)&63)|1,((word<<1)&63)|1',
   'setsUploadedFlagAfterDACWrites':True,'highBitAlreadySetSkipsDAC0Write':True,
   'lowColourBitsMayBeMutatedElsewhere':True},
 'limitations':{'sampleGlobalValuesAreHypothetical':True,'fullExactAliasWriterCensusProven':False,
 'visiblePaletteZeroColorProven':False,'sourceLiteralWriterExecutionObserved':False,
 'sampleVgaRetraceWaitModeled':False}}
 out=Path(sys.argv[2]);out.mkdir(exist_ok=True,parents=True)
 dest=out/'MK2_O110U.json';dest.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','pass':'O110U','samples':len(cases),'indexZeroWriteVariants':3,
 'liveIndexZeroColor':'UNKNOWN','output':str(dest)}))
if __name__=='__main__':main()
