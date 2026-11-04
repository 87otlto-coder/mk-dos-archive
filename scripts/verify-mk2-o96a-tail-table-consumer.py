#!/usr/bin/env python3
"""Independent O96A LE fixup, code-path and packed copy contract verification."""
import json,hashlib,struct,sys
from pathlib import Path
if len(sys.argv)!=4:raise SystemExit('usage: verify-mk2-o96a-tail-table-consumer.py <MK2-dir> <o95y> <o96a>')
root=Path(sys.argv[1]);yb=Path(sys.argv[2]).read_bytes();y=json.loads(yb);z=json.loads(Path(sys.argv[3]).read_text());b=(root/'mk2.exe').read_bytes();n=0
def ck(s,v):
 global n
 n+=1
 if not v:raise AssertionError(s)
def sha(d):return hashlib.sha256(d).hexdigest()
def u(off):return struct.unpack_from('<I',b,off)[0]
def s16(off):return struct.unpack_from('<h',b,off)[0]
ck('format',z['format']=='mk2_bound_le_packed_suffix_consumer_o96a_v1' and z['status']=='SUCCESS')
ck('source',z['fixtureExeSha256']==sha(b)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65' and z['source']=={'o95ySha256':sha(yb)})
mz=0x26654;le=mz+u(mz+0x3c);pg=u(le+0x28);pagecount=u(le+0x14);dat=u(le+0x80);physical=mz+dat
ck('bound module',mz==z['boundLE']['embeddedMzPhysical'] and le==0x28f0c==z['boundLE']['leHeaderPhysical'] and b[le:le+2]==b'LE')
ck('pages',pg==4096 and pagecount==113 and dat==0x3b600 and physical==0x61c54)
ck('page meta',all(z['boundLE'][k]==v for k,v in [('moduleRelativePageOffset',dat),('physicalPageBase',physical),('pageCount',pagecount),('pageSize',pg)]))
ot=le+u(le+0x40);pageMap=le+u(le+0x48);pt=le+u(le+0x68);records=le+u(le+0x6c)
objects=[{'id':i+1,'startPage':u(ot+24*i+12),'pageCount':u(ot+24*i+16),'virtualSize':u(ot+24*i)} for i in range(2)]
ck('obj metadata',objects==z['boundLE']['objects'] and objects[0]['pageCount']==63 and objects[1]['startPage']==64)
pageidx=[int.from_bytes(b[pageMap+4*j:pageMap+4*j+3],'big') for j in range(pagecount)]
ck('page map all',pageidx==list(range(1,pagecount+1)))
obj2physical=physical+(objects[1]['startPage']-1)*pg
ck('table mapping',obj2physical+0x2ef54==0xcfba8 and z['indexedTable']['object2Offset']==0x2ef54 and z['indexedTable']['physicalBase']==0xcfba8)
end=[u(pt+j*4) for j in range(pagecount+1)];calls={};count=0
for page in range(pagecount):
 owner=next(o for o in objects if o['startPage']<=page+1<o['startPage']+o['pageCount'])
 curr=records+end[page];stop=records+end[page+1]
 while curr<stop:
  typ=b[curr]&15;flags=b[curr+1];loc=s16(curr+2);curr+=4
  ck('fixup flags',flags&3==0)
  obj=struct.unpack_from('<H',b,curr)[0] if flags&0x40 else b[curr];curr+=2 if flags&0x40 else 1
  dest=0
  if typ!=2:dest=u(curr) if flags&0x10 else struct.unpack_from('<H',b,curr)[0];curr+=4 if flags&0x10 else 2
  if flags&4:curr+=4 if flags&0x20 else 2
  absolute=(page+1-owner['startPage'])*pg+loc
  if (owner['id'],absolute) in [(1,0x3c519),(1,0x3d87)]:calls[absolute]=(typ,obj,dest)
  count+=1
 ck('fixup end',curr==stop)
ck('fixup count',count==z['boundLE']['fixupsReparsed']==27004)
ck('indexed table relocation',calls.get(0x3c519)==(7,2,0x2ef54) and z['indexedTable']['relocationSourceObject1Offset']==0x3c519)
ck('resource table relocation',calls.get(0x3d87)==(7,2,0x2f434) and z['packedCopy']['resourceBaseFixupPhysical']==0x659db)
ck('indexed bytes',b[0x9e165:0x9e171].hex()=='a17f74070003348554ef0200')
ck('selection global',z['producer']['indexSourceGlobal']==0x7747f and z['producer']['indexedReadPhysical']==0x9e16a)
ck('call bytes',b[0x9e18b:0x9e197].hex()=='b80100000055e83078fcff5d')
ck('call rel32',0x9e191+5+struct.unpack_from('<i',b,0x9e192)[0]==0x659c6==z['producer']['consumerCallTargetPhysical'])
ck('producer fingerprint',sha(b[0x9e118:0x9e198])==z['producer']['codeSha256'])
ck('renderer fingerprint',sha(b[0x659c6:0x65a52])==z['packedCopy']['codeSha256'])
ck('packed ID bytes',b[0x659c9:0x659e7].hex()=='8bdec1eb188d2cdd00000000c1e3048b9c2b34f4020081e6ffffff0003f3')
ck('load/store row code',b[0x65a0b:0x65a1a].hex()=='8bd98beeB950000000ad03c2abe2fa'.lower())
ck('896 stride',b[0x65a2d:0x65a3a].hex()=='81c5800300008bf52bf04b75d5')
ck('consumer properties',z['packedCopy']['sourceDwordCountPerInnerLoop']==80 and z['packedCopy']['sourceBytesPerInnerLoop']==320 and z['packedCopy']['sourceRowBaseIncrementBytes']==896 and z['packedCopy']['handleStrideBytes']==24)
entryList=z['indexedTable']['observedIndexRange'];ck('observed slots',len(entryList)==10)
for idx,entry in enumerate(entryList):
 ck('mapped slots',entry=={'index':idx,'physical':0xcfba8+idx*4,'rawHex':'0x'+format(u(0xcfba8+idx*4),'08X')})
ck('O95Y shift',[u(0xcfba8+4*i) for i in range(1,9)]==[int(e['packedReferenceHex'],16) for e in y['table']['slots']])
ck('zero rows',[u(0xcfba8+4*i) for i in (0,6,9)]==[0,0,0])
stride=z['packedCopy']['referencedEOFTailStridePartitions'];ref=[e for e in y['table']['slots'] if e['kind']=='PACKED_RESOURCE_SUFFIX_REFERENCE'];ck('seven',len(stride)==len(ref)==7)
for a,e in zip(stride,ref):
 bytes_=e['bytesToEOF'];ck('896 partition',a=={'resource':e['resource'],'physicalEntry':e['entryPhysical'],'bytesToEOF':bytes_,'sourceStride896Units':bytes_//896,'unitsModulo8':(bytes_//896)%8} and bytes_%896==0)
for k in ('selectedTableDWORDIsConsumedByRenderingPath','selectedPackedValueFlowsIntoResourceBasePlusOffset','actualRowCopyLoopAuthenticated'):ck('positive '+k,z['classification'][k] is True)
for k in ('paletteOwnershipEstablished','screenGeometryEstablished','cameraOrGameplayStageNameEstablished','exactRuntimeTableIndexSetEstablished','noAutomaticPromotionOf14GRAOrOtherMK2Closures','mk2ResearchClosed'):ck('boundary '+k,z['classification'][k] is False if k not in ('noAutomaticPromotionOf14GRAOrOtherMK2Closures',) else z['classification'][k] is True)
ck('runtime index bound',z['indexedTable']['runtimeIndexBoundProved'] is False)
ck('O72 corrected',z['boundLE']['priorO67PostLeOverlayLabelSupersededByO72'] is True)
print(json.dumps({'status':'PASS','checks':n,'failures':0,'reparsedRelocations':count,'consumer':'0x659C6','sourceRowStride':896}))
