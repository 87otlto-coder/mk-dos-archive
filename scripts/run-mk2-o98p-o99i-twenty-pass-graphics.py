#!/usr/bin/env python3
"""O98P-O99I: twenty bounded authentic MK2 graphics/cursor hypotheses.
Eight-byte descriptor family is read from serialized Object 2, streams are decoded
with the existing MK2 skip/RLE/aligned-literal grammar. No palette ownership or runtime activation inferred.
"""
import hashlib,json,struct,sys
from pathlib import Path

exe_path=Path(sys.argv[1]);fixture=Path(sys.argv[2]);o69_path=Path(sys.argv[3]);out=Path(sys.argv[4]);out.mkdir(parents=True,exist_ok=True)
e=exe_path.read_bytes();sha=lambda b:hashlib.sha256(b).hexdigest();assert sha(e)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
previous=json.loads(o69_path.read_text());r69={r['resourceName']:r for r in previous['partialOrAmbiguousResources']};pool=e[0xa0ef1:0xa13a7].split(b'\0');P=lambda o:0xa0c54+o;u16=lambda b,o:struct.unpack_from('<H',b,o)[0];u32=lambda b,o:struct.unpack_from('<I',b,o)[0]

def decode(b,start,w,h):
 assert 0<=start<len(b) and 1<=w<=640 and 1<=h<=480 and w*h<=307200
 at=start;opaque=0;lo=256;hi=-1;commands=[0,0,0];pixels=bytearray(w*h);mask=bytearray(w*h)
 for y in range(h):
  x=0
  while x<w:
   assert at+4<=len(b); cmd=u32(b,at);at+=4
   if cmd&1:
    n=cmd>>1;commands[0]+=1
   elif cmd&2:
    n=cmd>>10;v=(cmd>>2)&255;commands[1]+=1
    assert n>0 and x+n<=w
    px=y*w+x;pixels[px:px+n]=bytes([v])*n;mask[px:px+n]=b'\x01'*n;opaque+=n;lo=min(lo,v);hi=max(hi,v)
   else:
    n=cmd>>2;commands[2]+=1
    assert 0<n<=64 and at+n<=len(b)
    px=y*w+x;dat=b[at:at+n];pixels[px:px+n]=dat;mask[px:px+n]=b'\x01'*n
    opaque+=n;lo=min(lo,min(dat));hi=max(hi,max(dat));at+=(n+3)&~3
   assert 0<n<=w-x
   x+=n
 return {'endExclusive':at,'encodedBytes':at-start,'opaque':opaque,'transparent':w*h-opaque,'minIndex':None if hi<0 else lo,'maxIndex':None if hi<0 else hi,'commands':{'skip':commands[0],'rle':commands[1],'literal':commands[2]},'pixelsSha256':sha(pixels),'maskSha256':sha(mask)}

# Explicit, contiguous Object-2 candidate families discovered in the binary.
T={
 'STORY':(104412,40),'IMAGES':(190768,90),'DEDPOOL':(90152,25),'KONTIN':(106196,32),'BIO':(129828,8),'T1HDRS':(109488,20),'T2HDRS':(109648,20),'ENDH':(129700,8),'ENDV':(129764,8),'COPY':(191668,8),
 'LOGO':(104136,10),'PLAYSEL':(129152,8),'STONE':(129624,8),'PIT':(101296,28),'TITLE':(120592,8),
 'PORTAL':(91484,13),'ARMORY':(92508,18),'FOREST':(93580,49),'TOMB':(95880,16),
 'TOWER':(96640,4),'ARENA':(99856,15),'VFRAME':(116764,10),'BATTLE':(103296,40),'CAVE':(98912,49)}
PASS=[('O98P','control-cursor-context-discrimination',[]),
      ('O98Q','story-full-8byte',['STORY']),('O98R','images-full-8byte',['IMAGES']),('O98S','dedpool-full-8byte',['DEDPOOL']),
      ('O98T','kontin-full-8byte',['KONTIN']),('O98U','bio-full-8byte',['BIO']),('O98V','t1hdrs-full-8byte',['T1HDRS']),('O98W','t2hdrs-full-8byte',['T2HDRS']),
      ('O98X','endh-full-8byte',['ENDH']),('O98Y','endv-full-8byte',['ENDV']),('O98Z','copy-full-8byte',['COPY']),
      ('O99A','logo-hybrid-full',['LOGO']),('O99B','playsel-hybrid-full',['PLAYSEL']),('O99C','stone-hybrid-full',['STONE']),
      ('O99D','portal-mixed-tail',['PORTAL']),('O99E','armory-mixed-tail',['ARMORY']),('O99F','forest-mixed-tail',['FOREST']),('O99G','tomb-mixed-tail',['TOMB']),
      ('O99H','tower-arena-pit-title-vframe-mixed',['TOWER','ARENA','PIT','TITLE','VFRAME']),('O99I','battle-cave-fonts-playsta-boundaries',['BATTLE','CAVE','FONTS','PLAYSTA'])]
assert len(PASS)==20

