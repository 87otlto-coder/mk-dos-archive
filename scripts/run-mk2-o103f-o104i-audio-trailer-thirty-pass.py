#!/usr/bin/env python3
"""O103F--O104I: original DOS music structural boundaries; never claims event timing/notes."""
import sys,json,hashlib,struct,collections
from pathlib import Path
exe_path,root_dir,out_dir=sys.argv[1:4]
exe=Path(exe_path).read_bytes();root=Path(root_dir)/'sound';out=Path(out_dir);out.mkdir(parents=True,exist_ok=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
exts=['mid','awe','gvs','lap','sbl'];stems=sorted(p.stem for p in root.glob('*.mid')); assert len(stems)==33
files={}
for s in stems:
 for ext in exts:
  name=f'{s}.{ext}';p=root/name;b=p.read_bytes();L=int.from_bytes(b[1:3],'little');n=b[L+4]-1
  assert b[0]==1 and b[L-1] in (0x91,0x98) and int.from_bytes(b[L:L+2],'little')==L+2
  assert b[L+2]==0x60 and b[L+5:L+7]==bytes([3,0]) and len(b)==L+7+2*n
  off=[int.from_bytes(b[k:k+2],'little') for k in range(L+7,len(b),2)]
  assert len(off)==n and off==sorted(off) and len(set(off))==n
  assert all(3<=i<L-1 and b[i-1] in [0x91,0x98] and b[i]==0 and 0x80<=b[i+1]<=0x89 for i in off)
  files[name]=(b,L,off)
assert len(files)==165
ids=[]
for s in stems:
 for ext in exts:
  b,L,off=files[f'{s}.{ext}'];ids += [b[i+1] for i in off]
assert len(ids)==931
idsum=lambda a:dict(sorted(collections.Counter(a).items()))
def detail(name,kind):
 b,L,offs=files[name];n=len(offs);stem,ext=name.rsplit('.',1)
 if kind=='header': return {'name':name,'byteLength':len(b),'sha256':sha(b),'firstByte':b[0],'headerWord':int.from_bytes(b[1:3],'little'),'headerFourthByte':b[3],'dataStart':3,'metadataStart':L,'bodySha256':sha(b[3:L])}
 if kind=='footer':return {'name':name,'metadataStart':L,'footerWord':int.from_bytes(b[L:L+2],'little'),'markerByte':b[L+2],'sharedParameterByte':b[L+3],'countByte':b[L+4],'constantWord':int.from_bytes(b[L+5:L+7],'little'),'offsetCount':n,'metadataSha256':sha(b[L:]),'tailByteCount':len(b)-L}
 if kind=='offsets':return {'name':name,'offsetCount':n,'offsets':[{'offset':i,'markerBefore':b[i-1],'zeroAt':b[i],'identifierAfter':b[i+1]} for i in offs],'identifiersDistinct':len({b[i+1] for i in offs})==n,'allSorted':True,'allWithinData':True}
 if kind=='segments':
  # Full, lossless physical partition: fixed 3-byte header, optional common prefix,
  # N marked chunks, trailer from L. Segmentation is structural, not event grammar.
  edges=[0,3]+([offs[0]-1] if offs else [])+[i-1 for i in offs[1:]]+[L]
  # for no offsets, edges [0,3,L]; when offsets edges [0,3,first-1,...,L]
  ranges=[{'start':a,'end':z,'bytes':z-a,'sha256':sha(b[a:z])} for a,z in zip(edges,edges[1:])]
  ranges.append({'start':L,'end':len(b),'bytes':len(b)-L,'sha256':sha(b[L:])})
  assert b''.join(b[r['start']:r['end']] for r in ranges)==b
  return {'name':name,'parts':ranges,'partCount':len(ranges),'wholeSha256':sha(b),'bodyCoveredExactly':True,'lossless':True}
 if kind=='variation':
  mates=[files[f'{stem}.{v}'] for v in exts]
  return {'name':name,'stem':stem,'extension':ext,'sameParameterAllFive':len({z[0][z[1]+3] for z in mates})==1,'familyParameterByte':b[L+3],'peerLengths':{e:len(files[f'{stem}.{e}'][0]) for e in exts},'peerOffsetCounts':{e:len(files[f'{stem}.{e}'][2]) for e in exts},'peerWholeHashes':{e:sha(files[f'{stem}.{e}'][0]) for e in exts}}
 raise ValueError(kind)
def cross(kind):
 if kind=='family':return {'families':[{'stem':s,'parameterBytes':[files[f'{s}.{e}'][0][files[f'{s}.{e}'][1]+3] for e in exts],'offsetCounts':[len(files[f'{s}.{e}'][2]) for e in exts]} for s in stems],'constantFamilies':sum(len({files[f'{s}.{e}'][0][files[f'{s}.{e}'][1]+3] for e in exts})==1 for s in stems),'parameterValueHistogram':idsum(files[f'{s}.mid'][0][files[f'{s}.mid'][1]+3] for s in stems)}
 if kind=='duplicates':
  dup=[]
  for name,(b,L,offs) in sorted(files.items()):
   ident=[b[i+1] for i in offs]
   if len(set(ident))<len(ident):dup.append({'name':name,'identifiers':ident,'offsets':offs})
  return {'duplicateIdentifierFiles':dup,'count':len(dup),'neverClaimAllUnique':True}
 if kind=='census':
  a=[i for b,L,offs in files.values() for i in offs]
  return {'fileCount':len(files),'familyCount':len(stems),'totalOffsets':len(a),'prevMarkerCounts':idsum(b[i-1] for b,L,offs in files.values() for i in offs),'identifierCounts':idsum(b[i+1] for b,L,offs in files.values() for i in offs),'offsetCountHistogram':idsum(len(offs) for b,L,offs in files.values()),'endMarkerCounts':idsum(b[L-1] for b,L,offs in files.values()),'allOffsetsInternal':all(3<=i<L-1 for b,L,offs in files.values() for i in offs)}
 if kind=='empties':return {'files':[{'name':n,'length':len(b),'metadataStart':L,'offsetCount':len(o),'footer':b[L:].hex()} for n,(b,L,o) in sorted(files.items()) if not o], 'count':sum(not o for b,L,o in files.values())}
 if kind=='closure':return {'files':165,'familyCount':33,'extensions':exts,'totalOffsetCount':931,'trailerLengthFormula':'fileSize=headerWord+7+2*offsetCount','sourceExeSha256':sha(exe),'indexedGraphicsExactFullUnaffected':110,'musicEventGrammarUnproven':True,'playbackTempoUnproven':True,'runtimeConsumerUnproven':True,'newGraphicsPromotions':0}
 raise ValueError(kind)
ids_pass=['O103'+c for c in 'FGHIJKLMNOPQRSTUVWXYZ']+['O104'+c for c in 'ABCDEFGHI']
assert len(ids_pass)==30
kinds=['header','footer','offsets','segments','variation']
for index,pid in enumerate(ids_pass):
 if index<25:
  ext=exts[index//5];kind=kinds[index%5]
  topic=f'audio-{ext}-{kind}-native-boundaries'
  ev={'extension':ext,'kind':kind,'files':[detail(f'{s}.{ext}',kind) for s in stems],'fileCount':33}
 else:
  kind=['family','duplicates','census','empties','closure'][index-25]
  topic=f'audio-cross-format-{kind}'
  ev=cross(kind)
 report={'format':'mk2_o103f_o104i_native_music_structure_v1','passId':pid,'topic':topic,'exeSha256':sha(exe),'classification':'EXACT_BYTE_STRUCTURAL_AUDIO_NOT_PLAYBACK','hypotheses':{'decodedMusicalEvents':False,'knownTimingUnits':False,'correctAudioPlayback':False,'newExactFullGraphics':False},'evidence':ev}
 target=out/f'mk2_{pid.lower()}_{topic}_2026-10-09.json';target.write_text(json.dumps(report,indent=2)+'\n')
 print(pid,topic,target.stat().st_size)
