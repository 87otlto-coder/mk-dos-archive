#!/usr/bin/env python3
"""Separate O96T raw-binary verifier: independently walk 15 descriptors and all graphic commands."""
import sys, json, hashlib, struct
from pathlib import Path
if len(sys.argv)!=3:raise SystemExit('usage: verifier <mk2-dir> <O96T json>')
fx=Path(sys.argv[1]);exe=(fx/'mk2.exe').read_bytes();gra=(fx/'mountain.gra').read_bytes();r=json.loads(Path(sys.argv[2]).read_bytes());n=0
H=lambda b:hashlib.sha256(b).hexdigest()
def ck(test,label):
 global n
 n+=1
 if not test:raise AssertionError('O96T: '+label)
ck(H(exe)==r['fixture']['exeSha256']=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65','exe identity')
ck(H(gra)==r['fixture']['mountainGraSha256']=='0dc92ef698a139eacaf57d1b7ebe47b40c8b1c08952251d8274c818be05c2ff6','resource identity')
ck(r['status']=='SUCCESS' and r['format']=='mk2_o96t_mountain_selected_indexed_graphics_v1','evidence format')
ck(r['fixture']['resourceBytes']==len(gra)==191748,'resource size')
pre=(Path(__file__).resolve().parent.parent/'mk2_static_word_stream_descriptor_consumer_join_o96s_2026-10-09.json').read_bytes()
ck(r['parentReportSha256']==H(pre),'O96S provenance')
name=exe[0xa0ef1:0xa13a7].split(b'\0')[37].decode('ascii')
ck(r['resourcePool']=={'ordinal':37,'name':name} and name=='MOUNTAIN.GRA','resource-pool id')
ck(r['descriptorFamily']=={'fileImageBase':0xa0c54,'startOffset':0x1c4cc,'stride':16,'recordCount':15,'tableReachableDistinctRecords':14,'tableSlotCount':15,'slot14Aliases13':True,'adjacentFifteenthRecordNotInO96STable':True,'constantAuxiliaryDword':0x2b52a},'descriptor contract')
ck(len(r['records'])==15,'report entries')
source_offsets=[];maxidx=0;pixelhashes=[]
for i,q in enumerate(r['records']):
 ptr=0xa0c54+0x1c4cc+16*i
 raw=exe[ptr:ptr+16];width,height,state,packed,aux=struct.unpack('<HHIII',raw)
 ck((width,height,state,packed>>24,aux)==(35,41,0,37,0x2b52a),f'descriptor {i}')
 off=packed&0xffffff;ck(off<len(gra),f'offset {i}')
 pix=bytearray(width*height);mask=bytearray(width*height)
 pos=off;skip=rle=lit=opaque=0;used=set()
 for y in range(height):
  x=0
  while x<width:
   ck(pos+4<=len(gra),f'command header {i}:{y}:{x}')
   cmd=struct.unpack_from('<I',gra,pos)[0];pos+=4
   if cmd%2:
    span=cmd//2;ck(0<span<=width-x,'skip run');skip+=1;x+=span
   elif cmd&2:
    span=cmd>>10;color=(cmd>>2)&255;ck(0<span<=width-x,'rle run')
    pix[y*width+x:y*width+x+span]=bytes([color])*span
    mask[y*width+x:y*width+x+span]=bytes([1])*span
    used.add(color);rle+=1;opaque+=span;x+=span
   else:
    span=cmd>>2;ck(0<span<=64 and span<=width-x and pos+span<=len(gra),'literal run')
    pixels=gra[pos:pos+span];pix[y*width+x:y*width+x+span]=pixels
    mask[y*width+x:y*width+x+span]=bytes([1])*span
    used.update(pixels);lit+=1;opaque+=span;x+=span;pos+=(span+3)&~3
  ck(x==width,'row width')
 ck(opaque==1435 and skip==0 and len(used)>0,'opaque exact 35x41')
 expected={ 'ordinal':i,'descriptorOffset':0x1c4cc+16*i,'descriptorPhysical':ptr,'descriptorSha256':H(raw),'width':width,'height':height,'rawStateDword':state,'packedResourceReference':packed,'resourceId':37,'resourceName':'MOUNTAIN.GRA','graOffset':off,'auxiliaryDword':aux,'encodedBytes':pos-off,'endExclusive':pos,'commands':{'skip':skip,'rle':rle,'literal':lit},'opaquePixels':opaque,'transparentPixels':1435-opaque,'colorIndexMin':min(used),'colorIndexMax':max(used),'colorIndexCount':len(used),'pixelSha256':H(pix),'maskSha256':H(mask),'tableSelected':i<14}
 for key,val in expected.items():ck(q.get(key)==val,f'record {i} {key}')
 source_offsets.append((off,pos));pixelhashes.append(H(pix));maxidx=max(maxidx,max(used))
ck(source_offsets[0][0]==0x29314 and source_offsets[-1][1]==len(gra),'suffix bounds')
for a,b in zip(source_offsets,source_offsets[1:]):ck(a[1]==b[0],'exact adjacent encoded boundary')
# Validate exact 15-slot selector table: 14 selected records, index 14 aliases 13.
for i in range(15):
 slot=struct.unpack_from('<I',exe,0xa0c54+0x1c264+4*i)[0]
 ck(slot==0x1c4cc+16*min(i,13),'selected pointer table '+str(i))
ck(len(set(pixelhashes))==15,'all unique image checksums')
ck(r['suffix']=={'start':0x29314,'endExclusive':len(gra),'encodedBytes':23024,'streams':15,'gapless':True},'suffix contract')
ck(r['summary']=={'selectedRecords':14,'additionalAdjacentUnselectedRecord':1,'uniquePixelArrays':15,'decodedPixels':21525,'selectedDecodedPixels':20090,'opaqueColorIndexMin':min(q['colorIndexMin'] for q in r['records']),'opaqueColorIndexMax':maxidx,'allOpaque':True},'summary metrics')
ck(maxidx==96,'independently recovered index max')
ck({h['id']:h['verdict'] for h in r['hypotheses']}=={'T1':'SUPPORTED_BY_AUTHENTIC_RESOURCE_AND_CONSUMER','T2':'SUPPORTED_STRUCTURALLY_NO_O96S_TABLE_SELECTION','T3':'UNPROVEN','T4':'REJECTED_INDEX_EXCEEDS_63'},'hypothesis classifications')
ck(r['boundary']=={'existingO69PartialResourceStatusUnchanged':True,'actualRuntimeObjectPopulationObserved':False,'correctColorProven':False,'stageCompositionComplete':False},'fail-closed boundary')
print(json.dumps({'pass':'O96T','status':'PASS','checks':n,'failures':0,'selectedImages':14,'adjacentImages':1,'losslessSuffixBytes':23024,'decodedPixels':21525,'maxSourceIndex':maxidx}))
