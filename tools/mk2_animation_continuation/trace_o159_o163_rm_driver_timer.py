#!/usr/bin/env python3
"""O159-O163: two-file original MK2 timer provenance; original RM.DRV is required, never shipped.
Static code proves gated counter producer and field consumers, not live IRQ frequency/FPS.
"""
import argparse,hashlib,json,struct
from pathlib import Path
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DRV_SHA='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
OBJ2_PHYSICAL_BASE=0xa0c54
EXE_W={
 'requestOriginalDriverBytes':(0x62090,'b8da090000'),
 'callDosAllocation':(0x62095,'e892fdffff'),
 'storeDriverPointer':(0x6209a,'a37c170300'),
 'storeDriverDestinationInFileDescriptor':(0x620b2,'a334000300'),
 'loadDriverFileDescriptorPointer':(0x620c8,'b824000300'),
 'callDriverFileReader':(0x620cd,'e89a030000'),
 'driverReaderFetchPath':(0x6247c,'8b00'),
 'driverReaderOpen':(0x62480,'e8cec50300'),
 'driverReaderGetBuffer':(0x6248d,'8b5604'),
 'driverReaderFetchRequestedLength':(0x62491,'8b5e10'),
 'driverReaderRead':(0x62498,'e8c7c50300'),
 'driverReaderClose':(0x624a1,'e89ec50300'),
 'driverReadLengthCompare':(0x624a9,'3b4604'),
 'saveOriginalIRQ8':(0x620f3,'b808000000'),
 'callSaveIRQ8':(0x620f8,'e803feffff'),
 'installDriverSegment':(0x6214e,'a17c170300'),
 'setSegmentDiv16':(0x62155,'c1e804'),
 'handlerOffsetZero':(0x62158,'31db'),
 'installIRQ8Number':(0x6215d,'b808000000'),
 'callSetIRQ8Vector':(0x62162,'e8d1fdffff'),
 'configureTimerDivisor':(0x66f60,'66b89d4d'),
 'schedulerHostPointer':(0x670dd,'8b357c170300'),
 'schedulerDwordField24':(0x670e3,'8b4624'),
 'schedulerClearField24':(0x67101,'c7462400000000'),
 'secondCounterReadAtGameTransform':(0x7a2c6,'8b157c170300'),
 'secondCounterField28':(0x7a2cc,'8b5228'),
}
DRV_W={
 'IRQ8VectorEntryJump':(0,'e9eb07'),
 'IRQ9VectorEntryJump':(3,'e9af03'),
 'IRQ23IRETEntry':(6,'cf'),
 'IRQ24Entry':(7,'b003cf'),
 'timerHandlerStarts':(0x7ee,'66505351525657551e06'),
 'saveRealModeSegment':(0x7f8,'8cc8'),
 'installLocalDataSegment':(0x7fa,'8ed8'),
 'installLocalExtraSegment':(0x7fc,'8ec0'),
 'counterFlagRead':(0x8a8,'f6063c00ff'),
 'counterFlagSkip':(0x8ad,'7551'),
 'incrementTickLow':(0x8af,'ff062400'),
 'tickLowNonzeroSkip':(0x8b3,'7504'),
 'incrementTickHighOnOverflow':(0x8b5,'ff062600'),
 'incrementSecondLow':(0x8b9,'ff062800'),
 'secondLowNonzeroSkip':(0x8bd,'7504'),
 'incrementSecondHighOnOverflow':(0x8bf,'ff062a00'),
 'serviceFlagRead':(0x8c3,'f7061600ffff'),
 'endConditionalCounterBlock':(0x900,'8b1e3600'),
 'chainStateCountdown':(0x939,'fe0eec00'),
 'chainCountdownBranch':(0x93d,'7914'),
 'chainResetCount':(0x93f,'c606ec0002'),
 'farJumpSavedIRQ8':(0x94e,'2eff2e0c00'),
 'nonChainedPICSpecificEOI':(0x953,'b060'),
 'nonChainedPICPortWrite':(0x955,'e620'),
 'nonChainedIRET':(0x961,'cf'),
}
DIRECT={0x62095:0x61e2c,0x620cd:0x6246c,0x62480:0x9ea53,0x62498:0x9ea64,
 0x624a1:0x9ea44,0x620f8:0x61f00,0x62162:0x61f38}
