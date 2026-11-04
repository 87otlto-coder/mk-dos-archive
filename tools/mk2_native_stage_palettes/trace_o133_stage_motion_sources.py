#!/usr/bin/env python3
"""O133: authenticated stage-scoped nine-word movement inputs and draw channels.

Original EXE only. Values are 16.16-formatted source numbers, NOT observed
parallax factors, velocities per frame, animation timings, or playback tracks.
"""
from __future__ import annotations
import argparse,hashlib,json,struct
from pathlib import Path
from trace_o130_dynamic_stage_streams import produce as previous,OBJ1,OBJ2,fixups

BASE_VELOCITY=0x842ec
RATE_GLOBAL=0x75d22
DEST_ACCUM=[0x84310+4*i for i in range(9)]
COEFF_BASE=0x14
TOKENS=(1,2,3,4,5,6,7,8)

def need(c,msg):
 if not c:raise ValueError('O133: '+msg)
def u32(b,at):return struct.unpack_from('<I',b,at)[0]
def i32(b,at):return struct.unpack_from('<i',b,at)[0]
def typed(fx,obj,src,target_obj,target):
 r=fx.get((obj,src));need(r is not None and (r['kind'],r['flags'],r['targetObject'],r['targetOffset'])==(7,16,target_obj,target),'relocation '+hex(src))

def produce(exe:bytes):
 prior=previous(exe);fx=fixups(exe)
 # Nine-word stage table is passed into the updater via an authenticated root
 # field. The utility below reads it but does not infer live callback choice.
 need(exe[0x826d8:0x826e5].hex()=='b1098b15225d0700bfec420800','nine-input updater base')
 need(exe[0x826e5:0x826fa].hex()=='8b028d0480f7d8890783c20483c704fec975ed5fc3','negative-times-five transform')
 need(exe[0x824a7:0x824bf+1].hex()=='578bd6b9090000008b35225d0700bfec420800f3a58bf25fc3','direct copy transform')
 need(exe[0x9358c:0x935a8].hex()=='8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','high-half position read')
 # Nine successive MOV from BSS rate + ADD to BSS accumulator pairs.
 arithmetic=[]
 sites=[0x9343e,0x9344a,0x93456,0x93462,0x9346d,0x93479,0x93485,0x93491,0x9349c]
 for i,at in enumerate(sites):
  # MOV r32, [imm32] uses 6 bytes except EAX uses five; ADD [imm32],r32 uses 6.
  read_op=exe[at];need(read_op==0x8b or read_op==0xa1,'rate read form')
  if read_op==0x8b:
   need(exe[at+1] in (0x1d,0x0d,0x15),'known register read');src=u32(exe,at+2);add_at=at+6
  else:src=u32(exe,at+1);add_at=at+5
  need(exe[add_at]==1 and exe[add_at+1] in (0x05,0x0d,0x15,0x1d),'ADD register form')
  dst=u32(exe,add_at+2)
  need(src==BASE_VELOCITY+4*i and dst==DEST_ACCUM[i],'nine source/destination positions')
  for imm,offset in [(at+2 if read_op==0x8b else at+1,src),(add_at+2,dst)]:typed(fx,1,imm-OBJ1,2,offset)
  arithmetic.append({'index':i,'updatePhysical':at,'rateGlobalObject2':src,'accumulatorGlobalObject2':dst,
                     'accumulatorHighWordObject2':dst+2})
 # Loader reads selected configuration field at +0x14 and stores the pointer.
 need(exe[0x81f4a:0x81f60].hex()=='8b1883c004891d225d07008b1883c004891df65c0700','root input then stream loading')
 # The interpreter pulls the high half of a stage-indexed accumulator, not a
 # proved frame number or world coordinate.
 source={};stage_rows=[]
 for summary in prior['firstTenConfigurationSummary']:
  idx=summary['configurationIndex'];name=summary['resourceName'];variants=[]
  for mode,roots in prior['rootTables'].items():
   root=roots[idx]['rootObject2'];need(root is not None,'stage root absent')
   coeff_ptr=u32(exe,OBJ2+root+COEFF_BASE)
   typed(fx,2,root+COEFF_BASE,2,coeff_ptr)
   need(OBJ2+coeff_ptr+36<=len(exe),'nine-word source bounds')
   coeff=list(struct.unpack_from('<9i',exe,OBJ2+coeff_ptr))
   variants.append({'mode':mode,'rootObject2':root,'sourceTableObject2':coeff_ptr,'rawSigned16_16':coeff})
  need(len({tuple(v['rawSigned16_16']) for v in variants})==1,'mode-dependent source words differ')
  stream=next(s for s in prior['streams'] if s['object2Offset']==summary['streamObject2'])
  used=[]
  for op in stream['operations']:
   if op['opcode']!='positive_pair':continue
   p=op['payloadPointerObject2'];need(p in {x['accumulatorHighWordObject2'] for x in arithmetic},'positive command points outside nine channel high halves')
   index=next(x['index'] for x in arithmetic if x['accumulatorHighWordObject2']==p)
   used.append({'commandObject2':op['object2Offset'],'objectPointerGlobalObject2':op['tokenPointerObject2'],
                'accumulatorHighWordGlobalObject2':p,'channelIndex':index})
  original=variants[0]['rawSigned16_16']
  stage_rows.append({'stageIndex':idx,'resourceName':name,'commandStreamObject2':summary['streamObject2'],
                     'sourceTableByMode':variants,'sourceWordsSigned16_16':original,
                     'sourceRatiosExact':[f'{v}/65536' for v in original],
                     'nonzeroSourceWordCount':sum(bool(v) for v in original),
                     'positiveLayerCommands':used,'minusOnePackedDrawCommands':summary['drawCount']})
 # Optional illustrative math: a direct copy of nine input words is statically
 # present, as is a -5 transform. No runtime selector measured.
 return {'schema':'mk2_o133_stage_motion_input_sources_v1','status':'PASS_STATIC_CHANNEL_SOURCE_GRAPH',
         'exeSHA256':hashlib.sha256(exe).hexdigest(),'code':{
           'selectedRootFieldRelative':COEFF_BASE,'loaderPhysical':0x81f4a,'selectedSourcePointerGlobal':RATE_GLOBAL,
           'directCopyRoutinePhysical':0x824a7,'negTimesFiveRoutinePhysical':0x826d7,
           'channelUpdatePhysicalStart':0x9343e,'positiveHighWordConsumerPhysical':0x9358c,
           'nineChannelStateRateBase':BASE_VELOCITY},'updateChannels':arithmetic,
         'stages':stage_rows,'limits':{'rawSourceWordsAuthenticated':True,'layerChannelUsePresentInStageStreams':True,
             'liveRoutineSelectionKnown':False,'runtimeUpdateFrequencyKnown':False,
             'liveAccumulatorValuesKnown':False,'cameraParallaxMultiplierProven':False,
             'loopOrFrameTimingRecovered':False,'fullSceneExportCropped':False,
             'stageArtworkStillExportedInNativeDimensions':True},
         'notes':['Source words are formatted as signed 16.16 integers; their interpretation as per-layer parallax speed is not yet established.',
                  'The executable implements multiple possible transforms of these words; do not assume -5 or the direct copy path was used.',
                  'Positive commands associate object-pointer state with accumulated channel high words, but do not prove animation-frame membership.',
                  'Independent sprite/floor planes from O132 must remain uncropped and unflattened.']}

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args()
 need(not a.out.exists(),'output already exists')
 a.out.write_text(json.dumps(produce(a.exe.read_bytes()),indent=2)+'\n')
