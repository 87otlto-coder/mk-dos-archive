#!/usr/bin/env python3
"""O118: exact, independent MK2.EXE palette source records tied to O115 gameplay witness.

Original DOS VGA packed words -> DAC6 via O71/O110E verified code. 6bit -> 8bit
uses bit replication (v<<2 | v>>4), as independently observed in screenshots.
Two 80-color records match all witnessed stage-floor source indices. It does NOT
establish when those records are allocated, which handle owns them, nor palette0.
No original game data is bundled. Read-only; outputs are exclusive new files.
"""
from __future__ import annotations
import argparse,csv,hashlib,json,struct,sys
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'mk2_packed_stage'))
from mk2_packed_stage import resource_identity,sha,write_new,QualificationError,STRIDE,VIEWPORT
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
RECORDS={
 'tomb':dict(offset=0x893c6,count=80,firstIndex=1,minimumWitness=2,maximumWitness=51,source='tomb.gra',cameraCropDemo=290),
 'portal':dict(offset=0x891e0,count=80,firstIndex=1,minimumWitness=3,maximumWitness=80,source='portal.gra',cameraCropDemo=292),
}
# Comparison-only alternatives; not the selected native source records.
ALTERNATIVES={'tomb':dict(offset=0x8cdbe,count=79,firstIndex=2),
              'portal':dict(offset=0x8cd1e,count=79,firstIndex=2)}

def require(ok,msg):
 if not ok:raise QualificationError('O118: '+msg)

def authenticate_exe(exe:bytes):require(len(exe)==861133 and sha(exe)==EXE_SHA,'incorrect original MK2.EXE')

def decode_word(w:int):
 dac=(((w>>9)&63)|1,((w>>4)&63)|1,((w<<1)&63)|1)
 return tuple((v<<2)|(v>>4) for v in dac)

def decode_record(exe:bytes,offset:int,count:int,first_index:int)->dict[int,tuple[int,int,int]]:
 require(offset>=0 and offset+2+count*2<=len(exe),'palette record outside EXE')
 require(struct.unpack_from('<H',exe,offset)[0]==count,'original palette record header differs')
 return {first_index+i:decode_word(struct.unpack_from('<H',exe,offset+2+2*i)[0]) for i in range(count)}

def source_palette(exe:bytes,stage:str)->dict[int,tuple[int,int,int]]:
 require(stage in RECORDS,'only screenshot-tested stages are qualified')
 authenticate_exe(exe)
 s=RECORDS[stage]
 return decode_record(exe,s['offset'],s['count'],s['firstIndex'])

def read_witness(csv_text:str):
 rr=list(csv.DictReader(csv_text.splitlines())); require(len(rr)==128,'O115 color CSV must contain 128 mappings')
 witnesses={'tomb':{},'portal':{}}
 for r in rr:
  stage={'Kombat Tomb':'tomb','The Portal':'portal'}.get(r['stage'])
  require(stage is not None,'unexpected witness stage')
  k=int(r['original_source_index_byte']);rgb=tuple(int(r['observed_RGB_'+v]) for v in 'RGB')
  require(k not in witnesses[stage] and all(0<=c<=255 for c in rgb),'repeated/bad witness color')
  witnesses[stage][k]=rgb
 for stage,s in RECORDS.items():
  require(set(witnesses[stage])==set(range(s['minimumWitness'],s['maximumWitness']+1)),stage+' source index witness domain mismatch')
 return witnesses

