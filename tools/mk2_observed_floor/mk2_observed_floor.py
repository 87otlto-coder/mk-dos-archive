#!/usr/bin/env python3
"""O116: explicit, evidence-qualified RGB floor preview from original MK2 packed GRA.

Important limitations:
  * Two stages only (TOMB/PORTAL), only the packed floor suffix (NOT a full stage).
  * Index-to-RGB mappings are O115 SCREENSHOT observations, NOT live DAC tables.
  * Uses a fixed, caller-supplied source column and row; NOT an inferred RAM camera.
  * Does not apply O112 hypothetical DWORD palette-base transform.
  * Only accepts canonical source files or an authenticated O111 edit receipt.
  * No user's commercial game files are bundled; input files never overwritten.
"""
from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path
from dataclasses import dataclass
from PIL import Image

PACKED_TOOLS=Path(__file__).resolve().parents[1]/'mk2_packed_stage'
if str(PACKED_TOOLS) not in sys.path:sys.path.insert(0,str(PACKED_TOOLS))
from mk2_packed_stage import RESOURCES, STRIDE, VIEWPORT, resource_identity, restore, write_new, require, sha, QualificationError

STAGE_WITNESSES = {
  'tomb.gra': {
    'stage':'Kombat Tomb', 'ramp':'O115_TOMB_23_RAMP.json', 'minIndex':2, 'maxIndex':51,
    'observedScreenshotSha256':'30e1b00ba361e40a791dffd3d10abdbc2cf77402cacee78f6d07676ae0b83791',
    'reportSha256':'3015abb40e57ffbc449d110c855b0b6c25d0074e77742988ce352dfbc2f7ebdb',
    'suggestedSourceLeftFromDifferentFrame':290,
  },
  'portal.gra': {
    'stage':'The Portal', 'ramp':'O115_PORTAL_26_RAMP.json', 'minIndex':3, 'maxIndex':80,
    'observedScreenshotSha256':'fbce84f4c85fc608241148bafed9baac76c78bc394736ebecce8926b6648f9ed',
    'reportSha256':'94419d55de3d62577a3fe04f260d6299cf1214116b1f8e4c5911171f2598dd5e',
    'suggestedSourceLeftFromDifferentFrame':292,
  },
}
QUALIFIER = 'O115_CONDITIONAL_SCREENSHOT_RGB_NOT_LIVE_MK2_PALETTE_OR_FULL_STAGE'

@dataclass(frozen=True)
class FloorPreview:
  rgba:bytes
  source_indices:bytes
  width:int
  height:int
  distinct_indices:int
  evidence_covered:int
  source_left:int
  source_first_row:int
  modified:bool


def load_witness(stage_resource:str, report_bytes:bytes):
  """Pinned evidence: refuses altered O115 records, wrong-stage mappings and partial tables."""
  name=Path(stage_resource).name.lower()
  require(name in STAGE_WITNESSES, 'no verified observed floor palette for this resource')
  evidence=STAGE_WITNESSES[name]
  require(sha(report_bytes)==evidence['reportSha256'], 'O115 witness report SHA-256 mismatch')
  try: d=json.loads(report_bytes)
  except (ValueError, UnicodeDecodeError) as e:raise QualificationError('invalid O115 JSON') from e
  stage=name.split('.')[0]
  require(d.get('schema')=='mk2_o115_ramp_color_witness_v1' and d.get('stage')==stage, 'wrong-stage or wrong-format report')
  require(d.get('sourceIndexDomain')==[evidence['minIndex'],evidence['maxIndex']], 'wrong source domain')
  require(d.get('completeObservedColorTable') is True, 'incomplete O115 observed color witness')
  require(d.get('input',{}).get('sha256')==evidence['observedScreenshotSha256'], 'wrong screenshot provenance')
  color_records=d.get('indexToObservedColor')
  require(isinstance(color_records,dict), 'missing O115 color entries')
  expected={str(i) for i in range(evidence['minIndex'],evidence['maxIndex']+1)}
  require(set(color_records)==expected, 'incomplete observed color domain')
  palette={}
  for key,entry in color_records.items():
    rgb=entry.get('observedRGB')
    require(entry.get('qualified') is True and isinstance(rgb,list) and len(rgb)==3 and
      all(type(c)==int and 0<=c<=255 for c in rgb),f'unqualified or invalid RGB at source byte {key}')
    palette[int(key)]=bytes(rgb)
  return palette,evidence


def authenticate_source(resource_name:str,resource_data:bytes,receipt_bytes:bytes|None):
  name=Path(resource_name).name.lower()
  require(name in STAGE_WITNESSES,'only O115-witnessed Tomb and Portal can be colored')
  if receipt_bytes is None:
    _,_,at,rows=resource_identity(name,resource_data)
    return name,at,rows,False
  try: receipt=json.loads(receipt_bytes)
  except (ValueError,UnicodeDecodeError) as exc:raise QualificationError('malformed edit receipt') from exc
  # restore enforces exact modified-resource digest, full original source hash, changed count and intact prefix.
  canonical=restore(name,resource_data,receipt)
  _,_,at,rows=resource_identity(name,canonical)
  return name,at,rows,resource_data!=canonical


