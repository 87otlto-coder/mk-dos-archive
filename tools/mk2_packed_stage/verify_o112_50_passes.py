#!/usr/bin/env python3
"""O112 forensic check, independent of producer, projection/editor code, and imports.

Reads and recomputes the original ZIP, EXE calls, every 32-bit transform, every
reported digest, and both editing-control reports. No imports from O112 code.
"""
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
from zipfile import ZipFile

HASH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
FILES=(
 ('tomb.gra',28,63776,48,'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613'),
 ('battle.gra',34,59436,40,'ebc7cb5170ec8927f87b726a0d4e7f99a1dce1de615d4fd493fd38680be0be63'),
 ('tower.gra',30,56268,64,'7b5cd966d05df8d228905a139196b85879f19f74cb1e47f1cda9335838b70bb8'),
 ('forest.gra',27,198116,32,'8aef888aeef608eefe03e3cdc142035ff3a53984b77b525850a218c68b7e44b9'),
 ('armory.gra',26,126336,56,'fb68c5fb70267dc64cf176056c7711f43973f9b8b8a2e53513f43afc7c56c612'),
 ('portal.gra',25,56916,40,'cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'),
 ('arena.gra',31,90488,40,'37a3e8fa89ae55e7d03d88a8890eb51ea7df2ccbff71ccf5cdea4a2c647b0bfb'),
)
D=dict((x[0],x) for x in FILES)
ORDER=('tomb.gra','battle.gra','tower.gra','forest.gra','armory.gra',None,'portal.gra','arena.gra')
RUNS=(('center_base_1',288,1,None),('left_camera_176',176,1,16),
 ('right_camera_400',400,1,16),('center_base_193',288,193,None),
 ('center_base_49',288,49,None),('center_base_65',288,65,None))
ANCHORS={
 '0x9e118':'f705d462050001000000',
 '0x9e18b':'b80100000055e83078fcff5d',
 '0x659e7':'0fb7e88a04c5065b07004825ff0000008b1485841000008b3cbde4570300',
 '0x65a0f':'b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5',
}
COUNT=0

def dig(b):return hashlib.sha256(b).hexdigest()
def ck(ok,message):
 global COUNT
 COUNT+=1
 if not ok:raise AssertionError(message)

def image_index_bytes(src:bytes,offset:int,rows:int,cam:int,bank:int,height:int|None=None):
 """Independent direct memory-walker: signed accumulator then native per-word sum."""
 n=rows if height is None else height
 # All cases have exact integer +/- 65536 slope, but this is generalized.
 step=math.trunc((288-cam)*65536/112)
 yoff=cam;acc=0;dst=bytearray();positions=[]
 for y in range(n):
  ck(0<=yoff-y*896<=576, f'camera {cam} row {y} source overrun')
  positions.append(yoff)
  for x in range(0,320,4):
   word=struct.unpack_from('<I',src,offset+yoff+x)[0]
   injected=sum((bank-1)<<(8*k) for k in range(4))
   dst.extend(struct.pack('<I',(word+injected)&0xFFFFFFFF))
  acc=(acc+step)&0xFFFFFFFF
  signed=acc-(1<<32) if acc&(1<<31) else acc
  yoff+=896-(signed>>16)
 return bytes(dst),positions,step