def qualified_le_object1_fixups(exe:bytes):
 """Follow O110F-authenticated LE relocation grammar; only typed object-1 exact pointers."""
 LE=0x28f0c;BASE=0x61c54
 require(struct.unpack_from('<I',exe,LE+0x14)[0]==113,'LE source-page count mismatch')
 table=LE+struct.unpack_from('<I',exe,LE+0x68)[0]
 block=LE+struct.unpack_from('<I',exe,LE+0x6c)[0]
 candidates={s['offset']-BASE:stage for stage,s in RECORDS.items()}
 candidates.update({v['offset']-BASE:stage+'_79_alternative' for stage,v in ALTERNATIVES.items()})
 refs={label:[] for label in candidates.values()};seen=0
 for page in range(113):
  pos=block+struct.unpack_from('<I',exe,table+4*page)[0]
  end=block+struct.unpack_from('<I',exe,table+4*(page+1))[0]
  while pos<end:
   kind=exe[pos]&15;flags=exe[pos+1];relative=struct.unpack_from('<h',exe,pos+2)[0];pos+=4
   require(flags&3==0,'unexpected LE fixup flag')
   ob=struct.unpack_from('<H',exe,pos)[0] if flags&64 else exe[pos]
   pos+=2 if flags&64 else 1
   target=None
   if kind!=2:
    target=struct.unpack_from('<I' if flags&16 else '<H',exe,pos)[0]
    pos+=4 if flags&16 else 2
   if flags&4:pos+=4 if flags&32 else 2
   if kind==7 and ob==1 and target in candidates:
    refs[candidates[target]].append(BASE+4096*page+relative)
   seen+=1
  require(pos==end,'LE page fixup boundary mismatch')
 require(seen==27004,'LE fixup census changed')
 return {k:sorted(v) for k,v in refs.items()}

def full_report(exe:bytes,witness_csv:str):
 authenticate_exe(exe)
 witnesses=read_witness(witness_csv)
 records={};total=0
 fixup_refs=qualified_le_object1_fixups(exe)
 for stage,s in RECORDS.items():
  rgb=source_palette(exe,stage);matches=[];parts=[]
  for k,expected in sorted(witnesses[stage].items()):
   actual=rgb[k];parts.append(bytes(actual))
   require(actual==expected,f'{stage} index {k}: original EXE record disagrees with screenshot')
   matches.append({'sourceIndex':k,'wordOffset':s['offset']+2+2*(k-s['firstIndex']),
                   'originalWordHex':f'{struct.unpack_from("<H",exe,s["offset"]+2+2*(k-s["firstIndex"]))[0]:04x}',
                   'dac6':list((((struct.unpack_from("<H",exe,s['offset']+2+2*(k-s['firstIndex']))[0]>>9)&63)|1,
                                  ((struct.unpack_from("<H",exe,s['offset']+2+2*(k-s['firstIndex']))[0]>>4)&63)|1,
                                  ((struct.unpack_from("<H",exe,s['offset']+2+2*(k-s['firstIndex']))[0]<<1)&63)|1)),
                   'sourceRGB8':list(actual),'o115ObservedRGB8':list(expected)})
  alt=ALTERNATIVES[stage]
  alt_colors=decode_record(exe,alt['offset'],alt['count'],alt['firstIndex'])
  alt_matches=[k for k,v in witnesses[stage].items() if alt_colors.get(k)==v]
  records[stage]={
   'leTypedRelocationSitesFor80ColorRecord':fixup_refs[stage],
   'leTypedRelocationSitesFor79ColorAlternative':fixup_refs[stage+'_79_alternative'],
   'countedPaletteRecordPhysical':s['offset'], 'recordCount':s['count'],
   'firstColorWordPhysical':s['offset']+2,'sourceIndexToRecordSlot':'sourceIndex-1',
   'qualifiedSourceIndices':[s['minimumWitness'],s['maximumWitness']],
   'matchingScreenshotIndices':len(matches),'witnesses':matches,
   'originalFull80ColorWordsSHA256':sha(exe[s['offset']+2:s['offset']+162]),
   'consecutiveWitnessRGBSHA256':sha(b''.join(parts)),
   'alternate79ColorRecordPhysical':alt['offset'],
   'alternate79ColorRecordMatches':len(alt_matches),
   'alternate79MismatchedIndices':sorted(set(witnesses[stage])-set(alt_matches))}
  total+=len(matches)
 require(total==128,'all 128 screenshot witnesses are required')
 return {'format':'mk2_o118_exe_native_stage_palette_witness_bridge_v1',
         'qualification':'STATIC_COUNTED_PALETTE_RECORD_PLUS_RUNTIME_RGB_WITNESS_NOT_RUNTIME_ALLOCATOR_HANDLE',
         'exeSHA256':sha(exe),'witnessCSV_SHA256':sha(witness_csv.encode()),
         'hardwarePaletteCodePhysical':0x7b3b1,
         'sourcePackedDAC6Formula':['((word >> 9) & 63) | 1','((word >> 4) & 63) | 1','((word << 1) & 63) | 1'],
         'screenshotExpansion6to8':'(channel6 << 2) | (channel6 >> 4)',
         'witnessedMatches':total,'records':records,'typedObject1FixupSitesTotal':sum(len(v) for v in fixup_refs.values()),
         'limits':['No observed runtime handle assignment or palette bank start index',
                   'O71/O110E physical palette writer formula is source-backed; screenshot expansion is emulator observation',
                   'Index0 never mapped and is not inferred from these records',
                   'Unwitnessed colors in 80-entry records are STATIC candidates, not gameplay-verified',
                   'Screenshot crop offsets are not camera RAM variables',
                   'A 79-entry matching alternative exists; color correspondence alone is not record ownership proof']}

