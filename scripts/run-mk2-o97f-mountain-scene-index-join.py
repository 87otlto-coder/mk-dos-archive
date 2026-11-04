#!/usr/bin/env python3
"""O97F source-backed index-13 selection into Mountain configuration; no runtime claims."""
import hashlib, json, struct, sys
from pathlib import Path
if len(sys.argv)!=3: raise SystemExit('usage: producer mk2_fixture_folder output_json')
exe=(Path(sys.argv[1])/'mk2.exe').read_bytes();h=lambda d:hashlib.sha256(d).hexdigest()
assert h(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
u=lambda p:struct.unpack_from('<I',exe,p)[0]; w=lambda p:struct.unpack_from('<H',exe,p)[0];p=lambda o:0xa0c54+o
le=0x28f0c;ix=le+u(le+0x68);recs=le+u(le+0x6c)
rel={};count=0
for pg in range(u(le+0x14)):
 c=recs+u(ix+pg*4);e=recs+u(ix+(pg+1)*4)
 while c<e:
  kind=exe[c]&15;fl=exe[c+1];delta=struct.unpack_from('<h',exe,c+2)[0];c+=4
  obj=w(c) if fl&64 else exe[c];c+=2 if fl&64 else 1
  target=None
  if kind!=2:target=u(c) if fl&16 else w(c);c+=4 if fl&16 else 2
  if fl&4:c+=4 if fl&32 else 2
  rel[0x61c54+pg*4096+delta]=(kind,fl,obj,target);count+=1
 assert c==e
assert count==27004

def typed(at,obj,t):
 assert u(at)==t and rel.get(at)==(7,16,obj,t),(hex(at),obj,t,rel.get(at))

# All three tables are hard-wired into O96O selector at physical code offsets.
for src,obj,t in [(0x82330,2,0x15bec),(0x8233e,2,0x15c68),(0x8234c,2,0x15ce4)]:
 # For branch at 0x8233D, immediate DWORD begins 0x8233E.
 typed(src,obj,t)
assert exe[0x82321:0x8232b]==bytes.fromhex('a1805a0700a37f740700')
assert exe[0x8232b:0x8232f]==bytes.fromhex('52c1e002')
assert exe[0x82350:0x8235a]==bytes.fromhex('03c25a8b00a3805a0700')
assert exe[0x8235a:0x8235f]==bytes.fromhex('e853fbffff')
assert exe[0x82361:0x82370]==bytes.fromhex('bb05000000ba44ff0100e8b24efeff')
# The literal writer and its transfer are co-located at the known O96P predecessor.
assert exe[0x85fa4:0x85fae]==bytes.fromhex('c705805a07000d000000')
assert exe[0x85fae]==0xe8 and 0x85fae+5+struct.unpack_from('<i',exe,0x85faf)[0]==0x82321
rows=[]
for base in (0x15bec,0x15c68,0x15ce4):
 items=[]
 for i in range(31):
  src=p(base+4*i);target=u(src);items.append(target)
  if target:typed(src,2,target)
  else:assert src not in rel
 assert items[13]==0x1c2e6
 assert items.count(0x1c2e6)==1
 rows.append({'base':base,'count':31,'index13':items[13],'index13SourceObject2':base+52,'index13Physical':p(base+52),'entries':items,'tableSha256':h(exe[p(base):p(base)+124])})
# Exact embedded scene configuration at selected Object2 address, with typed child links.
config=0x1c2e6
links=[(0x1c302,2,0x77453),(0x1c306,2,0x1c31e),(0x1c312,2,0x1c330)]
for off,obj,t in links:typed(p(off),obj,t)
# Row zero of the eight-row list producer consumes the same runtime-slot address.
typed(p(0x15b74),2,0x77453)
assert exe[0x81bb6:0x81bc0]==bytes.fromhex('bb685b0100bf54430800')
assert exe[0x81bd9:0x81be0]==bytes.fromhex('8b0083f80174e0')
assert w(p(0x1c31e+4))==39 and w(p(0x1c330+4))==10
for off,items,control in [(0x1c31e,39,0x1c5dc),(0x1c330,10,0x1c716)]:
 for field,t in [(6,control),(10,0x1c344),(14,0x1c5bc)]:typed(p(off+field),2,t)
report={
 'format':'mk2_o97f_mountain_scene_selector_13_provenance_v1','status':'PASS','fixtureSha256':h(exe),'relocationCount':count,
 'selection':{'literalInputWriter':0x85fa4,'directCallAt':0x85fae,'target':0x82321,'inputGlobal':0x75a80,'inputValue':13,'selectorTableBases':[0x15bec,0x15c68,0x15ce4],'modeSelectorGlobal':0x3014c,'indexGlobal':0x7747f,'selectedPointerGlobal':0x75a80,'downstreamConfigHelper':0x81eb2,'subsequentConditionalConstructor':0x67222},
 'tables':rows,
 'configuration':{'offset':config,'runtimeSlotSource':0x1c302,'runtimeSlotAddress':0x77453,'setupPointerLinks':[{'source':s,'object':obj,'target':t} for s,obj,t in links], 'producerTableFirstRowSlotPointerAt':0x15b74,'setups':[{'offset':0x1c31e,'entries':39,'width':w(p(0x1c31e)),'height':w(p(0x1c31e+2))},{'offset':0x1c330,'entries':10,'width':w(p(0x1c330)),'height':w(p(0x1c330+2))}]},
 'machineWitnesses':[{'at':at,'hex':exe[at:at+n].hex()} for at,n in [(0x85fa4,15),(0x82321,83),(0x81bb3,51),(0x81eb2,68)]],
 'hypotheses':{'selector13AcrossAllThreeTables':'SUPPORTED','sceneIndex13YieldsMountainConfigIfCalleeReceives13':'SUPPORTED_CONDITIONALLY','fatalityLabelForIndex13':'UNPROVEN','jumpLabelForIndex13':'UNPROVEN','mountainPaletteOrSetupActiveInSpecificGameplay':'UNPROVEN','runtimeCoactivationTallArtAndPortraits':'UNPROVEN'},
 'limitations':'Direct near-call and relocated data prove the conditional selection from an exact literal 13 writer; no observed gameplay, scene label, runtime slot population, camera or final palette handle.'
}
Path(sys.argv[2]).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'pass':'O97F','tables':len(rows),'relocations':count,'index13':hex(config),'setups':[39,10],'status':'PASS'}))
