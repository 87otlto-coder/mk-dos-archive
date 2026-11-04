#!/usr/bin/env python3
"""Independent O133 verifier: separately reads original stage roots and command streams.
Does NOT import the O133 producer or its O130 dependency.
"""
import argparse,hashlib,json,struct
from pathlib import Path
EXE_HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ2=0xA0C54
TABLES={'mode_equals_2':0x15BEC,'mode_equals_1':0x15C68,'mode_other':0x15CE4}
STAGES=['DEDPOOL.GRA','TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PIT.GRA','PORTAL.GRA','ARENA.GRA','CAVE.GRA']
RATE=[0x842ec+4*i for i in range(9)];ACC=[0x84310+4*i for i in range(9)]
def verify(exe,report):
 def check(c,s):
  if not c:raise AssertionError('O133 independent: '+s)
 def d32(a):return struct.unpack_from('<I',exe,a)[0]
 def i32(a):return struct.unpack_from('<i',exe,a)[0]
 check(hashlib.sha256(exe).hexdigest()==EXE_HASH and report['exeSHA256']==EXE_HASH,'source identity')
 check(report['schema']=='mk2_o133_stage_motion_input_sources_v1','schema')
 check(len(report['stages'])==10 and len(report['updateChannels'])==9,'stage/channel cardinalities')
 check(exe[0x826d8:0x826e5].hex()=='b1098b15225d0700bfec420800','nine-word loop header')
 check(exe[0x826e5:0x826fa].hex()=='8b028d0480f7d8890783c20483c704fec975ed5fc3','-5 transform')
 check(exe[0x824a7:0x824c0].hex()=='578bd6b9090000008b35225d0700bfec420800f3a58bf25fc3','copy transform')
 check(exe[0x9358c:0x935a8].hex()=='8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','consumer signature')
 check(exe[0x81f4a:0x81f60].hex()=='8b1883c004891d225d07008b1883c004891df65c0700','selected setup pointer field')
 sites=[0x9343e,0x9344a,0x93456,0x93462,0x9346d,0x93479,0x93485,0x93491,0x9349c]
 for i,(site,field) in enumerate(zip(sites,report['updateChannels'])):
  check(field['index']==i and field['updatePhysical']==site,'channel ordinal')
  op=exe[site];src=d32(site+(2 if op==0x8b else 1));add=site+(6 if op==0x8b else 5)
  check(op in (0x8b,0xa1) and exe[add:add+1]==b'\x01','channel instruction')
  dst=d32(add+2)
  check((src,dst)==(RATE[i],ACC[i]),'source/dest register operands')
  check((field['rateGlobalObject2'],field['accumulatorGlobalObject2'],field['accumulatorHighWordObject2'])==(src,dst,dst+2),'channel report')
 examined=0
 for stage_idx,item in enumerate(report['stages']):
  check((item['stageIndex'],item['resourceName'])==(stage_idx,STAGES[stage_idx]),'stage family order')
  variants=[]
  for name,base in TABLES.items():
   root=d32(OBJ2+base+stage_idx*4)
   check(root>0 and OBJ2+root+28<len(exe),'root bounds')
   source=d32(OBJ2+root+0x14);stream=d32(OBJ2+root+0x18)
   check(source>0 and OBJ2+source+36<len(exe),'source table bounds')
   raw=list(struct.unpack_from('<9i',exe,OBJ2+source))
   variants.append((name,root,source,stream,raw))
  check(len({tuple(v[4]) for v in variants})==1,'stage mode input consistency')
  reported={v['mode']:v for v in item['sourceTableByMode']}
  for name,root,source,stream,raw in variants:
   check(reported[name]['rootObject2']==root and reported[name]['sourceTableObject2']==source and reported[name]['rawSigned16_16']==raw,'source root candidate')
   check(stream==item['commandStreamObject2'],'stage command stream')
  check(item['sourceWordsSigned16_16']==variants[0][4],'source coefficient bytes')
  check(item['nonzeroSourceWordCount']==sum(bool(x) for x in variants[0][4]),'nonzero count')
  p=OBJ2+variants[0][3];positive=[];minus=0
  for _ in range(32):
   command=i32(p)
   if command==0:break
   if command==-1:minus+=1;p+=16;continue
   if command==-2:p+=4;continue
   check(command>0,'unexpected command encoding')
   ptr=d32(p+4);check(ptr in [a+2 for a in ACC],'positive command accumulator highword')
   positive.append((p-OBJ2,command,ptr,[a+2 for a in ACC].index(ptr)));p+=8
  else:check(False,'unterminated source command')
  stated=[(x['commandObject2'],x['objectPointerGlobalObject2'],x['accumulatorHighWordGlobalObject2'],x['channelIndex']) for x in item['positiveLayerCommands']]
  check(positive==stated and minus==item['minusOnePackedDrawCommands'],'source command membership')
  examined+=len(positive)+9*3
 limits=report['limits']
 for key in ['liveRoutineSelectionKnown','runtimeUpdateFrequencyKnown','liveAccumulatorValuesKnown','cameraParallaxMultiplierProven','loopOrFrameTimingRecovered','fullSceneExportCropped']:
  check(limits[key] is False,'unsupported motion claim '+key)
 check(limits['stageArtworkStillExportedInNativeDimensions'] is True,'native artwork invariant')
 return {'status':'PASS_O133_INDEPENDENT','stageConfigurations':10,'modeRootsChecked':30,'channelsChecked':9,'stagePositiveCommandsChecked':examined-270,'rawSourceWordsChecked':270,'assertionGroups':examined+27}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True,type=Path);p.add_argument('--report',required=True,type=Path);a=p.parse_args()
 print(json.dumps(verify(a.exe.read_bytes(),json.loads(a.report.read_text())),indent=2))
