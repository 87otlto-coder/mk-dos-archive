#!/usr/bin/env python3
"""O166-O168: bounded original MK2 two-file static source research. Never executes game binaries."""
import argparse,hashlib,json,struct
from pathlib import Path
EH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
DH='87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546'
DRIVER_166={
 'irq9KeyInputPort':(0x3c3,'e460'), 'maskBreakBit':(0x3d9,'83e37f'),
 'keyReleasedWrite':(0x3dc,'c687500080'),'keyPressedWrite':(0x3e5,'c687500040'),
 'escapeStateTest':(0x80e,'f6065100ff'),'escapeSkipZero':(0x813,'7407'),
 'escapeSkipReleased':(0x815,'7805'),'escapeSetFlag':(0x817,'c6063a00ff'),
 'altStateTest':(0x81c,'f6068800ff'), 'altZeroSkip':(0x821,'0f848300'),
 'altReleaseSkip':(0x825,'0f887f00'),
 'qStateTest':(0x829,'f6066000ff'),'qSkipZero':(0x82e,'7407'),
 'qSkipReleased':(0x830,'7805'),'qSetFlag':(0x832,'c6063b00ff'),
 'pStateTest':(0x837,'f6066900ff'),'pNotPressed':(0x83c,'741c'),
 'pReleased':(0x83e,'781a'),'pPhaseAdvance':(0x840,'ff06e400'),
 'pToggleOnWrap':(0x846,'80363c00ff'),'pPhaseReset':(0x85a,'c706e400ffff'),
 'mStateTest':(0x860,'f6068200ff'),'mPhaseAdvance':(0x869,'ff06e600'),
 'mToggle':(0x86f,'8036ea00ff'),'mPhaseReset':(0x886,'c706e600ffff'),
 'sStateTest':(0x88c,'f6066f00ff'),'sPhaseAdvance':(0x895,'ff06e800'),
 'sToggle':(0x89b,'8036eb00ff'),'sPhaseReset':(0x8a2,'c706e800ffff'),
 'timerStatusGate':(0x8a8,'f6063c00ff')}
EXE_166={
 'mainLoopQFlagRead':(0x66eef,'f6403bff'), 'mainLoopQExitBranch':(0x66ef3,'0f8425ffffff'),
 'mainLoopExitShutdown':(0x66ef9,'e8c9e3ffff'),
 'mainLoopPauseFlagRead':(0x66ee3,'f6403cff'),
 'gameEscapeReadA':(0x70a47,'f6403aff'),'gameEscapeReadB':(0x74e6c,'f6403aff'),
 'mainLoopKeyboardPassthroughMode':(0x66ecb,'f6403dff')}
DRIVER_167={
 'initialChainCounter':(0xec,'02'),'driverTimerEntry':(0,'e9eb07'),
 'incrementSchedulerCounterLo':(0x8af,'ff062400'),
 'incrementSchedulerCounterHiOnWrap':(0x8b5,'ff062600'),
 'incrementAnotherCounterLo':(0x8b9,'ff062800'),
 'interruptChainCountdown':(0x939,'fe0eec00'),
 'conditionalChainOnNegative':(0x93d,'7914'),
 'resetChainCountdown':(0x93f,'c606ec0002'),
 'jumpToSavedIRQ0':(0x94e,'2eff2e0c00'),
 'nonChainEOIPortValue':(0x953,'b060'),
 'sendSpecificEOI':(0x955,'e620'),'nonChainIret':(0x961,'cf')}
EXE_167={
 'pitMode':(0x66f5a,'b036'), 'pitControlPort':(0x66f5c,'e643'),
 'pitDivisor':(0x66f60,'66b89d4d'),
 'pitDivisorLo':(0x66f64,'e640'),
 'pitDivisorHi':(0x66f6a,'e640')}
