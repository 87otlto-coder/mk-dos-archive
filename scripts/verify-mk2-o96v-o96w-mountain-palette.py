#!/usr/bin/env python3
"""Independent O96V/O96W relocation, palette-grammar and bounded allocator verification."""
import sys, json, struct, hashlib
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verifier.py <mk2-dir> <O96V-report> <O96W-report>')
fixture=Path(sys.argv[1]);b=(fixture/'mk2.exe').read_bytes();gra=(fixture/'mountain.gra').read_bytes();r=json.loads(Path(sys.argv[2]).read_bytes());s=json.loads(Path(sys.argv[3]).read_bytes());root=Path(__file__).resolve().parent.parent
H=lambda x:hashlib.sha256(x).hexdigest()
checks=0
def ck(cond,what):
 global checks
 checks+=1
 if not cond:raise AssertionError('O96V/O96W '+what)
def u(p):return struct.unpack_from('<I',b,p)[0]
def h(p):return struct.unpack_from('<H',b,p)[0]
def signed(p):return struct.unpack_from('<h',b,p)[0]
exe_hash='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck(H(b)==exe_hash==r['fixtureSha256']==s['fixtureSha256'],'fixture hash')
ck(H(gra)=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6','Mountain fixture hash')
parentBytes=(root/'mk2_mountain_selected_indexed_graphics_o96t_2026-10-09.json').read_bytes()
ck(H(parentBytes)==r['o96tSha256'] and json.loads(parentBytes)['status']=='SUCCESS','O96T accepted basis')
ck(H(Path(sys.argv[2]).read_bytes())==s['o96vSha256'],'O96V/O96W evidence chain')
ck(r['format']=='mk2_o96v_mountain_shared_palette_relocation_v1' and s['format']=='mk2_o96w_mountain_palette_table_allocator_path_v1' and r['status']==s['status']=='SUCCESS','report version/status')
# Reconstruct the complete LE fixup corpus independently, checking source and target coordinates.
mz=0x26654;le=mz+u(mz+0x3c);filebase=mz+u(le+0x80);table=le+u(le+0x68);records=le+u(le+0x6c);pages=u(le+0x14)
ck((le,filebase,pages)==(0x28f0c,0x61c54,113),'authentic LE topology')
fix={};count=0
for i in range(pages):
 pos=records+u(table+4*i);end=records+u(table+4*(i+1))
 while pos<end:
  tag=b[pos]&15;flags=b[pos+1];delta=signed(pos+2);pos+=4
  ck(not(flags&3),'unsupported LE fixup flags')
  obj=h(pos) if flags&64 else b[pos];pos+=2 if flags&64 else 1
  dest=None
  if tag!=2:
   dest=u(pos) if flags&16 else h(pos);pos+=4 if flags&16 else 2
  if flags&4:pos+=4 if flags&32 else 2
  ck(pos<=end,'fixup record bounds')
  fix[filebase+i*4096+delta]=(tag,flags,obj,dest);count+=1
 ck(pos==end,'fixup page end')
ck(count==27004==r['relocationCount']==s['relocationCount'],'relocation count')
base=0xa0c54;target=0x2b52a;targetPhysical=filebase+target
ck(r['object1']=={'imagePhysicalBase':filebase,'targetOffset':target,'physicalOffset':targetPhysical},'Obj1 target mapping')
check_sources=[]
for i in range(15):
 p=base+0x1c4cc+16*i+12;ck(u(p)==target,'Mountain trailing pointer '+str(i));ck(fix.get(p)==(7,16,1,target),'Mountain type-7 fixup '+str(i));check_sources.append(p)
array_sources=[]
for i in range(8):
 p=base+0x1c5bc+4*i;ck(u(p)==target,'palette table entry '+str(i));ck(fix.get(p)==(7,16,1,target),'palette array typed fixup '+str(i));array_sources.append(p)
ck(r['sourceRelocations']=={'object1Target':target,'total':23,'descriptorSources':check_sources,'arraySources':array_sources,'allSources':check_sources+array_sources},'source populations')
all_same={p for p,f in fix.items() if f==(7,16,1,target)}
ck(all_same==set(check_sources+array_sources),'no unaccounted typed references')
# Correct palette grammar: little-endian UINT16 count followed immediately by UINT16 color entries; not a 32-bit count.
countColors=h(targetPhysical);recordBytes=2+2*countColors
ck(countColors==207 and recordBytes==416,'207-color record boundary')
colors=list(struct.unpack_from('<'+str(countColors)+'H',b,targetPhysical+2))
ck(all(c<=0x7fff for c in colors),'15-bit words')
check_dac=lambda x:[((x>>9)&63)|1,((x>>4)&63)|1,((x<<1)&63)|1]
known={0,1,63,96};samples=[{'index':j,'word':colors[j],'rgb6':check_dac(colors[j])} for j in sorted(known)]
rec=r['record'];ck(rec['grammar']=='uint16-count+uint16-colours' and rec['colorCount']==207 and rec['encodedByteLength']==416,'palette record contract')
ck(rec['sha256']==H(b[targetPhysical:targetPhysical+recordBytes]),'palette bytes sha256')
ck(rec['allWords15Bit'] and rec['uniqueWords']==len(set(colors))==180,'packed-color distinctness')
ck(rec['firstWords']==colors[:8] and rec['colorAtIndex96']==colors[96],'palette samples')
ck(rec['dacAtIndices']==samples,'bounded DAC conversions')
# Independent graphics command scan from the actual resource to confirm highest selected source index.
maxIndex=0
for i in range(15):
 d=base+0x1c4cc+16*i;w,hh=h(d),h(d+2);g=u(d+8)&0xffffff
 ck((w,hh)==(35,41),'sprite shape')
 for yy in range(hh):
  x=0
  while x<w:
   ck(g+4<=len(gra),'gra stream command boundary')
   cmd=struct.unpack_from('<I',gra,g)[0];g+=4
   if cmd&1:n=cmd>>1
   elif cmd&2:
    n=cmd>>10;maxIndex=max(maxIndex,(cmd>>2)&255)
   else:
    n=cmd>>2;ck(g+n<=len(gra),'gra literal bounds');maxIndex=max(maxIndex,max(gra[g:g+n]));g+=(n+3)&~3
   ck(n>0 and x+n<=w,'gra command width');x+=n
ck(maxIndex==96==rec['maxSelectedSpriteSourceIndex'] and rec['allSelectedIndicesWithinRecord'],'valid color indices')
ck(r['hypotheses']=={'auxiliaryDwordIsRelocatedObject1Reference':'SUPPORTED','targetFitsExactMK2PaletteRecordGrammar':'SUPPORTED','all15SpritesIndexDomainFitsRecord':'SUPPORTED','runtimeColorsProven':'UNPROVEN','stageOwnershipProven':'UNPROVEN'},'research boundary O96V')
setup=[0x1c31e,0x1c330];ck(len(s['setupRecords'])==2,'setup count')
for i,off in enumerate(setup):
 loc=base+off+14
 ck(s['setupRecords'][i]=={'object2Offset':off,'sourcePhysical':base+off,'palettePointerFieldPlus14':loc,'paletteArrayOffset':0x1c5bc},'setup record provenance')
 ck(u(loc)==0x1c5bc and fix.get(loc)==(7,16,2,0x1c5bc),'setup pointer to shared array')
refs=sorted([{'sourcePhysical':p,'targetObject2Offset':v[3]} for p,v in fix.items() if v[0:3]==(7,16,2) and v[3] in setup],key=lambda v:v['sourcePhysical'])
ck(s['setupReferences']==refs and len(refs)==2 and {v['targetObject2Offset'] for v in refs}==set(setup),'two setup object references')
ck(s['paletteArray']=={'object2Offset':0x1c5bc,'count':8,'repeatedObject1Target':target,'allEightRelocated':True},'palette pointer table provenance')
code=[(0x81dd2,'c1e202'),(0x81dd5,'03560e'),(0x81dd8,'8b02'),(0x81dda,'e85a96ffff'),(0x81ddf,'66894530'),(0x7b489,'668b18'),(0x7b48c,'83c002'),(0x7b4aa,'8904dd005b0700')]
for addr,hx in code:ck(b[addr:addr+len(hx)//2].hex()==hx,'allocator instruction '+hex(addr))
ck(s['machineBytes']==[{'offset':a,'hex':hexs} for a,hexs in code],'allocator instruction report')
ck(s['allocatorMachine']=={'paletteTableLoadFromEsiPlus14':0x81dd5,'palettePointerDeref':0x81dd8,'allocatorCall':0x81dda,'objectHandleFieldWrite':0x81ddf,'allocatorEntry':0x7b439,'countRead':0x7b489,'paletteColorStartAdvance':0x7b48c},'exact allocator consumer')
ck(s['hypotheses']=={'setupPaletteArrayAllEightSameRecord':'SUPPORTED','paletteAllocatorConsumesTableSelectedPointer':'SUPPORTED_CONDITIONAL_ON_ESI_SETUP','twoSetupRecordsActuallySelectedAtRuntime':'UNPROVEN','o96sMountainObjectPaletteHandleProven':'UNPROVEN','correctColorStageExportReady':'UNPROVEN'},'research boundary O96W')
print(json.dumps({'status':'PASS','passes':'O96V/O96W','checks':checks,'failures':0,'relocationsIndependentlyParsed':count,'paletteColors':countColors,'decodedSourceIndexMax':maxIndex,'typedPaletteReferences':len(all_same),'setupRecords':len(setup),'runtimeBindingObserved':False}))
