#!/usr/bin/env python3
"""O105N..O106Q: bounded native MK2 audio handoff and evidence-controlled stream tests.
No unsupported claims about event grammar, notes, timing or music driver binding.
"""
import sys,json,hashlib,pathlib,collections
exepath=pathlib.Path(sys.argv[1]);root=pathlib.Path(sys.argv[2]);out=pathlib.Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
b=exepath.read_bytes(); h=lambda v:hashlib.sha256(v).hexdigest();assert h(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
formats=[('mid',1,'scc.bin',0x8153c,0x81541),('lap',2,'lap.bin',0x8154a,0x8154f),('gvs',4,'grv.bin',0x81558,0x8155d),('sbl',8,'sbl.bin',0x81566,0x8156b),('awe',16,'awe.bin',0x81574,0x81579)]
stems=sorted(p.stem for p in (root/'sound').glob('*.mid'));assert len(stems)==33
files={(name,ext):(root/'sound'/f'{name}.{ext}').read_bytes() for name in stems for ext,*_ in formats};assert len(files)==165
passes=['O105'+c for c in 'NOPQRSTUVWXYZ']+['O106'+c for c in 'ABCDEFGHIJKLMNOPQ'];assert len(passes)==30
kinds=['DOS_LOADER_HANDOFF','INDEXED_MARKER_BOUNDARIES','SEGMENT_INTERVAL_INTEGRITY','RAW_COMMAND_CONTEXT_HYPOTHESES','CROSS_HARDWARE_STRUCTURE','NATIVE_DRIVER_SCOPE']
# All operations are intentionally per-source and lossless, not music event parsing.
def parse(name,ext):
 v=files[name,ext]; L=int.from_bytes(v[1:3],'little'); off=[int.from_bytes(v[k:k+2],'little') for k in range(L+7,len(v),2)]; assert v[0]==1 and len(v)==L+7+2*len(off)
 return v,L,off
assert b[0x814d8:0x814dd]==bytes.fromhex('e84b000000')
assert b[0x814dd:0x814e2]==bytes.fromhex('ba58370100')
assert b[0x814e4:0x814e8]==bytes.fromhex('b43dcd21')
assert b[0x814ec:0x814f1]==bytes.fromhex('b9ffff0000')
assert b[0x81505:0x81509]==bytes.fromhex('b43fcd21')
assert b[0x8150d:0x81511]==bytes.fromhex('b43ecd21')
assert b[0x81513:0x81519]==bytes.fromhex('b404b001cd80')
assert b[0x814f1:0x814fa]==bytes.fromhex('a17c1703000fb7501a')
assert b[0x814fa:0x81503]==bytes.fromhex('c1e2040fb7401803d0')
ledger={'format':'mk2_o105n_o106q_handoff_thirty_pass_v1','authenticExeSha256':h(b),'numberOfSourceFiles':165,'countOfPasses':30,'scope':'FILE_TO_MEMORY_SERVICE_HANDOFF_AND_BYTE_LEVEL_AUDIO_TESTS','noMusicEventGrammar':True,'noDriverMusicBinding':True,'noTempoTimingClaims':True,'newGraphicsPromotions':0,'reports':[]}
for j,pid in enumerate(passes):
 kind=kinds[j//5];ext,sel,drv,mov,cmp=formats[j%5];rows=[]
 for name in stems:
  v,L,off=parse(name,ext);end_markers=[]
  for p in range(3,L):
   if v[p] in (0x91,0x98):end_markers.append(p)
  if kind=='DOS_LOADER_HANDOFF':
   rows.append({'stem':name,'length':len(v),'lengthFitsDOSRead':len(v)<=0xffff,'sha256':h(v)})
  elif kind=='INDEXED_MARKER_BOUNDARIES':
   named=[{'at':x,'precedingOpcodeAt':x-1,'precedingOpcode':v[x-1],'valueAtOffset':v[x], 'identifier':v[x+1]} for x in off]
   unindexed=[{'at':p,'opcode':v[p],'nextByte':v[p+1] if p+1<L else None} for p in end_markers if p+1 not in off and p!=L-1]
   rows.append({'stem':name,'storedLength':L,'offsets':off,'indexAnchors':named,'unindexedInteriorMarkers':unindexed,'terminalMarkerAt':L-1,'terminalMarker':v[L-1]})
  elif kind=='SEGMENT_INTERVAL_INTEGRITY':
   cuts=[3]+[x-1 for x in off]+[L];spans=[{'start':a,'end':z,'sha256':h(v[a:z]),'size':z-a,'first12':v[a:min(z,a+12)].hex()} for a,z in zip(cuts,cuts[1:])]
   rows.append({'stem':name,'storedLength':L,'totalLength':len(v),'cuts':cuts,'spans':spans,'trailerSha256':h(v[L:]),'completeSha256':h(v)})
  elif kind=='RAW_COMMAND_CONTEXT_HYPOTHESES':
   records=[]
   for op in (0x90,0x99,0x91,0x98):
    pos=[x for x in range(3,L) if v[x]==op];lo2=[x for x in pos if x+2<L and v[x+1]<128 and v[x+2]<128];
    records.append({'opcode':op,'rawCount':len(pos),'nextTwoLow7Count':len(lo2),'nextTwoLow7FractionNumerator':len(lo2),'highFollowingCount':sum(x+1<L and v[x+1]>=128 for x in pos),'nextZeroCount':sum(x+1<L and v[x+1]==0 for x in pos),'positionSetSha256':h(b''.join(x.to_bytes(4,'little') for x in pos))})
   rows.append({'stem':name,'storedLength':L,'hypothesis':'Raw opcode occurrences are not event-token boundaries','rawByteContext':records})
  elif kind=='CROSS_HARDWARE_STRUCTURE':
   peers=[]
   for other,_,_,_,_ in formats:
    if other==ext:continue
    u,T,ind=parse(name,other)
    peers.append({'extension':other,'sameFullBytes':v==u,'sameStoredLength':L==T,'sameIndexCount':len(off)==len(ind),'sameTrailerMetadata':v[L+3]==u[T+3], 'sameIndexedIds':([v[x+1] for x in off]==[u[x+1] for x in ind]),'sameFirst32Body':v[3:min(L,35)]==u[3:min(T,35)]})
   rows.append({'stem':name,'metadataByte':v[L+3],'trailerMarker':v[L-1],'peerComparisons':peers,'offsetCount':len(off)})
  elif kind=='NATIVE_DRIVER_SCOPE':
   rows.append({'stem':name,'resourceSha256':h(v),'resourceLength':len(v),'driverAssociation':'FILENAME_HYPOTHESIS_NOT_RUNTIME_PROOF'})
  else:raise RuntimeError(kind)
 report={'format':'mk2_o105n_o106q_bounded_audio_pass_v1','pass':pid,'kind':kind,'extension':ext,'selector':sel,'driverCandidate':drv,'exeSha256':h(b),'rows':rows,'fileCount':len(rows),'noEventGrammar':True,'noDriverMusicBinding':True,'noTiming':True}
 if kind=='DOS_LOADER_HANDOFF':
  report['handoff']={'filenameSelectorImmediateAt':mov,'filenameSelectorCompareAt':cmp,'filenameGlobal':'0x30138','filenameConstructorCallAt':0x814d8,'filenameConstructorEntry':0x81528,'dosOpenAt':0x814e4,'readMax':0xffff,'dosReadAt':0x81505,'dosCloseAt':0x8150d,'int80RequestAt':0x81513,'int80RequestAh':4,'int80RequestAl':1,'bufferStructureGlobal':'0x3177c','bufferSegmentWordOffset':0x1a,'bufferOffsetWordOffset':0x18,'claimedServiceSemantics':'UNPROVEN'}
 if kind=='NATIVE_DRIVER_SCOPE':
  target=(root/drv).read_bytes();report['driverEvidence']={'driverSha256':h(target),'length':len(target),'first32Hex':target[:32].hex(),'sccIsGmiDuplicate':(root/'scc.bin').read_bytes()==(root/'gmi.bin').read_bytes(),'knownPcmDriverIsNotProofOfMusicBinding':True}
 path=out/f'mk2_{pid.lower()}_{kind.lower()}_{ext}_2026-10-09.json';path.write_text(json.dumps(report,indent=2)+'\n');ledger['reports'].append({'pass':pid,'kind':kind,'ext':ext,'path':'evidence/mk2_o105n_o106q/'+path.name,'sha256':h(path.read_bytes())})
(out/'mk2_o106q_audio_handoff_thirty_pass_ledger_2026-10-09.json').write_text(json.dumps(ledger,indent=2)+'\n')
print(json.dumps({'status':'PRODUCED','reports':len(ledger['reports']),'sourceFiles':len(files),'resultDir':str(out),'names':passes}))