def resource(name):
 fn=name+'.GRA';fid=pool.index(fn.encode());b=(fixture/fn.lower()).read_bytes();rows=[]
 if name in T:
  start,count=T[name]; assert P(start)>=0xa0c54 and P(start+count*8)<=len(e)
  for i in range(count):
   p=P(start+8*i);w=u16(e,p);h=u16(e,p+2);pack=u32(e,p+4)
   assert (pack>>24)==fid,(name,i,'id');off=pack&0xffffff
   d=decode(b,off,w,h)
   rows.append({'object2Offset':start+i*8,'descriptorSha256':sha(e[p:p+8]),'width':w,'height':h,'packedRef':pack,'graStart':off,**d})
  if name=='BATTLE':
   assert len(rows)==40 and all(rows[j]['endExclusive']==rows[j+1]['graStart'] for group in (0,20) for j in range(group,group+19))
   assert all(rows[j]['pixelsSha256']==rows[j+20]['pixelsSha256'] and rows[j]['graStart']==rows[j+20]['graStart'] for j in range(20))
  else: assert all(rows[i]['endExclusive']==rows[i+1]['graStart'] for i in range(len(rows)-1)),name+' 8-byte chain'
 else:start=None;count=0
 prefixEnd=rows[-1]['endExclusive'] if rows else 0;prefixStart=rows[0]['graStart'] if rows else None
 suffix=[];prior=r69.get(fn)
 if prior:
  for s in prior['streams']:
   if s['graOffset']>=prefixEnd:
    ph=s['descriptorPhysical'];w=s['width'];h=s['height'];assert u16(e,ph)==w and u16(e,ph+2)==h
    assert (u32(e,ph+8)>>24)==fid and (u32(e,ph+8)&0xffffff)==s['graOffset']
    d=decode(b,s['graOffset'],w,h); assert d['endExclusive']==s['encodedEndExclusive']
    suffix.append({'descriptorPhysical':ph,'width':w,'height':h,'graStart':s['graOffset'],**d})
 suffix.sort(key=lambda r:r['graStart'])
 suffix_tiling=bool(suffix) and suffix[0]['graStart']==prefixEnd and all(x['endExclusive']==y['graStart'] for x,y in zip(suffix,suffix[1:])) and suffix[-1]['endExclusive']==len(b)
 full8=bool(rows) and prefixStart==0 and prefixEnd==len(b)
 hybrid=bool(rows) and prefixStart==0 and suffix_tiling and name!='VFRAME' and prior and prior['ambiguousOffsetCount']==0
 status='EXACT_FULL_INDEXED_8' if full8 else ('EXACT_FULL_INDEXED_8_PLUS_O69' if hybrid else 'PARTIAL_MIXED_OR_AMBIGUOUS')
 gaplist=[]  # O69 corpus has decode streams, not O95W uncovered-span records
 coveredprefix=prefixEnd-prefixStart if prefixStart is not None else 0
 return {'resource':fn,'resourceId':fid,'resourceBytes':len(b),'resourceSha256':sha(b),'tableObject2Start':start,'descriptorCount':count,'records':rows,'firstStreamStart':prefixStart,'lastStreamEnd':prefixEnd,'prefixDecodedBytes':coveredprefix,'o69PriorAmbiguous':prior['ambiguousOffsetCount'] if prior else None,'o69KnownGaps':[{'start':v['start'],'endExclusive':v['endExclusive']} for v in gaplist], 'priorO69Suffix':suffix,'verifiedSuffixContiguousToEOF':suffix_tiling,'classification':status,'extra':{'mixedPrefixOf120Bytes':name=='CAVE' and prefixStart==120,'distinct8ByteDescriptorOwnershipUnresolved':name=='VFRAME','fileTailRetainsRawOrOpaqueInterpretation':name in ['PORTAL','ARMORY','FOREST','TOMB','TOWER','ARENA','BATTLE'],'o69OverlapAmbiguityNotPromoted':name in ['PLAYSTA','VFRAME']}}

def cursor():
 sites=[(0x84c90,0x84c95),(0x9882d,0x98832),(0x98a4a,0x98a4f)];ls=[]
 for p,q in sites:
  assert e[p]==0xb8 and u32(e,p+1)==0x15d60 and e[q]==0xa3 and u32(e,q+1)==0x75cf6
  ls.append({'loadOffset':p,'storeOffset':q,'loadHex':e[p:p+5].hex(),'storeHex':e[q:q+5].hex(),'localWindowSha256':sha(e[p-5:q+10])})
 return {'sites':ls,'sameCursorPointer':True,'distinctInstallers':True,'identicalSceneActivationEstablished':False,'differentCompanionGlobalWrites':True}

for pas,slug,grp in PASS:
 results=[resource(x) for x in grp] if grp else []
 data={'pass':pas,'format':'mk2_o98p_o99i_20pass_verified_8byte_graphics_v1','status':'SOURCE_ANALYSIS','topic':slug,
 'fixtureExeSha256':sha(e),'sourceQualifiedResourceListHash':previous['coverage']['qualifiedResourceListSha256'] if 'coverage' in previous else None,
 'resourceEvidence':results,'cursorEvidence':cursor() if pas=='O98P' else None,
 'boundaries':{'onlyStaticGraphicsAndCode':True,'runtimeActivationVerified':False,'paletteHandleOwnershipVerified':False,'fullyRenderedSceneVerified':False,'temporalUnitsVerified':False},
 'hypothesisClassification':'SUPPORTED_STRUCTURAL' if results or pas=='O98P' else 'UNRESOLVED'}
 (out/f'mk2_{pas.lower()}_{slug}_2026-10-09.json').write_text(json.dumps(data,indent=2)+'\n')
 print(json.dumps({'pass':pas,'resources':','.join(x['resource'] for x in results),'records':sum(x['descriptorCount'] for x in results),'exactFull':[x['resource'] for x in results if x['classification'].startswith('EXACT_FULL')],'status':'PRODUCED'}))