def make_preview(resource_name:str, resource_data:bytes, ramp_bytes:bytes, *, source_left:int,
                 source_first_row:int=0,height:int|None=None, receipt_bytes:bytes|None=None):
  name,at,rows,modified=authenticate_source(resource_name,resource_data,receipt_bytes)
  colors,_=load_witness(name,ramp_bytes)
  require(type(source_left)==int and 0<=source_left<=STRIDE-VIEWPORT,'invalid fixed source column')
  require(type(source_first_row)==int and 0<=source_first_row<rows,'invalid first source row')
  if height is None:height=rows-source_first_row
  require(type(height)==int and 1<=height<=rows-source_first_row,'invalid source row count')
  rgba=bytearray();index_bytes=bytearray();seen=set()
  for y in range(source_first_row,source_first_row+height):
    row=resource_data[at+y*STRIDE+source_left:at+y*STRIDE+source_left+VIEWPORT]
    require(len(row)==VIEWPORT,'invalid packed source boundary')
    for index in row:
      require(index in colors,f'raw index {index} has no O115 RGB witness for {name}; fail closed')
      rgba.extend(colors[index]);rgba.append(255)
      index_bytes.append(index);seen.add(index)
  return FloorPreview(bytes(rgba),bytes(index_bytes),VIEWPORT,height,len(seen),len(index_bytes),source_left,source_first_row,modified)


def write_outputs(p:FloorPreview, resource_name:str,resource_data:bytes,ramp_bytes:bytes, png_path:Path,manifest_path:Path,
                 *,scale:int=1,receipt_bytes:bytes|None=None):
  require(type(scale)==int and 1<=scale<=8,'invalid nearest-neighbor preview scale')
  require(png_path.resolve()!=manifest_path.resolve(),'preview PNG and manifest must be separate')
  require(not png_path.exists() and not manifest_path.exists(),'output already exists; no overwrite')
  name=Path(resource_name).name.lower()
  image=Image.frombytes('RGBA',(p.width,p.height),p.rgba)
  if scale!=1:image=image.resize((p.width*scale,p.height*scale),Image.Resampling.NEAREST)
  # Image.save generates a deterministic PNG; original bytes remain untouched.
  import io
  stream=io.BytesIO();image.save(stream,format='PNG',optimize=False)
  png_bytes=stream.getvalue()
  manifest={'schema':'mk2_o116_observed_packed_stage_floor_preview_v1','resource':name,
    'stage':STAGE_WITNESSES[name]['stage'], 'resourceSHA256':sha(resource_data),
    'resourceIsAuthenticatedEdit':p.modified,'editReceiptSHA256':sha(receipt_bytes) if receipt_bytes else None,
    'o115RampReportSHA256':sha(ramp_bytes),'o115GameplayScreenshotSHA256':STAGE_WITNESSES[name]['observedScreenshotSha256'],
    'viewportModel':'FIXED_SOURCE_COLUMN_NOT_O112_CAMERA_PARAMETER','sourceLeft':p.source_left,
    'sourceFirstRow':p.source_first_row,'sourceStride':STRIDE,'sourceWidth':p.width,'sourceHeight':p.height,
    'pixelScaleNearest':scale,'sourceIndexImageSHA256':sha(p.source_indices),'observedRGBA_SHA256':sha(p.rgba),
    'observedRGBMappedPixelCount':p.evidence_covered,'distinctOriginalSourceIndicesInPreview':p.distinct_indices,
    'outputPNG_SHA256':sha(png_bytes),'qualification':QUALIFIER,
    'limits':['ONLY_PACKED_FLOOR_NOT_FIGHTERS_OR_STAGE_COMPOSITE',
              'SOURCE_LEFT_IS_USER_PARAMETER_NOT_VERIFIED_EMULATOR_CAMERA',
              'RGB_IS_CONDITIONAL_TO_O115_TESTED_STAGE_PALETTE_AND_FRAME',
              'NO_ASSUMED_DWORD_PALETTE_BANK_TRANSFORM']}
  write_new(png_path,png_bytes)
  write_new(manifest_path,(json.dumps(manifest,indent=2)+'\n').encode())
  return manifest


def main():
  ap=argparse.ArgumentParser(description=__doc__)
  ap.add_argument('--resource',type=Path,required=True,help='Original TOMB.GRA or PORTAL.GRA, or receipt-authenticated edit')
  ap.add_argument('--ramp-report',type=Path,required=True,help='Exact pinned O115_TOMB_23_RAMP.json or O115_PORTAL_26_RAMP.json')
  ap.add_argument('--receipt',type=Path,help='O111/O112 resource edit receipt; required for modified resources')
  ap.add_argument('--source-left',type=int,required=True,help='Explicit source column 0..576; not a measured camera register')
  ap.add_argument('--first-row',type=int,default=0)
  ap.add_argument('--height',type=int)
  ap.add_argument('--scale',type=int,default=3)
  ap.add_argument('--png',type=Path,required=True)
  ap.add_argument('--manifest',type=Path,required=True)
  args=ap.parse_args()
  resource=args.resource.read_bytes();ramp=args.ramp_report.read_bytes();receipt=args.receipt.read_bytes() if args.receipt else None
  p=make_preview(args.resource.name,resource,ramp,source_left=args.source_left,source_first_row=args.first_row,height=args.height,receipt_bytes=receipt)
  d=write_outputs(p,args.resource.name,resource,ramp,args.png,args.manifest,scale=args.scale,receipt_bytes=receipt)
  print(json.dumps({k:d[k] for k in ('stage','sourceLeft','sourceHeight','distinctOriginalSourceIndicesInPreview','qualification','outputPNG_SHA256')},indent=2))

if __name__=='__main__':main()
