#!/usr/bin/env python3
"""Independent O95Y verifier from MK2 bytes, executable filename pool, O95W/X."""
import hashlib,json,struct,sys
from pathlib import Path
if len(sys.argv)!=5:raise SystemExit('usage: verify-mk2-o95y-tail-reference-table.py <MK2-dir> <o95w> <o95x> <o95y>')
fix=Path(sys.argv[1]); wb=Path(sys.argv[2]).read_bytes(); xb=Path(sys.argv[3]).read_bytes();out=json.loads(Path(sys.argv[4]).read_text());w=json.loads(wb);x=json.loads(xb);exe=(fix/'mk2.exe').read_bytes();n=0
def ck(label,condition):
 global n
 n+=1
 if not condition:raise AssertionError(label)
def digest(b):return hashlib.sha256(b).hexdigest()
ck('format',out['format']=='mk2_overlay_packed_suffix_reference_table_o95y_v1' and out['status']=='SUCCESS')
ck('exe sha',digest(exe)==out['fixtureExeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
ck('prereq sha',out['prerequisites']=={'o95wSha256':digest(wb),'o95xSha256':digest(xb)})
poolStart=exe.index(b'PLAYSTA.GRA\0');pool=[];cur=poolStart
for i in range(200):
 end=exe.index(b'\0',cur);nm=exe[cur:end].decode('ascii');pool.append(nm);cur=end+1
 if nm=='RM.DRV':break
ck('pool',out['resourcePool']=={'markerPhysical':poolStart,'entryCount':len(pool),'terminator':'RM.DRV'})
table=out['table'];ck('table contract',(table['startPhysical'],table['endExclusive'],table['slotCount'],table['runtimeTableConsumerQualified'])==(0xcfbac,0xcfbcc,8,False))
rows=table['slots'];ck('eight slots',len(rows)==8);nonzero=[]
for i,r in enumerate(rows):
 off=0xcfbac+4*i;v=struct.unpack_from('<I',exe,off)[0]
 ck('physical position',r['index']==i and r['entryPhysical']==off)
 ck('hex DWORD',r['packedReferenceHex']=='0x'+format(v,'08X'))
 if v==0:
  ck('zero row',r['kind']=='ZERO_WORD_UNINTERPRETED' and i==5);continue
 id_=v>>24;graoff=v&0xffffff;name=pool[id_];raw=(fix/name.lower()).read_bytes();tail=raw[graoff:]
 ck('resource pointer',r['kind']=='PACKED_RESOURCE_SUFFIX_REFERENCE' and r['resource']==name and r['resourceId']==id_ and r['graOffset']==graoff)
 ck('resource bytes',r['resourceSize']==len(raw) and 0<graoff<len(raw) and r['bytesToEOF']==len(tail))
 ck('raw sha',r['resourceFileSha256']==digest(raw))
 ck('tail sha',r['suffixSha256']==digest(tail))
 ck('arithmetic',r['divisibleBy1024']==(len(tail)%1024==0) and r['divisibleBy7168']==(len(tail)%7168==0))
 # independent exact byte scan includes non-aligned occurrences
 needle=v.to_bytes(4,'little');hits=[];pos=exe.find(needle)
 while pos>=0:hits.append(pos);pos=exe.find(needle,pos+1)
 ck('only exact occurrence',hits==[off] and r['exactDwordOccurrencesInExe']==hits)
 if name!='BATTLE.GRA':
  xo=next(z for z in x['members'] if z['resource']==name)
  ck('O95X corroboration',xo['start']==graoff and xo['endExclusive']==len(raw) and xo['tailSha256']==digest(tail))
 else:
  ck('BATTLE evidence',graoff==59436 and len(tail)==35840 and name not in [z['resourceName'] for z in w['resources']])
 nonzero.append((name,graoff,len(tail)))
ck('nonzero names',[t[0] for t in nonzero]==['TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'])
ck('last zero word',struct.unpack_from('<I',exe,0xcfbcc)[0]==0 and table['followingDwordZero'])
ck('totals',out['counts']==dict(nonzeroSlots=7,zeroSlots=1,o95xExactSuffixMatches=6,newZeroCandidateResourceExactTailReference=1,allNonzeroUniqueDwordOccurrences=7,allNonzeroDivisibleBy7168=7,nonzeroTotalReferencedEOFBytes=sum(t[2] for t in nonzero)))
for key in ('packedHighByteLow24FormatFromO69','physicalOverlayBytesAuthenticated','physicalAdjacencyNotProofOfRuntimeTableConsumer','referenceNotProofOfRasterGrammar','referenceNotProofOfRuntimeStageSelection','battleNoO69DescriptorRemainsUnqualified','paletteAndPlacementUnresolved'):
 ck('boundary '+key,out['boundary'][key] is True)
ck('MK2 still open',out['boundary']['mk2ResearchClosed'] is False)
print(json.dumps({'status':'PASS','checks':n,'failures':0,'sevenReferences':[t[0] for t in nonzero]}))
