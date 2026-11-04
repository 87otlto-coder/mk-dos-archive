#!/usr/bin/env python3
"""O136: source-authenticated MK2 Tomb/Portal effect frame sequences.

Original stage files and EXE required. Export full individual sprites, index/mask,
record offsets and source ordering. Never invent FPS, absolute location or triggers.
"""
from __future__ import annotations
import argparse,hashlib,io,json,struct,sys,zipfile
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]/'mk2_native_stage_palettes'
sys.path.insert(0,str(ROOT))
from trace_o120_setup_graph import OBJ2,EXE_SHA,fixups
from export_o122_indexed_mosaics import decode_stream,CANONICAL_GRA_SHA256
from native_stage_palettes import source_palette

TRACKS={
 'tomb_flying_a':('tomb',0x17814,8,1,0x17814,0x82d51),
 'tomb_flying_b':('tomb',0x177ec,8,1,0x177ec,0x82db3),
 'portal_swaying':('portal',0x164b4,7,1,0x164b4,0x82746),
 'portal_hanging':('portal',0x164d8,7,0,None,0x828ff),
 'portal_electric':('portal',0x164f8,6,0,None,0x82994),
}
RESOURCE_ID={'tomb':28,'portal':25}

def req(value,why):
 if not value:raise ValueError('O136: '+why)
def sha(x):return hashlib.sha256(x).hexdigest()
def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def get_game(gamezip):
 with zipfile.ZipFile(gamezip) as z:
  names=z.namelist();return {s:z.read(next(n for n in names if n.lower().endswith('/'+s+'.gra'))) for s in ('tomb','portal')}