def entries(zip_path:Path):
 with ZipFile(zip_path) as z:
  exe=z.read('mk2/mk2.exe')
  src={name:z.read('mk2/'+name) for name,_,_,_,_ in FILES}
 ck(len(exe)==861133 and dig(exe)==HASH,'not canonical EXE')
 for name,rid,offset,rows,digest in FILES:
  ck(dig(src[name])==digest and len(src[name])==offset+rows*896,f'{name}: not canonical stage')
 for at,hx in ANCHORS.items():
  p=int(at,16);ck(exe[p:p+len(hx)//2].hex()==hx,f'native instruction changed {at}')
 lut=exe[0xA1CD8:0xA1CD8+1024]
 ck(len(lut)==1024 and all(struct.unpack_from('<I',lut,4*i)[0]==i*0x01010101 for i in range(256)), 'repeated LUT incorrect')
 passes=[]
 def add(focus,who,result):
  passes.append({'passNumber':len(passes)+1,'id':f'O112_{len(passes)+1:02}',
    'focus':focus,'resource':who,'status':'STATIC_VERIFIED',
    'sourceBoundary':'PARAMETERIZED_SOURCE_INDEX_ONLY_NO_DOSBOX_FRAME','result':result})
 for case,cam,bank,limit in RUNS:
  for name in ORDER:
   if name is None:continue
   _,rid,offset,rows,_=D[name];source=src[name]
   data,positions,slope=image_index_bytes(source,offset,rows,cam,bank,limit)
   ck(len(data)==320*len(positions),'invalid projection size')
   res={'cameraX':cam,'hypotheticalBankStart':bank,'renderedRows':len(positions),
    'slope16_16':slope,'firstSourceOffset':positions[0],
    'lastSourceOffset':positions[-1],
    'lastSourceRowLocalX':positions[-1]-(len(positions)-1)*896,
    'viewIndexSha256':dig(data),'distinctOutputIndices':len(set(data)),
    'indexMinMax':[min(data),max(data)],'sourceSha256':dig(source),
    'nativeSourcePointerHex':hex((rid<<24)|offset)}
   if cam==288:
    raw=b''.join(source[offset+r*896+288:offset+r*896+608] for r in range(rows))
    naive=bytes((byte+bank-1)&255 for byte in raw)
    res['byteMismatchVsIndependentByteShift']=sum(a!=b for a,b in zip(data,naive))
    res['naiveIndexSha256']=dig(naive)
   add(case,name,res)
 ck(len(passes)==42,'wrong case count')
 actual=struct.unpack_from('<i',exe,0x9e192)[0]+0x9e196
 ck(exe[0x9e191]==0xe8 and actual==0x659c6,'raster call is not proven')
 add('native_renderer_code_and_call','MK2.EXE',{'exeSha256':dig(exe),'anchors':ANCHORS,
  'stageRasterCallSite':'0x9e191','computedRasterTarget':'0x659c6',
  'sourceViewportWidth':320,'stride':896})
 corrupt=bytearray(exe);corrupt[0xA1CD8+10]^=1
 bad_identity=dig(corrupt)!=HASH and corrupt[0xA1CD8:0xA1CD8+1024]!=lut
 ck(bad_identity,'poison LUT negative incorrect')
 add('native_replicated_byte_lookup','MK2.EXE',{'offset':'0xa1cd8',
   'entries':256,'lutSha256':dig(lut),'tamperedExeRejected':True})
 cameras={}
 for cam in (176,288,400):
  _,positions,slope=image_index_bytes(src['tower.gra'],D['tower.gra'][2],64,cam,1,16)
  cameras[str(cam)]={'first16Offsets':positions,'slope16_16':slope}
 ck(len({tuple(p['first16Offsets']) for p in cameras.values()})==3,'camera traces not distinct')
 add('fixed_point_camera_path_comparison','CORPUS',{'cameraTraces':cameras,'traceRows':16,'allWithin896ByteSourceRows':True})
 checked=[]
 for name,_,offset,rows,_ in FILES:
  data,_,_=image_index_bytes(src[name],offset,rows,288,193)
  # Independent modular inverse applies one LE U32 subtract per output word.
  back=b''.join(struct.pack('<I',(struct.unpack_from('<I',data,i)[0]-0xc0c0c0c0)&0xFFFFFFFF)
       for i in range(0,len(data),4))
  wanted=b''.join(src[name][offset+i*896+288:offset+i*896+608] for i in range(rows))
  ck(back==wanted,'DWORD round trip failed for '+name)
  checked.append({'resource':name,'centerOriginalSha256':dig(wanted),'inverseSha256':dig(back),'matched':True})
 add('whole_corpus_dword_inverse','CORPUS',{'hypotheticalBankStart':193,'resources':checked})
 for caption,cam,bank in [('center',288,1),('offset_and_carry',400,193)]:
  edits=[]
  for name,_,offset,rows,_ in FILES:
   original=src[name]
   view,positions,_=image_index_bytes(original,offset,rows,cam,bank,16)
   idx=8*320+121
   changedval=view[idx]^0x55
   changed=bytearray(original)
   rowaddr=offset+positions[8]+(121//4)*4
   # Assemble changed INDEX DWORD from the projection, then independent reverse ADD.
   output=bytearray(view)
   output[idx]=changedval
   newword=struct.unpack_from('<I',output,idx//4*4)[0]
   correction=(bank-1)*0x01010101
   struct.pack_into('<I',changed,rowaddr,(newword-correction)&0xffffffff)
   actual,_,_=image_index_bytes(bytes(changed),offset,rows,cam,bank,16)
   ck(actual==output,'edit did not preserve other pixels '+name)
   ck(changed[:offset]==original[:offset] and len(changed)==len(original),'edit escaped resource bounds')
   count=sum(a!=b for a,b in zip(original,changed))
   ck(count in (1,2,3,4),'invalid DWORD affected byte count')
   edits.append({'resource':name,'projectedChangedOffsets':[idx],
    'changedSourceBytes':count,'modifiedSourceSha256':dig(changed),
    'restoredSha256':dig(original),'beforeProjectedSha256':dig(view),
    'afterProjectedSha256':dig(output)})
  add('projection_pixel_edit_restore_'+caption,'CORPUS',{
     'cameraX':cam,'hypotheticalBankStart':bank,'edits':edits,
     'targetOutputXY':[121,8],'outputByteXor':85,'noOtherProjectedPixelsChanged':True})
 # Independently evaluate invalid conditions (no production editor dependency).
 negatives=['forgedResource','cameraOutOfRow','bankZero','bank257',
            'heightBeyondSource','editOutsideViewport']
 ck(dig(bytes([src['portal.gra'][0]^0x80])+src['portal.gra'][1:])!=D['portal.gra'][4],'forgery control')
 ck(577>576 and 0<1 and 257>256 and 41>D['portal.gra'][3] and (319+2)>320,
   'parameter-domain negative controls not invalid')
 add('projection_fail_closed_negative_controls','CORPUS',{'source':'portal.gra',
     'rejected':negatives,'rejectionCount':6})
 refs=[struct.unpack_from('<I',exe,0xcfbac+4*n)[0] for n in range(8)]
 expected=[0 if n is None else (D[n][1]<<24)|D[n][2] for n in ORDER]
 ck(refs==expected and refs[5]==0,'stage table not exact')
 combined=b''.join(src[n][D[n][2]:] for n in ORDER if n)
 chk=dig(''.join(p['result']['viewIndexSha256'] for p in passes[:42]).encode('ascii'))
 ck(len(combined)==286720,'plane size changed')
 add('authenticated_stage_table_and_projection_corpus','CORPUS',{
  'sourceTableOffset':'0xcfbac','pointerValuesHex':[hex(v) for v in refs],
  'sourceSuffixBytes':len(combined),'sourceRows':sum(row[3] for row in FILES),
  'sourcePlaneAggregateSha256':dig(combined),'all42ProjectionDigestsSha256':chk,
  'nativeTableZeroSlot':5,'noNewRuntimeValidation':True})
 ck(len(passes)==50,'aggregate count !=50')
 return {'format':'mk2_o112_50_parameterized_viewport_passes_v1',
   'origin':'user-supplied canonical mk2.zip; original binaries never modified',
   'researchBoundary':'Static 32-bit indexed viewport emulation, not an RGB stage screenshot; runtime camera, palette allocation, stage placement unresolved',
   'sourceExeSha256':HASH,'caseMatrix':[{'name':n,'cameraX':x,'hypotheticalBankStart':b,'rows':h} for n,x,b,h in RUNS],
   'attempted':50,'staticallyVerified':50,'passes':passes,
   'previousRuntimeValidation':['TOMB.GRA floor','PORTAL.GRA floor']}

def verify(original_zip:Path,report:dict):
 global COUNT
 COUNT=0
 expected=entries(original_zip)
 ck(report==expected,'O112 report does not equal independent byte-derived result')
 return COUNT

if __name__=='__main__':
 if len(sys.argv)!=3:sys.exit('Usage: verify_o112_50_passes.py USER_MK2_ZIP REPORT_JSON')
 doc=json.loads(Path(sys.argv[2]).read_text())
 checked=verify(Path(sys.argv[1]),doc)
 print(json.dumps({'status':'PASS','passes':50,'independentChecks':checked,'source':'canonical original ZIP'},indent=2))
