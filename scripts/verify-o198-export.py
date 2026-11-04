#!/usr/bin/env python3
"""Independent O198 Forest static mode/root graph verifier using original LE fixups.
Does not use the TS producer. Independently re-decodes all exported indices/masks/PNGs.
"""
import hashlib,importlib.util,json,struct,sys,zipfile
from pathlib import Path
PROJECT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(PROJECT/'tools/mk2_native_stage_palettes'))
from verify_o120_independent import parse_fixups
import importlib.machinery
mod=importlib.machinery.SourceFileLoader('o197verifier',str(PROJECT/'scripts/verify-o197-export.py')).load_module()
BASE=0xa0c54; EXE_SHA=mod.SHA_EXE; GRA_SHA=mod.SHA_GRA
TABLES={'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
ROOTS={'mode_equals_2':(0x16b56,0x16bda,0x54,0x80,[0x28,0x30,0x3c,0x44,0x4c],[0x58,0x60,0x68,0x70,0x78]),
       'mode_equals_1':(0x16bda,0x16c46,0x4c,0x68,[0x28,0x30,0x44],[0x50,0x58,0x60]),
       'mode_other':(0x16c46,0x16cb2,0x4c,0x68,[0x28,0x30,0x44],[0x50,0x58,0x60])}
SETUPS=[0x16f8c,0x16f9e,0x16fb0,0x16fc2,0x16fd4]
FIXED=[0x40000,0x20000,0x300000,0x360000,0x480000]
ACC=[0x84324,0x84320,0x84318,0x84314,0x84310]
def sha(b):return hashlib.sha256(b).hexdigest()
def ck(c,m):
 if not c:raise AssertionError('O198 independent audit: '+m)
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def typed(b,fx,offset,target):
 ck(fx.get((2,offset))==(7,16,2,target),'typed pointer at '+hex(offset))
 ck(u32(b,BASE+offset)==target,'raw dword pointer at '+hex(offset))
def source(path,stem):
 return next(p.read_bytes() for p in (path/stem.lower(),path/stem.upper()) if p.exists())
def audit(game,zip_path):
 exe=source(game,'MK2.EXE');gra=source(game,'FOREST.GRA')
 ck(len(exe)==861133 and sha(exe)==EXE_SHA,'MK2.EXE identity');ck(len(gra)==226788 and sha(gra)==GRA_SHA,'FOREST.GRA identity')
 fx,total=parse_fixups(exe);ck(total==27004,'LE original fixup count')
 with zipfile.ZipFile(zip_path) as z:
  ck(z.testzip() is None,'ZIP integrity');ck(len(z.namelist())==24,'24 export members')
  m=json.loads(z.read('MANIFEST.json'));g=json.loads(z.read('evidence/conditional_root_ownership.json'))
  ck(m['format']=='mkdos_o198_forest_conditional_setup_graph_v1','schema')
  ck(m['status']=='verified-static-mode-root-graph-not-runtime-composition' and m['sourceGameFilesBundled'] is False,'scope')
  ck(m['original']['exeSHA256']==EXE_SHA and m['original']['forestSHA256']==GRA_SHA,'source hashes')
  ck(g['sourceReferences']['runtimeModeObserved'] is False and g['sourceReferences']['stageIndex']==4,'runtime mode limitation')
  words=[struct.unpack_from('<i',exe,BASE+0x16cb2+4*j)[0] for j in range(9)]
  ck(words==[0,49152,61440,73728,73728,98304,98304,98304,0],'original nine motion words')
  ck(g['sourceReferences']['originalMotionWords']==words,'exported motion words')
  ck(g['sourceReferences']['originalPositiveStreamChannelIndices']==[0,1,2,3,4,5,7,7,7],'Forest original positive-stream channels')
  ck(exe[0x9358c:0x935a8].hex()=='8b3183c104668b36668935685a0700890d985a07008be8e8e8fdffff','original high-word consumer opcode')
  selected_counts=[];ptr_checks=0
  for name,table in TABLES.items():
   root,end,sep,term,static,accum=ROOTS[name];mode=next(x for x in g['modes'] if x['mode']==name)
   selected=[1,2,3,4,5] if name=='mode_equals_2' else [1,2,5];selected_counts.append(len(selected))
   typed(exe,fx,table+4*4,root);ptr_checks+=1
   ck(mode['rootObject2']==root and mode['rootPhysical']==BASE+root and mode['rootEndExclusive']==BASE+end,'root bounds')
   ck(mode['rootByteSHA256']==sha(exe[BASE+root:BASE+end]),'full original root fingerprint')
   ck(mode['rootTableEntryObject2']==table+16,'dispatch slot source')
   ck(mode['selectedVariants']==selected and mode['runtimeSelected'] is False,'conditional variant list')
   ck(struct.unpack_from('<i',exe,BASE+root+sep)[0]==-2 and u32(exe,BASE+root+term)==0,'source sentinel')
   for offset,expected in ((0x14,0x16cb2),(0x18,0x16cd8),(0x1c,0x77453)):
    typed(exe,fx,root+offset,expected);ptr_checks+=1
   ck(mode['sharedPointers']=={'inputObject2':0x16cb2,'streamObject2':0x16cd8,'stateObject2':0x77453},'header links')
   for group,locations,opers in [('staticPairs',static,FIXED),('accumulatorPairs',accum,ACC)]:
    actual=mode[group];ck(len(actual)==len(selected),'pair counts')
    for i,v in enumerate(selected):
     pair=actual[i];at=root+locations[i];setup=SETUPS[v-1]
     typed(exe,fx,at,setup);ptr_checks+=1
     ck(pair['setupVariant']==v and pair['setupObject2']==setup and pair['fieldObject2']==at and pair['fieldPhysical']==BASE+at,'pair source/provenance')
     ck(pair['operandFieldObject2']==at+4 and pair['operandFieldPhysical']==BASE+at+4,'operand location')
     expected=opers[v-1];ck(u32(exe,BASE+at+4)==expected and pair['operand']==expected,'original operand')
     if group=='accumulatorPairs':
      typed(exe,fx,at+4,expected);ptr_checks+=1
      channel=(expected-0x84310)//4
      ck(pair['motionChannelIndex']==channel and pair['originalChannelInputRaw']==words[channel],'accumulator to source channel join')
      ck(pair['originalChannelInput16_16']==words[channel]/65536,'source input raw numerical mapping')
      ck(len(pair['positiveStreamHighWordReferences'])>=1,'source control stream high-half witnesses')
      for entry in pair['positiveStreamHighWordReferences']:
       ck(u32(exe,BASE+entry+4)==expected+2,'high-half control stream pointer value')
       typed(exe,fx,entry+4,expected+2)
     else:ck((2,at+4) not in fx,'numeric operand incorrectly marked pointer')
     ck(pair['operandRole']==('raw-fixed-operand' if group=='staticPairs' else 'accumulator-address'),'source role qualification')
  ck(selected_counts==[5,3,3],'all three modes')
  ck(g['modes'][1]['rootByteSHA256']==g['modes'][2]['rootByteSHA256'],'mode 1/fallback identical root image')
  # Independently decode all source indices/masks and check candidate-color PNGs, not just JSON metadata.
  rgb={}
  for n in range(1,81):
   raw=mod.u16(exe,0x89324+2*n)
   d=[((raw>>9)&63)|1,((raw>>4)&63)|1,((raw<<1)&63)|1]
   rgb[n]=[(v<<2)|(v>>4) for v in d]
  for num,so in enumerate(SETUPS,1):
   at=BASE+so;w,h,count=struct.unpack_from('<HHH',exe,at);cp=u32(exe,at+6);dt=u32(exe,at+10)
   idx=bytearray(w*h);mask=bytearray(w*h);rgba=bytearray(w*h*4);cache={}
   for ord_ in range(count):
    flags,x,y,pair=struct.unpack_from('<HHHH',exe,BASE+cp+8*ord_)
    pal=(flags&15)|((pair&0xf000)>>8);desc=dt+(pair&0xfff)*4
    sw,sh,raw=struct.unpack_from('<HHI',exe,BASE+desc);res=raw>>24;start=raw&0xffffff
    ck(pal==2 and res==27,'resource/palette descriptor binding')
    if (start,sw,sh) not in cache:cache[(start,sw,sh)]=mod.decode(gra,start,sw,sh)
    pix,opa,_=cache[(start,sw,sh)]
    x=mod.i16(x);y=mod.i16(y)
    for i,v in enumerate(pix):
     if not opa[i]:continue
     xx=x+i%sw;yy=y+i//sw
     if not (0<=xx<w and 0<=yy<h):continue
     dest=yy*w+xx;idx[dest]=v;mask[dest]=1
     rgba[dest*4:dest*4+4]=bytes([*rgb[v],255])
   base=f'results/forest_source_layers/variant_{num}_{w}x{h}'
   ck(z.read(base+'/indices.bin')==idx,'original indexed pixels for layer '+str(num))
   ck(z.read(base+'/opacity_mask.bin')==mask,'original alpha for layer '+str(num))
   ck(mod.png_pixels(z.read(base+'/candidate_color.png'),w,h)==rgba,'source-linked palette PNG for layer '+str(num))
  ck('not verified' in z.read('SUMMARY.md').decode().lower() or 'no live' in z.read('SUMMARY.md').decode().lower(),'runtime limitation appears in readable summary')
  return{'status':'PASS_O198_INDEPENDENT','originalLEFixups':total,'verifiedTypedPointers':ptr_checks,'roots':len(ROOTS),
   'setupPairPointers':22,'accumulatorPointers':11,'modeLayerCounts':selected_counts,'originalIndexedLayersVerified':5,
   'fullSourceGraphicsBundled':False,'runtimeSelectionVerified':False}
if __name__=='__main__':
 if len(sys.argv)!=3:raise SystemExit('python scripts/verify-o198-export.py <original MK2 dir> <O198 forensic ZIP>')
 print(json.dumps(audit(Path(sys.argv[1]),Path(sys.argv[2])),indent=2))