def validate(e,d):
 if len(e)!=861133 or hashlib.sha256(e).hexdigest()!=EXE_SHA:raise ValueError('Canonical MK2.EXE required')
 if len(d)!=0x9da or hashlib.sha256(d).hexdigest()!=DRV_SHA:raise ValueError('Canonical original RM.DRV required')
 for k,(p,h) in EXE_W.items():
  if e[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Exe witness '+k)
 for k,(p,h) in DRV_W.items():
  if d[p:p+len(bytes.fromhex(h))]!=bytes.fromhex(h):raise ValueError('Driver witness '+k)
 for p,t in DIRECT.items():
  if e[p]!=0xe8 or p+5+struct.unpack_from('<i',e,p+1)[0]!=t:raise ValueError('Direct original control flow')
 # Original loaded object-2 static file record, not a guessed resource ID.
 start=OBJ2_PHYSICAL_BASE+0x30024
 file_name_ptr,source_len,source_flags=struct.unpack_from('<III',e,start)
 if (file_name_ptr,source_len,source_flags)!=(0x74c,0x9da,9):raise ValueError('File record identity')
 if e[OBJ2_PHYSICAL_BASE+file_name_ptr:OBJ2_PHYSICAL_BASE+file_name_ptr+7]!=b'RM.DRV\0':raise ValueError('Driver filename not source-linked')
 if d[0]!=0xe9 or 3+struct.unpack_from('<h',d,1)[0]!=0x7ee:raise ValueError('Timer entry offset')
 if d[3]!=0xe9 or 6+struct.unpack_from('<h',d,4)[0]!=0x3b5:raise ValueError('Keyboard entry offset')
 if 0x8ad+2+struct.unpack_from('<b',d,0x8ae)[0]!=0x900:raise ValueError('Counter gate source jump')
 if 0x8b3+2+struct.unpack_from('<b',d,0x8b4)[0]!=0x8b9:raise ValueError('Tick overflow source jump')
 if 0x8bd+2+struct.unpack_from('<b',d,0x8be)[0]!=0x8c3:raise ValueError('Second counter overflow source jump')
 return {'resourceName':'RM.DRV','resourceLength':source_len,'resourceFileRecordObject2':'0x30024',
   'fileNameObject2':'0x74C','flagsOriginal':source_flags}

def make(e,d):
 common=validate(e,d)
 provenance={'originalExeSHA256':EXE_SHA,'originalDriverSHA256':DRV_SHA,
  'driverOriginalSize':len(d), 'sourceIsExePlusSeparateOriginalCommercialDriver':True}
 def witnesses(items):return [{'name':n,'physical':f'0x{p:05X}','bytes':v} for n,(p,v) in items.items()]
 ews=witnesses(EXE_W);dws=witnesses(DRV_W)
 return {
 'O159':{'schema':'mk2_o159_original_rm_driver_resource_file_loader_v1',**provenance,
  'resourceRecord':common, 'exeWitnesses':ews,'driverWitnesses':dws,
  'originalRel32Calls':[{'site':f'0x{p:05X}','target':f'0x{t:05X}'} for p,t in DIRECT.items()],
  'limits':{'driverFileBytesIdentityVerified':True,'originalDOSFileLoaderProven':True,'loadedDriverBytesActuallyObservedInEmulator':False}},
 'O160':{'schema':'mk2_o160_irq8_original_16bit_counter_writer_v1',**provenance,
  'driverWitnesses':dws,'handlerEntryOffset':0x7ee,'counterGateFlagOffset':0x3c,
  'tickCounterLowOffset':0x24,'tickCounterHighOffset':0x26,
  'secondCounterLowOffset':0x28,'secondCounterHighOffset':0x2a,
  'sourceFacts':['At the original real-mode IRQ8 vector entry, a 16-bit relative jump transfers to 0x7EE',
   'Conditional branch at 0x8AD skips the counter increments when the byte at 0x3C tests nonzero',
   'Word increments at 0x8AF/0x8B5 and 0x8B9/0x8BF implement two little-endian 32-bit values via overflow branches'],
  'limits':{'counterWriterOriginalBytesVerified':True,'gatedCounterUpdateSourceProven':True,'unconditionalIRQ8IncrementsProven':False,'measuredIRQFrequencyHz':False}},
 'O161':{'schema':'mk2_o161_irq8_driver_to_scheduler_counter_join_v1',**provenance,
  'exeWitnesses':ews,'driverWitnesses':dws,'join':{
   'fileRecordObject2':0x30024,'driverBytes':0x9da,'sharedBlockPointerObject2':0x3177c,
   'installedIRQ8HandlerOffset':0,'handlerJumpTarget':0x7ee,
   'conditionalSourceCounterDwordOffset':0x24,'consumerCounterDwordOffset':0x24,
   'realModeDriverWordIncrements':[0x8af,0x8b5],
   'frameControllerConsumerPhysical':0x670dd,'frameControllerClearPhysical':0x67101,
   'originalPITDivisor':0x4d9d},
  'limits':{'conditionalIRQ8ToSchedulerCounterSourceDataflowProven':True,'liveIRQ8HandlerInvokedInDOSBox':False,
   'wallClockTickFrequencyMeasured':False,'perAnimationFrameTimeMeasured':False,'gameFPSProven':False}},
 'O162':{'schema':'mk2_o162_irq8_secondary_counter_28_game_consumer_v1',**provenance,
  'exeWitnesses':ews,'driverWitnesses':dws,
  'secondCounterReadOriginalPhysical':0x7a2c6,'secondCounterFieldOffset':0x28,
  'secondCounterWriterOffsets':[0x8b9,0x8bf],
  'limits':{'sharedRealModeCounterSourceProven':True,'separateProtectedModeConsumerProven':True,
   'stageCameraClockSemanticsProven':False,'liveCounterValuesMeasured':False}},
 'O163':{'schema':'mk2_o163_irq8_original_chain_and_pic_branch_v1',**provenance,
  'driverWitnesses':dws,'chainCounterByteOffset':0xec,'chainResetValue':2,
  'branchAt':0x93d,'sourceSavedVectorFarPointerOffset':0xc,
  'nonChainEOIPort':0x20,'nonChainSpecificEOIValue':0x60,
  'limits':{'counterResetAndSourceBranchProven':True,'savedOriginalVectorChainSourceProven':True,
   'specificEOIPortOutputSourceProven':True,'actualBIOSHandlerInvocationRateMeasured':False}}
 }
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--driver',required=True);p.add_argument('--outdir',required=True);a=p.parse_args()
 dest=Path(a.outdir)
 if dest.exists():raise ValueError('Refusing overwrite')
 r=make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes());dest.mkdir(parents=True)
 for k,z in r.items():(dest/(k+'_REPORT.json')).write_text(json.dumps(z,indent=2)+'\n')
 print('PASS O159-O163 original EXE + RM.DRV source-proven counter and chain, no measured runtime frequency')