EXE_168={
 'frameControllerEntry':(0x67050,'8335d462050001'),
 'waitForSchedulerField':(0x670dd,'8b357c170300'),
 'readCounterDword':(0x670e3,'8b4624'),
 'waitCounterIsZero':(0x670e6,'85c0'),
 'waitLoopBack':(0x670e8,'74f3'),
 'recordCounterSample':(0x670ea,'a30c5b0300'),
 'doubleCounterSample':(0x670ef,'d1e0'),
 'readPreviousSmoother':(0x670f1,'8b1d105b0300'),
 'sumForSmoother':(0x670f7,'03d8'),
 'halveForSmoother':(0x670f9,'d1eb'),
 'storeSmoother':(0x670fb,'891d105b0300'),
 'zeroCounterDword':(0x67101,'c7462400000000'),
 'startTaskList':(0x67108,'be045b0300'),
 'taskAdvanceNext':(0x67152,'8b36'),
 'taskDecrementOnlyOnce':(0x67158,'66ff4e06'),
 'taskContinueIfPositive':(0x6715c,'7ff4'),
 'taskRestoreRenderObject':(0x67182,'8b7e18'),
 'resumeTaskContinuation':(0x67185,'ff661c'),
 'taskYieldStoreCounter':(0x67110,'66894606')}

def anchored(original, witnesses):
 for label,(off,h) in witnesses.items():
  needle=bytes.fromhex(h)
  if original[off:off+len(needle)]!=needle:raise ValueError('Original source mismatch '+label)

def short(b,o):return o+2+struct.unpack_from('<b',b,o+1)[0]
def near16(b,o):return o+4+struct.unpack_from('<h',b,o+2)[0]
def near32(b,o):return o+6+struct.unpack_from('<i',b,o+2)[0]
def witnesses(w):return [{'label':k,'physicalOffset':f'0x{o:X}','originalBytes':h} for k,(o,h) in w.items()]

