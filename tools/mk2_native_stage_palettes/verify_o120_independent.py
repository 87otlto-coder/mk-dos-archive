#!/usr/bin/env python3
"""Independently reconstruct O120 LE fixups and validate the complete 4-record graph.
Do not import the O120 producer or trust its locations, summaries, or source claims.
"""
from __future__ import annotations
import hashlib,json,struct,sys
from collections import defaultdict
from pathlib import Path

H=lambda x:hashlib.sha256(x).hexdigest()
U=lambda b,i:struct.unpack_from('<I',b,i)[0]
W=lambda b,i:struct.unpack_from('<H',b,i)[0]
LE=0x28f0c; BASE=(0x61c54,0xa0c54)
# Tested separately from producer's independent specs
S={
 'portal80': {'pos':0x891e0,'count':80,'table':0x16538,'length':9,'setup':[0x16514,0x16526],'others':[0xb7224,0xb727c,0xb72d4]},
 'tomb80':{'pos':0x893c6,'count':80,'table':0x177d0,'length':7,'setup':[0x17358,0x1736a,0x1737c,0x1738e,0x173a0,0x173b2],'others':[0xb8368,0xb83cc]},
 'portal79':{'pos':0x8cd1e,'count':79,'table':0x2e784,'length':9,'setup':[0x2e720],'others':[]},
 'tomb79':{'pos':0x8cdbe,'count':79,'table':0x2e848,'length':9,'setup':[0x2e7e4],'others':[]},
}
def reject(condition,message):
 if not condition:raise AssertionError('O120 independent: '+message)

def parse_fixups(exe):
 reject(exe[LE:LE+2]==b'LE' and U(exe,LE+0x14)==113,'LE header')
 owner_table=LE+U(exe,LE+0x40)
 owners=[]
 for n in range(U(exe,LE+0x44)):
  at=owner_table+24*n
  owners.append((n+1,U(exe,at+12),U(exe,at+16)))
 reject(owners==[(1,1,63),(2,64,50)],'owner page sections')
 indexes=LE+U(exe,LE+0x68);data=LE+U(exe,LE+0x6c)
 out=defaultdict(list);n=0
 for page in range(113):
  own=next((v for v in owners if v[1]<=page+1<v[1]+v[2]),None)
  reject(own is not None,'page has no owner')
  p=data+U(exe,indexes+page*4);end=data+U(exe,indexes+(page+1)*4)
  while p<end:
   fmt=exe[p]&15;flags=exe[p+1];relative=struct.unpack_from('<h',exe,p+2)[0];p+=4
   reject((flags&3)==0,'external fixup')
   to=W(exe,p) if flags&64 else exe[p];p+=2 if flags&64 else 1
   target=None
   if fmt!=2:
    target=U(exe,p) if flags&16 else W(exe,p)
    p+=4 if flags&16 else 2
   if flags&4:p+=4 if flags&32 else 2
   loc=(page+1-own[1])*4096+relative
   out[(own[0],loc)].append((fmt,flags,to,target))
   n+=1
  reject(p==end,'LE fixup page boundary')
 reject(n==27004 and len(out)==26994,'full fixup census')
 for rows in out.values():reject(len(set(rows))==1,'ambiguous alias fixups')
 return {key:rows[0] for key,rows in out.items()},n