def render_original_floor(exe:bytes,gra:bytes,stage:str,left:int,first_row:int=0,height:int|None=None):
 s=RECORDS[stage];_,_,start,rows=resource_identity(s['source'],gra)
 colors=source_palette(exe,stage)
 require(type(left)==int and 0<=left<=STRIDE-VIEWPORT,'source column outside packed source rows')
 require(type(first_row)==int and 0<=first_row<rows,'first row invalid')
 if height is None:height=rows-first_row
 require(type(height)==int and 0<height<=rows-first_row,'height invalid')
 out=bytearray()
 for y in range(first_row,first_row+height):
  data=gra[start+y*STRIDE+left:start+y*STRIDE+left+VIEWPORT]
  for idx in data:
   require(idx in colors,'floor byte outside canonical counted EXE palette record')
   out.extend(colors[idx]);out.append(255)
 return bytes(out),height

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--exe',type=Path,required=True)
 p.add_argument('--witness-csv',type=Path,required=True)
 p.add_argument('--report',type=Path,required=True)
 p.add_argument('--stage',choices=['tomb','portal'])
 p.add_argument('--gra',type=Path)
 p.add_argument('--png',type=Path)
 p.add_argument('--source-left',type=int)
 args=p.parse_args()
 require(not args.report.exists(),'refusing to overwrite existing output report')
 exe=args.exe.read_bytes();report=full_report(exe,args.witness_csv.read_bytes().decode('utf-8'))
 if args.stage is not None:
  require(args.gra is not None and args.png is not None and args.source_left is not None,'preview requires --gra --png and --source-left')
  require(not args.png.exists() and args.png.resolve()!=args.report.resolve(),'refusing to overwrite PNG/report')
  rgba,h=render_original_floor(exe,args.gra.read_bytes(),args.stage,args.source_left)
  import io
  out=io.BytesIO();Image.frombytes('RGBA',(320,h),rgba).save(out,'PNG')
  write_new(args.png,out.getvalue())
  report['optionalPreview']={'stage':args.stage,'fixedSourceLeft':args.source_left,'sourceGRA_SHA256':sha(args.gra.read_bytes()),'rgbaSHA256':sha(rgba),'pngSHA256':sha(out.getvalue()),'height':h,'stillFloorOnly':True}
 write_new(args.report,(json.dumps(report,indent=2)+'\n').encode())
 print(json.dumps({'status':'PASS','witnesses':report['witnessedMatches'],'records':{k:(v['countedPaletteRecordPhysical'],v['matchingScreenshotIndices']) for k,v in report['records'].items()},'qualifier':report['qualification']},indent=2))
if __name__=='__main__':main()