def make(exe,driver):
 if len(exe)!=861133 or hashlib.sha256(exe).hexdigest()!=EH:raise ValueError('Original canonical MK2.EXE required')
 if len(driver)!=2522 or hashlib.sha256(driver).hexdigest()!=DH:raise ValueError('Original canonical RM.DRV required')
 for b,w in [(driver,DRIVER_166),(exe,EXE_166),(driver,DRIVER_167),(exe,EXE_167),(exe,EXE_168)]:anchored(b,w)
 for pos,target in [(0x813,0x81c),(0x815,0x81c),(0x82e,0x837),(0x830,0x837),(0x83c,0x85a),(0x83e,0x85a),(0x93d,0x953),(0x670e8,0x670dd),(0x6715c,0x67152)]:
  b=exe if pos>0xffff else driver
  if short(b,pos)!=target:raise ValueError('Original branch destination mismatch '+hex(pos))
 for pos,target in [(0x821,0x8a8),(0x825,0x8a8)]:
  if near16(driver,pos)!=target:raise ValueError('ALT gated branch destination')
 if near32(exe,0x66ef3)!=0x66e1e:raise ValueError('No main-loop Q quit edge')
 if (driver[0xec],struct.unpack_from('<H',driver,0xe4)[0],struct.unpack_from('<H',driver,0xe6)[0],struct.unpack_from('<H',driver,0xe8)[0])!=(2,65535,65535,65535):raise ValueError('driver default reset values')
 common={'originalExeSHA256':EH,'originalDriverSHA256':DH,'verificationScope':'static canonical source bytes only'}
 r166={'schema':'mk2_o166_irq8_hotkey_matrix_and_protected_flag_consumers_v1',**common,
  'driverWitnesses':witnesses(DRIVER_166),'exeWitnesses':witnesses(EXE_166),
  'keyStates':{'base':0x50,'makeMarker':0x40,'breakMarker':0x80,'breakMask':0x7f},
  'verifiedScanCodeToSourceField':[
   {'scanCode':1,'driverKeySlot':0x51,'writtenFlag':0x3a,'requiresAltTablePositive':False,'effect':'sets flag read at MK2.EXE 0x70A47 and 0x74E6C'},
   {'scanCode':0x10,'driverKeySlot':0x60,'writtenFlag':0x3b,'requiresAltTablePositive':True,'effect':'sets flag read by main-loop exit condition at 0x66EEF'},
   {'scanCode':0x19,'driverKeySlot':0x69,'writtenFlag':0x3c,'requiresAltTablePositive':True,'effect':'toggles flag only on phase-word wrap, read in main-loop spin and IRQ8 counter gate'},
   {'scanCode':0x32,'driverKeySlot':0x82,'writtenFlag':0xea,'requiresAltTablePositive':True,'effect':'conditional phase-wrap toggle and handler callback with AX=0x0800/0x08FF'},
   {'scanCode':0x1f,'driverKeySlot':0x6f,'writtenFlag':0xeb,'requiresAltTablePositive':True,'effect':'conditional phase-wrap toggle; downstream gameplay meaning unverified'}],
  'altScanCode':0x38,'altKeySlot':0x88,
  'limits':{'keyLabelsRequireConventionalSet1Assumption':True,'altQSourceLevelLoopExitBranch':True,
   'escapeConditionalReadSourceVerified':True,'runtimeKeyBehaviorObserved':False,
   'altMAndAltSGameplayMeaningKnown':False,'noGuaranteedFrameRate':True}}
 r167={'schema':'mk2_o167_irq0_chain_counter_and_pit_divisor_static_v1',**common,
  'driverWitnesses':witnesses(DRIVER_167),'exeWitnesses':witnesses(EXE_167),
  'sourceIRQ8EntryOffset':0x7ee,'sourceInitialDriverChainCounter':2,
  'chainLogic':{'counterField':0xec,'decrementPhysical':0x939,
    'ifNegativeRestoreCounter':2,'savedOldIRQFarPointerOffset':0x0c,
    'otherwiseEOIValue':0x60,'otherwiseEOIPort':0x20,
    'conditionalEntryCycle':3},
  'pitSetup':{'modeControl':0x36,'divisor':0x4d9d,'decimalDivisor':19869,'dataPort':0x40},
  'nominalClockModel':{'inputHzAssumption':1193182,'nominalIRQ0Hz':1193182/19869,
    'nominalPriorHandlerChainHz':1193182/19869/3,
    'note':'computed conditional predictions only, assuming classic PIT input and handler uninterrupted every programmed cycle'},
  'limits':{'sourceChainEveryThirdHandlerEntryUnderNormalCounterState':True,
   'actualInterruptsPerSecondMeasured':False,'gameFramesPerSecondMeasured':False,
   'actualBIOSChainingHzObserved':False}}
 r168={'schema':'mk2_o168_sampled_irq_ticks_are_not_task_countdown_units_v1',**common,
  'exeWitnesses':witnesses(EXE_168),
  'scheduler':{'blockPointerGlobal':0x3177c,'counterField':0x24,
   'sampledValueGlobal':0x35b0c,'smoothedValueGlobal':0x35b10,
   'zeroCounterOffset':0x67101,'taskCountdownField':6,'taskCountdownWidthBits':16,
   'taskCountdownDecrementsPerVisitedTask':1,
   'samplesToTaskDecrementDirectMultiplier':False},
  'modelExamples':[
   {'counterSample':1,'taskCounterBefore':6,'taskCounterAfterOneTraversal':5},
   {'counterSample':3,'taskCounterBefore':6,'taskCounterAfterOneTraversal':5},
   {'counterSample':5,'taskCounterBefore':1,'taskCounterAfterOneTraversal':0}],
  'limits':{'counterCanCarryMoreThanOneIncrementBetweenSchedulerObservations':True,
   'zeroCounterAfterSample':True,'notOneTaskDecrementPerIRQWhenTicksAccumulate':True,
   'schedulerFrequencyMeasured':False,'animationFrameRateMeasured':False}}
 return {'O166':r166,'O167':r167,'O168':r168}

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--driver',required=True);ap.add_argument('--outdir',required=True)
 a=ap.parse_args();out=Path(a.outdir)
 if out.exists():raise ValueError('Refusing overwrite')
 reports=make(Path(a.exe).read_bytes(),Path(a.driver).read_bytes());out.mkdir(parents=True)
 for k,v in reports.items():(out/(k+'_REPORT.json')).write_text(json.dumps(v,indent=2)+'\n')
 print('PASS O166-O168 created from original independent commercial inputs; no measured FPS')