def verify(exe,raw):
 report=json.loads(raw)
 reject(len(exe)==861133 and H(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','fixture identity')
 rel,total=parse_fixups(exe)
 reject(report['format']=='mk2_o120_typed_stage_palette_setup_graph_v1' and report['status']=='PASS_STATIC_STRUCTURE','report schema')
 reject(report['originalExeSHA256']==H(exe) and report['fixupsIndependentlyMapped']==len(rel),'source/census metadata')
 reject(report['objectImageBases']=={'object1':BASE[0],'object2':BASE[1]},'object bases')
 reject(set(report['records'])==set(S),'complete palette record labels')
 checks=0
 for name,spec in S.items():
  item=report['records'][name]
  pos=spec['pos'];count=spec['count'];tbl=spec['table'];setup=spec['setup']
  reject(W(exe,pos)==count,'palette count header')
  reject(item['recordPhysical']==pos and item['object1Offset']==pos-BASE[0] and item['paletteCount']==count,'palette record coordinates')
  reject(item['recordSHA256']==H(exe[pos:pos+2+count*2]),'palette record SHA')
  reject(item['palettePointerTableObject2']==tbl and item['consecutivePalettePointerCount']==spec['length'],'table count and position')
  reject(len(item['directTypedPointers'])==spec['length'],'direct pointer count')
  for i in range(spec['length']):
   off=tbl+i*4;entry=(7,16,1,pos-BASE[0]);needle=item['directTypedPointers'][i]
   reject(rel[(2,off)]==entry and U(exe,BASE[1]+off)==pos-BASE[0],'LE pointer vs raw bytes')
   reject(needle=={'object2Offset':off,'physical':BASE[1]+off},'reported pointer location')
   checks+=1
  extras=sorted([BASE[owner-1]+loc for (owner,loc),row in rel.items() if row==(7,16,1,pos-BASE[0]) and not(owner==2 and tbl<=loc<tbl+spec['length']*4)])
  reject(item['otherTypedPointerPhysical']==spec['others'] and extras==spec['others'],'other typed source pointers')
  reject(len(item['setupRecords'])==len(setup),'setup count')
  for j,off in enumerate(setup):
   rec=item['setupRecords'][j]
   reject(rec['object2Offset']==off and rec['physical']==BASE[1]+off,'setup location')
   reject(rec['raw18SHA256']==H(exe[BASE[1]+off:BASE[1]+off+18]),'setup raw hash')
   values=struct.unpack_from('<HHH',exe,BASE[1]+off)
   reject(rec['fields']==dict(zip(['widthWord','heightWord','controlWord'],values)),'setup value triplet')
   for d,label in [(6,'controlPointer'),(10,'spritePointer'),(14,'paletteTablePointer')]:
    target=U(exe,BASE[1]+off+d)
    reject(rel[(2,off+d)]==(7,16,2,target),'typed setup field')
    reject(rec['links'][label]=={'object2Offset':target,'sourcePhysical':BASE[1]+off+d},'reported setup link')
    if d==14:reject(target==tbl,'setup palette table join')
    checks+=1
   parents=[{'sourceObject':owner,'sourceObjectOffset':src,'sourcePhysical':BASE[owner-1]+src} for (owner,src),v in rel.items() if v==(7,16,2,off)]
   parents.sort(key=lambda v:(v['sourceObject'],v['sourceObjectOffset']))
   reject(rec['incomingTypedReferences']==parents,'relocation-backed setup parents')
   checks+=len(parents)
 consumer=report['consumer']
 reject(consumer=={'conditionalRuntimeSetupSelection':{'selectionHelperCallPhysical':0x81c4e,
         'setupLoadFromSelectedObjectPhysical':0x81c53,
         'axisSpan0ReadPhysical':0x81c63,'axisSpan1ReadPhysical':0x81c79,
         'entryCountCheckPhysical':0x81cba,'spriteControlFieldReadPhysical':0x81caa,
         'spriteTableFieldReadPhysical':[0x81ce4,0x81d49],
         'palettePointerFieldReadPhysical':0x81dd5,'observedRuntimeSelectedSetup':False},
   'setupPaletteArrayReadPhysical':0x81dd5,'pointerDerefPhysical':0x81dd8,
                   'allocatorCallPhysical':0x81dda,'allocatorPhysical':0x7b439,
                   'handleStorePhysical':0x81ddf,'setupFieldOffset':14,
                   'recordType':'u16 colorCount; colorCount*u16 colorWords'},'consumer claimed fields')
 reject(exe[0x81dd5:0x81de3].hex()=='03560e8b02e85a96ffff66894530','consumer machine bytes')
 reject(exe[0x7b439:0x7b43e].hex()=='53515233db','allocator code signature')
 for at,code in ((0x81c4e,'e8c3010000'),(0x81c53,'8b30'),(0x81c63,'66031e'),(0x81c79,'66035e02'),(0x81cba,'663b5e04'),(0x81caa,'8b7e06'),(0x81ce4,'03460a'),(0x81d49,'03460a')):
  reject(exe[at:at+len(code)//2].hex()==code,'conditional producer code bytes')
 reject(report['limitations']=={
 'actualRuntimeESISetupBinding':False,'livePaletteHandle':False,
 'paletteDACStart':False,'sceneCompositorComplete':False,
 'alternative79RecordsNeverUsed':False,'setupRecordFieldLabelsBeyondVerifiedOffsets':False},'falsified runtime or field semantic claim')
 return {'status':'PASS_INDEPENDENT','canonicalLeFixups':total,'uniqueFixupSites':len(rel),
         'setupRecords':sum(len(v['setupRecords']) for v in report['records'].values()),
         'contiguousPaletteReferences':sum(v['consecutivePalettePointerCount'] for v in report['records'].values()),
         'independentGraphAssertions':checks,'reportSHA256':H(raw)}

if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('usage: verify_o120_independent.py ORIGINAL_MK2.EXE O120_REPORT.json')
 print(json.dumps(verify(Path(sys.argv[1]).read_bytes(),Path(sys.argv[2]).read_bytes()),indent=2))
