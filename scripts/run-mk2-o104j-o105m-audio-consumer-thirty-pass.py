#!/usr/bin/env python3
"""O104J..O105M - source-native candidate audio grammar and loader evidence (no playback claims)."""
import sys, json, hashlib, collections, pathlib
exe=pathlib.Path(sys.argv[1]).read_bytes(); sound=pathlib.Path(sys.argv[2])/'sound'; out=pathlib.Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
assert sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
formats=[('mid',1,'gmi.bin'),('lap',2,'lap.bin'),('gvs',4,'grv.bin'),('sbl',8,'sbl.bin'),('awe',16,'awe.bin')]
stems=sorted(p.stem for p in sound.glob('*.mid')); assert len(stems)==33
bufs={(s,e):(sound/f'{s}.{e}').read_bytes() for s in stems for e,_,_ in formats}
assert len(bufs)==165

# Six categories, each with five independent resource-family hypotheses.
topics=['loader_suffix_branch','marker_to_offset_correlation','cross_hardware_binary_identity','candidate_command_arity','offset_partition_profiles','hardware_driver_inventory']
passes=['O104'+c for c in 'JKLMNOPQRSTUVWXYZ']+['O105'+c for c in 'ABCDEFGHIJKLM'];assert len(passes)==30

def fmeta(stem,ext):
 b=bufs[stem,ext];L=int.from_bytes(b[1:3],'little');off=[int.from_bytes(b[k:k+2],'little') for k in range(L+7,len(b),2)];return b,L,off

cases=[(0x8153c,0x81541,0x81548,1,b'.MID'),(0x8154a,0x8154f,0x81556,2,b'.LAP'),(0x81558,0x8155d,0x81564,4,b'.GVS'),(0x81566,0x8156b,0x81572,8,b'.SBL'),(0x81574,0x81579,0x81580,16,b'.AWE')]
ledger={'format':'mk2_o104j_o105m_audio_consumer_controlled_hypotheses_v1','classification':'EXECUTABLE_SUFFIX_DISPATCH_AND_SOURCE_BYTES_NOT_EVENT_DECODER','authenticExeSha256':sha(exe),'passes':[],'verifiedFileCount':165,'newGraphicsPromotions':0,'knownIndexedResources':110,'declinedPlaybackClaims':True}
for j,passid in enumerate(passes):
 kind=topics[j//5]; ext,selector,driver=formats[j%5];files=[]
 for stem in stems:
  b,L,offs=fmeta(stem,ext);body=b[3:L];setoff=set(offs)
  if kind=='marker_to_offset_correlation':
   markers=[]
   for k in range(3,L):
    if b[k] in (0x91,0x98):markers.append({'at':k,'hex':b[k],'referenced':k+1 in setoff,'zeroAfter':(k+1<L and b[k+1]==0),'idAfter':(b[k+2] if k+2<L else None),'nextBytes':b[k:min(L,k+4)].hex()})
   files.append({'stem':stem,'offsetCount':len(offs),'terminatorMarker':b[L-1],'markers':markers,'otherMarkers':[m for m in markers if not m['referenced']]})
  elif kind=='cross_hardware_binary_identity':
   peers=[x for x,_,_ in formats if x!=ext];files.append({'stem':stem,'sha256':sha(b),'length':len(b),'samePayloadAs':sorted(p for p in peers if b==bufs[stem,p]),'sameIntro32As':sorted(p for p in peers if b[3:min(L,35)]==bufs[stem,p][3:min(fmeta(stem,p)[1],35)])})
  elif kind=='candidate_command_arity':
   stats=[]
   for op in (0x90,0x99,0x91,0x98):
    indices=[k for k in range(3,L) if b[k]==op];two=[k for k in indices if k+2<L and b[k+1]<128 and b[k+2]<128];stats.append({'opcode':op,'occurrences':len(indices),'twoFollowingLow7':len(two),'nonLow7Positions':[k for k in indices if k not in set(two)][:15]})
   files.append({'stem':stem,'bytes':len(body),'highBitByteCount':sum(v>=128 for v in body),'opcodeStats':stats})
  elif kind=='offset_partition_profiles':
   bounds=[3]+[p-1 for p in offs]+[L];spans=[]
   for a,z in zip(bounds,bounds[1:]):
    piece=b[a:z];spans.append({'start':a,'end':z,'size':len(piece),'sha256':sha(piece),'byte90':piece.count(0x90),'byte99':piece.count(0x99),'byte91':piece.count(0x91),'byte98':piece.count(0x98)})
   files.append({'stem':stem,'bodySha256':sha(body),'bounds':bounds,'spans':spans,'endsBeforeTrailerMarker':b[L-1] in (0x91,0x98)})
  elif kind=='loader_suffix_branch':
   files.append({'stem':stem,'len':len(b),'hash':sha(b),'baseNameLength':len(stem),'selectedExtension':ext,'headerByte':b[0]})
  elif kind=='hardware_driver_inventory':
   bdrv=(pathlib.Path(sys.argv[2])/driver).read_bytes()
   files.append({'stem':stem,'variantSha256':sha(b),'driverNameCandidateOnly':driver,'driverSha256':sha(bdrv),'driverByteLength':len(bdrv),'driverPrefix16':bdrv[:16].hex()})
  else:raise RuntimeError(kind)
 result={'format':'mk2_o104j_o105m_audio_consumer_report_v1','passId':passid,'topic':kind,'extension':ext,'selectorValue':selector,'fileCount':len(files),'exeSha256':sha(exe),'files':files,'noEventGrammarClaim':True,'noRuntimeDriverBindingClaim':True,'noTimingClaim':True}
 if kind=='loader_suffix_branch':
  move,compare,branch,value,suffix=cases[j%5];result['loaderCase']={'movImmediateOffset':move,'compareOffset':compare,'branchOffset':branch,'suffixHex':suffix.hex(),'selectorGlobal':'0x30138','earlyReturnAt':'0x81582','filenameBuffer':'0x1375e','sourceTableRuntimeAddress':'0x1438c'}
 if kind=='hardware_driver_inventory':result['driverBindingClassification']='HYPOTHESIS_FROM_FILENAME_ONLY'
 name=f'mk2_{passid.lower()}_audio_{kind}_{ext}_2026-10-09.json';(out/name).write_text(json.dumps(result,indent=2)+'\n');ledger['passes'].append({'passId':passid,'topic':kind,'extension':ext,'report':str('evidence/mk2_o104j_o105m/'+name),'sha256':sha((out/name).read_bytes())})
(out/'mk2_o105m_audio_consumer_30pass_ledger_2026-10-09.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'status':'PRODUCER_COMPLETE','passes':len(passes),'files':len(bufs),'reportDir':str(out),'manifest':ledger['passes'][-1]['report']}))
