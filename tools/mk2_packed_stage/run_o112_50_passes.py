#!/usr/bin/env python3
"""O112: 50 bounded, static, independently checkable viewport experiments.

Six different read/transform cases on seven original resources (42), plus
8 aggregate code/edge/inverse/edit-control investigations. No DOSBox runtime.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from zipfile import ZipFile
from mk2_packed_stage import (RESOURCES, TABLE_NAMES, STAGE_TABLE_OFFSET, STRIDE,
  LEFT_MARGIN, VIEWPORT, EXE_SHA, sha, restore, QualificationError)
from mk2_stage_projection import (project_source,project_plane,edit_projected,verify_exe,
 camera_positions, BANK_LOOKUP_PHYSICAL, ANCHORS)

CASES=[('center_base_1',288,1,None),('left_camera_176',176,1,16),
       ('right_camera_400',400,1,16),('center_base_193',288,193,None),
       ('center_base_49',288,49,None),('center_base_65',288,65,None)]

def run(fixture:Path):
 with ZipFile(fixture) as z:
  game={n:z.read('mk2/'+n) for n in RESOURCES}
  exe=z.read('mk2/mk2.exe')
 verify_exe(exe)
 passes=[]
 def emit(focus,resource,data):
  passes.append({'passNumber':len(passes)+1,'id':f'O112_{len(passes)+1:02}',
     'focus':focus,'resource':resource,'status':'STATIC_VERIFIED',
     'sourceBoundary':'PARAMETERIZED_SOURCE_INDEX_ONLY_NO_DOSBOX_FRAME',
     'result':data})
 for tag,cam,bank,height in CASES:
  for name in TABLE_NAMES:
   if name is None:continue
   src=game[name];rid,offset,rows,_=RESOURCES[name]
   view=project_source(name,src,camera_x=cam,bank_start=bank,height=height,exe=exe)
   raw=src[offset:]
   if tag=='center_base_1':
    expected=b''.join(raw[r*STRIDE+288:r*STRIDE+608] for r in range(rows))
    assert expected==view.data
   if tag in ('left_camera_176','right_camera_400'):
    assert view.height==16 and len(set(view.source_offsets))==16
   if tag=='center_base_193':
    assert view.height==rows
   output={'cameraX':cam,'hypotheticalBankStart':bank,'renderedRows':view.height,
      'slope16_16':view.slope_16_16,'firstSourceOffset':view.source_offsets[0],
      'lastSourceOffset':view.source_offsets[-1],
      'lastSourceRowLocalX':view.source_offsets[-1]-(view.height-1)*STRIDE,
      'viewIndexSha256':sha(view.data),'distinctOutputIndices':len(set(view.data)),
      'indexMinMax':[min(view.data),max(view.data)],
      'sourceSha256':sha(src),'nativeSourcePointerHex':hex((rid<<24)|offset)}
   if cam==288:
    base=bank-1
    raw_center=b''.join(raw[r*STRIDE+288:r*STRIDE+608] for r in range(rows))
    naive=bytes(((v+base)&255) for v in raw_center)
    output['byteMismatchVsIndependentByteShift']=sum(a!=b for a,b in zip(view.data,naive))
    output['naiveIndexSha256']=sha(naive)
   emit(tag,name,output)
 assert len(passes)==42
 # 43: verify actual instruction boundaries/dispatch targets, not just offsets.
 disp=struct.unpack_from('<i',exe,0x9e192)[0]
 assert exe[0x9e191]==0xe8 and 0x9e196+disp==0x659c6
 emit('native_renderer_code_and_call','MK2.EXE',{'exeSha256':sha(exe),
  'anchors':{hex(a):v for a,v in ANCHORS.items()},'stageRasterCallSite':'0x9e191',
  'computedRasterTarget':'0x659c6','sourceViewportWidth':320,'stride':896})
 # 44: exhaustive repeated byte LUT witness plus corrupted code identity negative.
 lut=exe[BANK_LOOKUP_PHYSICAL:BANK_LOOKUP_PHYSICAL+1024]
 assert lut==b''.join(struct.pack('<I',i*0x01010101) for i in range(256))
 poison=bytearray(exe);poison[BANK_LOOKUP_PHYSICAL+10]^=1
 try:verify_exe(bytes(poison))
 except QualificationError: rejected=True
 else:raise AssertionError('poisoned LUT source accepted')
 emit('native_replicated_byte_lookup','MK2.EXE',{'offset':'0xa1cd8',
     'entries':256,'lutSha256':sha(lut),'tamperedExeRejected':rejected})
 # 45: exact signed fixed-point camera cursor trajectories, not simple linear shift.
 c={str(cam):{'first16Offsets':list(camera_positions(64,cam,16)[0]),
              'slope16_16':camera_positions(64,cam,16)[1]} for cam in (176,288,400)}
 assert len({tuple(v['first16Offsets']) for v in c.values()})==3
 emit('fixed_point_camera_path_comparison','CORPUS',{'cameraTraces':c,'traceRows':16,
      'allWithin896ByteSourceRows':True})
 # 46: full 7 × 320-row inverse DWORD recoverability at hypothetical 193.
 all_recovered=[]
 for name in RESOURCES:
  src=game[name];off=RESOURCES[name][1];rows=RESOURCES[name][2]
  projected=project_source(name,src,camera_x=288,bank_start=193)
  correction=(192*0x01010101)&0xffffffff
  recovered=b''.join(((int.from_bytes(projected.data[i:i+4],'little')-correction)&0xffffffff).to_bytes(4,'little')
                      for i in range(0,len(projected.data),4))
  raw=b''.join(src[off+r*896+288:off+r*896+608] for r in range(rows))
  assert recovered==raw
  all_recovered.append({'resource':name,'centerOriginalSha256':sha(raw),'inverseSha256':sha(recovered),'matched':True})
 emit('whole_corpus_dword_inverse','CORPUS',{'hypotheticalBankStart':193,
    'resources':all_recovered})
 # 47: centered viewport edits using bank 1, reversible exact with no collateral.
 for row_tag,cam,bank in [('center',288,1),('offset_and_carry',400,193)]:
  edits=[]
  for name in RESOURCES:
   src=game[name];before=project_source(name,src,camera_x=cam,bank_start=bank,height=16)
   idx=8*320+121;new=before.data[idx]^0x55
   patched,receipt,previous,updated=edit_projected(name,src,camera_x=cam,
    bank_start=bank,x=121,y=8,width=1,height=1,new_index=new,projection_height=16)
   diffs=[i for i,(a,b) in enumerate(zip(before.data,updated.data)) if a!=b]
   assert diffs==[idx] and patched[:RESOURCES[name][1]]==src[:RESOURCES[name][1]]
   assert restore(name,patched,receipt)==src
   edits.append({'resource':name,'projectedChangedOffsets':diffs,
      'changedSourceBytes':receipt['changedCount'],
      'modifiedSourceSha256':sha(patched),'restoredSha256':sha(src),
      'beforeProjectedSha256':sha(before.data),'afterProjectedSha256':sha(updated.data)})
  emit('projection_pixel_edit_restore_'+row_tag,'CORPUS',{
    'cameraX':cam,'hypotheticalBankStart':bank,'edits':edits,
    'targetOutputXY':[121,8], 'outputByteXor':0x55,'noOtherProjectedPixelsChanged':True})
 # 49: refuse poisoned canonical source, impossible width, invalid bank and altered receipts.
 negatives=[]
 nm='portal.gra';src=game[nm];wrong=bytearray(src);wrong[0]^=0x80
 cases=[('forgedResource',lambda:project_source(nm,bytes(wrong))),
        ('cameraOutOfRow',lambda:project_source(nm,src,camera_x=577)),
        ('bankZero',lambda:project_source(nm,src,bank_start=0)),
        ('bank257',lambda:project_source(nm,src,bank_start=257)),
        ('heightBeyondSource',lambda:project_source(nm,src,height=41)),
        ('editOutsideViewport',lambda:edit_projected(nm,src,camera_x=288,bank_start=1,x=319,y=0,width=2,height=1,new_index=2))]
 for title,operation in cases:
  try:operation()
  except QualificationError:negatives.append(title)
  else:raise AssertionError('negative accepted: '+title)
 assert len(negatives)==6
 emit('projection_fail_closed_negative_controls','CORPUS',{'source':nm,
    'rejected':negatives,'rejectionCount':len(negatives)})
 # 50: sum authoritative source references + 42 view hashes; check zero entry.
 refs=[struct.unpack_from('<I',exe,STAGE_TABLE_OFFSET+4*i)[0] for i in range(8)]
 expected=[0 if name is None else (RESOURCES[name][0]<<24)|RESOURCES[name][1] for name in TABLE_NAMES]
 assert refs==expected and refs[5]==0
 data=b''.join(game[name][RESOURCES[name][1]:] for name in TABLE_NAMES if name)
 agg=''.join(p['result']['viewIndexSha256'] for p in passes[:42]).encode('ascii')
 emit('authenticated_stage_table_and_projection_corpus','CORPUS',{
   'sourceTableOffset':'0xcfbac','pointerValuesHex':[hex(v) for v in refs],
   'sourceSuffixBytes':len(data),'sourceRows':sum(RESOURCES[n][2] for n in RESOURCES),
   'sourcePlaneAggregateSha256':sha(data),'all42ProjectionDigestsSha256':sha(agg),
   'nativeTableZeroSlot':5,'noNewRuntimeValidation':True})
 assert len(passes)==50
 return {'format':'mk2_o112_50_parameterized_viewport_passes_v1',
   'origin':'user-supplied canonical mk2.zip; original binaries never modified',
   'researchBoundary':'Static 32-bit indexed viewport emulation, not an RGB stage screenshot; runtime camera, palette allocation, stage placement unresolved',
   'sourceExeSha256':EXE_SHA,'caseMatrix':[{'name':n,'cameraX':x,'hypotheticalBankStart':b,'rows':h} for n,x,b,h in CASES],
   'attempted':50,'staticallyVerified':50,'passes':passes,
   'previousRuntimeValidation':['TOMB.GRA floor','PORTAL.GRA floor']}

if __name__=='__main__':
 if len(sys.argv)!=3:sys.exit('Usage: run_o112_50_passes.py USER_MK2_ZIP NEW_REPORT_JSON')
 dest=Path(sys.argv[2]);assert not dest.exists(),'refusing to overwrite evidence'
 report=run(Path(sys.argv[1]));dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(json.dumps(report,indent=2)+'\n')
 print('O112 static passes:',report['staticallyVerified'],'/',report['attempted'],'Report:',dest)