def produce(exe:bytes,game:dict[str,bytes]):
 req(len(exe)==861133 and sha(exe)==EXE_SHA,'incorrect original MK2 executable')
 for stage in ('tomb','portal'):
  req(sha(game[stage])==CANONICAL_GRA_SHA256[stage.upper()+'.GRA'],'incorrect original '+stage+'.gra')
 fx=fixups(exe)
 result=[];assets={};total=0
 for name,(stage,base,count,end_marker,jump_target,writer) in TRACKS.items():
  if name=='portal_swaying':
   req(exe[writer:writer+6]==bytes.fromhex('c7056c5a0700'), 'Portal nested helper source assignment')
   req(exe[0x82764:0x8276a]==bytes.fromhex('c7056c5a0700') and u32(exe,0x8276a)==base, 'second Portal effect assignment')
   req(exe[0x8280c:0x82817]==bytes.fromhex('8b56548b465ca3785a0700'), 'nested helper transfers pointer into stream global')
  else:
   req(exe[writer:writer+6]==bytes.fromhex('c705785a0700'),
       'source code does not assign expected frame-list global '+name)
  req(u32(exe,writer+6)==base,'source writer no longer points to sequence '+name)
  wfx=fx.get((1,writer+6-0x61c54))
  req(wfx and wfx['kind']==7 and wfx['targetObject']==2 and wfx['targetOffset']==base,'writer LE relocation '+name)
  frames=[];gra=game[stage];palette=source_palette(exe,stage)
  for i in range(count):
   src=base+4*i;desc=u32(exe,OBJ2+src);pf=fx.get((2,src))
   req(pf and (pf['kind'],pf['flags'],pf['targetObject'],pf['targetOffset'])==(7,16,2,desc),
       'bad typed descriptor pointer '+name+' '+str(i))
   req(0<=desc<0x30000 and OBJ2+desc+12<=len(exe),'descriptor not file-backed')
   width,height,x,y,packed=struct.unpack_from('<HHhhI',exe,OBJ2+desc)
   rid,offset=packed>>24,packed&0xffffff
   req(rid==RESOURCE_ID[stage], 'cross-resource sprite pointer')
   req(width*height<=4096 and width>0 and height>0,'unexpected animation sprite dimension')
   decoded=decode_stream(gra,offset,width,height)
   req(all(1<=v<=80 for v in decoded['opaqueIndices']),'palette index outside 80-color record')
   rgba=bytearray();raw_index=decoded['indices'];raw_mask=decoded['mask']
   for idx,m in zip(raw_index,raw_mask):rgba.extend((*palette[idx],255) if m else (0,0,0,0))
   pngio=io.BytesIO();Image.frombytes('RGBA',(width,height),bytes(rgba)).save(pngio,format='PNG')
   prefix=f'{name}/frame_{i:02d}'
   assets[prefix+'.png']=pngio.getvalue();assets[prefix+'.indices.bin']=raw_index;assets[prefix+'.mask.bin']=raw_mask
   frames.append({'ordinal':i,'pointerEntryObject2':src,'descriptorObject2':desc,
                  'resourceID':rid,'resourceName':stage.upper()+'.GRA',
                  'streamStart':offset,'streamEndExclusive':decoded['end'],
                  'sourceWidth':width,'sourceHeight':height,'signedSourceX':x,'signedSourceY':y,
                  'opaquePixels':decoded['opaque'],'sourceStreamSHA256':sha(gra[offset:decoded['end']]),
                  'paletteIndexSHA256':sha(raw_index),'opacityMaskSHA256':sha(raw_mask),
                  'pngSHA256':sha(pngio.getvalue()),'rgbaSHA256':sha(bytes(rgba)),'files':[prefix+s for s in ('.png','.indices.bin','.mask.bin')]})
   total+=1
  req(u32(exe,OBJ2+base+4*count)==end_marker,'sequence end command')
  if jump_target is not None:
   back=base+4*count+4
   req(u32(exe,OBJ2+back)==jump_target,'loop back-reference value')
   jfx=fx.get((2,back));req(jfx and (jfx['kind'],jfx['flags'],jfx['targetObject'],jfx['targetOffset'])==(7,16,2,jump_target),'loop pointer relocation')
  req(all(frames[i]['streamEndExclusive']==frames[i+1]['streamStart'] for i in range(len(frames)-1)), 'not an exact contiguous stream sequence')
  result.append({'name':name,'stage':stage,'sourceFrameListObject2':base,'sourceWriterPhysical':writer,
    'sourceFrameCount':count,'sequenceTerminalWord':end_marker,
    'loopBackPointerObject2':jump_target,'sourceControlFlow':'ONE_MARKER_BACK_REFERENCE' if jump_target is not None else 'ZERO_TERMINATED',
    'originalSourceSpan':[frames[0]['streamStart'],frames[-1]['streamEndExclusive']],
    'frameOrderConfirmedByPointerArray':True,'liveExecutionObserved':False,
    'frames':frames})
 req(total==36,'frame census')
 # Strong full-resource continuity: Tomb O122 static chain ends where B begins;
 # B immediately neighbors A. Portal's two effect chains adjoin each other.
 tomb_b=result[1]['originalSourceSpan'];tomb_a=result[0]['originalSourceSpan']
 portal_a=result[2]['originalSourceSpan'];portal_b=result[3]['originalSourceSpan'];portal_c=result[4]['originalSourceSpan']
 req(tomb_b[1]==tomb_a[0] and portal_a[1]==portal_b[0] and portal_b[1]==portal_c[0], 'cross-track source offset continuity')
 report={'schema':'mk2_o136_original_effect_frame_sources_v1','status':'PASS_SOURCE_AUTHENTICATED_FRAME_EXPORT',
  'originalExecutableSHA256':EXE_SHA,
  'originalResourceSHA256':{s:sha(game[s]) for s in ('tomb','portal')},
  'tracks':result,'totalSourceOrderedFrames':total,
  'keySourceCodeFacts':{'tombPointerWriter':[0x82d51,0x82db3],
      'portalPointerWriter':[0x82746,0x828ff,0x82994], 'portalNestedSourceWriterAlsoAt':0x82764,
      'listReaderPhysical':0x86cc5,'advanceFromListPhysical':0x86ccb,'loopMarkerBranchPhysical':0x86d14,
      'sourceSpriteDescriptorDecoderPhysical':0x640df,
      'sourceSequenceDelays':{'tombCoroutineYieldCounts':[6,6],
       'portalListRunnerYieldArguments':[6,3]},
      'delayCountsNotSecondsOrVerifiedFrames':True},
  'limits':{'actualRuntimeActivationVerified':False,'animationFPSVerified':False,
    'frameDurationsSecondsKnown':False,'finalSpriteWorldPositionsKnown':False,
    'stageCameraOrParallaxKnown':False,'fullNativeSourceFrames':True,
    'sourceOrderFromAuthenticatedPointerArray':True},
  'notes':['Source frames are individually exported uncropped and original-indexed; no interpolated/AI frames.',
      'Portal source list termination is zero; Tomb has marker 1 followed by a typed back-reference. The control code handles these differently.',
      'Code delay values are program counters/inputs; they are NOT established seconds or final animation playback timing.',
      'The ordered Tomb and Portal effect ranges each start immediately where O122 static source streams end and are contiguous within their respective original GRA resources.']}
 return report,assets

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--exe',type=Path,required=True);ap.add_argument('--game-zip',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 req(not a.out.exists(),'refusing existing output directory')
 report,assets=produce(a.exe.read_bytes(),get_game(a.game_zip));a.out.mkdir(parents=True)
 for k,v in assets.items():
  p=a.out/k;p.parent.mkdir(parents=True,exist_ok=True)
  with p.open('xb') as f:f.write(v)
 with (a.out/'O136_FRAME_SEQUENCE_MANIFEST.json').open('x') as f:json.dump(report,f,indent=2)
 print('PASS',report['totalSourceOrderedFrames'],len(assets))
if __name__=='__main__':main()
