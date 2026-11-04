#!/usr/bin/env python3
"""Independent two-file original MK2 source verifier (does NOT import producer)."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
E={0x62090:'b8da090000',0x62095:'e892fdffff',0x6209a:'a37c170300',0x620b2:'a334000300',
0x620c8:'b824000300',0x620cd:'e89a030000',0x6247c:'8b00',0x62480:'e8cec50300',0x6248d:'8b5604',
0x62491:'8b5e10',0x62498:'e8c7c50300',0x624a1:'e89ec50300',0x624a9:'3b4604',
0x620f3:'b808000000',0x620f8:'e803feffff',0x6214e:'a17c170300',0x62155:'c1e804',
0x62158:'31db',0x6215d:'b808000000',0x62162:'e8d1fdffff',0x66f60:'66b89d4d',
0x670dd:'8b357c170300',0x670e3:'8b4624',0x67101:'c7462400000000',
0x7a2c6:'8b157c170300',0x7a2cc:'8b5228'}
D={0:'e9eb07',3:'e9af03',6:'cf',7:'b003cf',0x7ee:'66505351525657551e06',
0x7f8:'8cc8',0x7fa:'8ed8',0x7fc:'8ec0',0x8a8:'f6063c00ff',0x8ad:'7551',
0x8af:'ff062400',0x8b3:'7504',0x8b5:'ff062600',0x8b9:'ff062800',0x8bd:'7504',
0x8bf:'ff062a00',0x8c3:'f7061600ffff',0x900:'8b1e3600',0x939:'fe0eec00',
0x93d:'7914',0x93f:'c606ec0002',0x94e:'2eff2e0c00',0x953:'b060',0x955:'e620',0x961:'cf'}
CALLS={0x62095:0x61e2c,0x620cd:0x6246c,0x62480:0x9ea53,0x62498:0x9ea64,0x624a1:0x9ea44,0x620f8:0x61f00,0x62162:0x61f38}
SCHEMAS={k:'mk2_'+k.lower()+'_'+s+'_v1' for k,s in [('O159','original_rm_driver_resource_file_loader'),('O160','irq8_original_16bit_counter_writer'),('O161','irq8_driver_to_scheduler_counter_join'),('O162','irq8_secondary_counter_28_game_consumer'),('O163','irq8_original_chain_and_pic_branch')]}
LIMITS={
'O159':{'driverFileBytesIdentityVerified':True,'originalDOSFileLoaderProven':True,'loadedDriverBytesActuallyObservedInEmulator':False},
'O160':{'counterWriterOriginalBytesVerified':True,'gatedCounterUpdateSourceProven':True,'unconditionalIRQ8IncrementsProven':False,'measuredIRQFrequencyHz':False},
'O161':{'conditionalIRQ8ToSchedulerCounterSourceDataflowProven':True,'liveIRQ8HandlerInvokedInDOSBox':False,'wallClockTickFrequencyMeasured':False,'perAnimationFrameTimeMeasured':False,'gameFPSProven':False},
'O162':{'sharedRealModeCounterSourceProven':True,'separateProtectedModeConsumerProven':True,'stageCameraClockSemanticsProven':False,'liveCounterValuesMeasured':False},
'O163':{'counterResetAndSourceBranchProven':True,'savedOriginalVectorChainSourceProven':True,'specificEOIPortOutputSourceProven':True,'actualBIOSHandlerInvocationRateMeasured':False}}
def witness(report,name,expected):
 arr=report.get(name,[])
 if len(arr)!=len(expected):raise ValueError('Witness count mismatch')
 obs={}
 for z in arr:
  a=int(z['physical'],16);h=z['bytes'].lower()
  if a in obs:raise ValueError('Duplicate witness')
  obs[a]=h
 if obs!=expected:raise ValueError('Original fixed site mismatch')
def verify(e,d,results):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EH:raise ValueError('Wrong original game executable')
 if len(d)!=2522 or hashlib.sha256(d).hexdigest()!=DH:raise ValueError('Wrong original real-mode driver')
 if set(results)!=set(SCHEMAS):raise ValueError('Unknown/missing pass report')
 checks=0
 for k,r in results.items():
  if r.get('schema')!=SCHEMAS[k] or r.get('limits')!=LIMITS[k] or r.get('originalExeSHA256')!=EH or r.get('originalDriverSHA256')!=DH or r.get('driverOriginalSize')!=2522 or r.get('sourceIsExePlusSeparateOriginalCommercialDriver') is not True:raise ValueError('Forged provenance/timing evidence')
  checks+=6
  for source, expected, name in ((e,E,'exeWitnesses'),(d,D,'driverWitnesses')):
   if name in r:
    witness(r,name,expected)
    for at,h in expected.items():
     if source[at:at+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Canonical source opcode mismatch')
     checks+=1
 # Cross-file resource link independently derived, not from report generator.
 ptr,length,flags=struct.unpack_from('<III',e,0xa0c54+0x30024)
 if (ptr,length,flags)!=(0x74c,0x9da,9) or e[0xa0c54+ptr:0xa0c54+ptr+7]!=b'RM.DRV\0':raise ValueError('Original resource source wrong')
 if results['O159'].get('resourceRecord')!={'resourceName':'RM.DRV','resourceLength':2522,'resourceFileRecordObject2':'0x30024','fileNameObject2':'0x74C','flagsOriginal':9}:raise ValueError('Forged resource metadata')
 checks+=7
 observed={int(z['site'],16):int(z['target'],16) for z in results['O159'].get('originalRel32Calls',[])}
 if observed!=CALLS or len(observed)!=len(results['O159']['originalRel32Calls']):raise ValueError('Bad loader call graph')
 for at,dest in CALLS.items():
  if e[at]!=0xe8 or at+5+struct.unpack_from('<i',e,at+1)[0]!=dest:raise ValueError('False relative source call')
  checks+=1
 for start,target in ((0,0x7ee),(3,0x3b5)):
  if d[start]!=0xe9 or start+3+struct.unpack_from('<h',d,start+1)[0]!=target:raise ValueError('IRQ entry is not a jump to handler')
  checks+=1
 for site,target in ((0x8ad,0x900),(0x8b3,0x8b9),(0x8bd,0x8c3),(0x93d,0x953)):
  if site+2+struct.unpack_from('<b',d,site+1)[0]!=target:raise ValueError('Wrong original driver counter/chain branch')
  checks+=1
 x=results['O160']
 if (x.get('handlerEntryOffset'),x.get('counterGateFlagOffset'),x.get('tickCounterLowOffset'),x.get('tickCounterHighOffset'),x.get('secondCounterLowOffset'),x.get('secondCounterHighOffset'))!=(0x7ee,0x3c,0x24,0x26,0x28,0x2a):raise ValueError('False exact counter field layout')
 if len(x.get('sourceFacts',[]))!=3:raise ValueError('Lost counter gate qualification')
 checks+=7
 y=results['O161'].get('join',{})
 if y!={'fileRecordObject2':0x30024,'driverBytes':2522,'sharedBlockPointerObject2':0x3177c,
  'installedIRQ8HandlerOffset':0,'handlerJumpTarget':0x7ee,'conditionalSourceCounterDwordOffset':0x24,
  'consumerCounterDwordOffset':0x24,'realModeDriverWordIncrements':[0x8af,0x8b5],
  'frameControllerConsumerPhysical':0x670dd,'frameControllerClearPhysical':0x67101,'originalPITDivisor':0x4d9d}:raise ValueError('Forged two-file counter join')
 checks+=11
 z=results['O162']
 if z.get('secondCounterReadOriginalPhysical')!=0x7a2c6 or z.get('secondCounterFieldOffset')!=0x28 or z.get('secondCounterWriterOffsets')!=[0x8b9,0x8bf]:raise ValueError('False secondary counter origin')
 checks+=3
 w=results['O163']
 if (w.get('chainCounterByteOffset'),w.get('chainResetValue'),w.get('branchAt'),w.get('sourceSavedVectorFarPointerOffset'),w.get('nonChainEOIPort'),w.get('nonChainSpecificEOIValue'))!=(0xec,2,0x93d,0xc,0x20,0x60):raise ValueError('False IRQ8 chaining logic')
 checks+=6
 return checks
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--exe',required=True);a.add_argument('--driver',required=True);a.add_argument('--report-dir',required=True);o=a.parse_args()
 r={k:json.loads((Path(o.report_dir)/(k+'_REPORT.json')).read_text()) for k in SCHEMAS}
 print('PASS O159-O163 independently verified original EXE + RM.DRV assertions:',verify(Path(o.exe).read_bytes(),Path(o.driver).read_bytes(),r))
