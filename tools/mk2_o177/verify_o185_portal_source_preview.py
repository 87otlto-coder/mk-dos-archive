#!/usr/bin/env python3
"""O185 original-source RGBA preview qualification: NOT runtime palette verification."""
import argparse,hashlib,io,json,zipfile
from collections import Counter
from pathlib import Path
try:from PIL import Image
except ImportError:raise SystemExit('O185 optional preview audit needs Pillow')
H=lambda b:hashlib.sha256(b).hexdigest()

def run(source_archive,report,preview):
    z=zipfile.ZipFile(source_archive);m=json.loads(z.read('manifest.json'))
    assert m['frameCount']==43 and m['runtimeFrameRateKnown'] is False
    electric=next(t for t in m['tracks'] if t['name']=='portal_electric')['frames'][0]
    idx=z.read(electric['paths']['indexedPixels']);mask=z.read(electric['paths']['opacityMask'])
    rgba=Image.open(io.BytesIO(z.read(electric['paths']['rgbaPng']))).convert('RGBA').tobytes()
    lookup={}
    for palette_index in (63,64):
        colors={rgba[4*i:4*i+3] for i,v in enumerate(idx) if v==palette_index and mask[i]}
        assert len(colors)==1,('inconsistent source palette',palette_index)
        lookup[palette_index]=tuple(next(iter(colors)))
    assert lookup=={63:(4,93,239),64:(150,190,255)},'source-preview palette candidate changed'
    count=0;rgba_changes=0;frame_census=[]
    for t in m['tracks']:
        if t['name'] not in ('portal_swaying','portal_hanging'):continue
        for f in t['frames']:
            indexed=z.read(f['paths']['indexedPixels']);opacity=z.read(f['paths']['opacityMask'])
            image=Image.open(io.BytesIO(z.read(f['paths']['rgbaPng']))).convert('RGBA')
            data=bytearray(image.tobytes());before=bytes(data)
            mask_checksum=H(opacity)
            remapped=0
            for k,v in enumerate(indexed):
                if opacity[k] and v in (54,55):
                    new_index={54:63,55:64}[v]
                    assert data[k*4+3]==255
                    rgb=lookup[new_index]
                    assert data[k*4:k*4+3]!=bytes(rgb)
                    data[k*4:k*4+3]=bytes(rgb)
                    remapped+=1
            changed=sum(before[k:k+4]!=data[k:k+4] for k in range(0,len(data),4))
            assert changed==remapped
            assert mask_checksum==f['opacityMaskSHA256'] and H(indexed)==f['indexedPixelsSHA256']
            count+=remapped;rgba_changes+=changed
            frame_census.append({'track':t['name'],'ordinal':f['ordinal'],'RGBAChangedPixels':changed,'previewRGBA_SHA256':H(data)})
    assert len(frame_census)==14 and count==4633
    p=Path(preview).read_bytes();Image.open(io.BytesIO(p)).verify()
    return {'schema':'mk2_o185_portal_source_palette_visual_preflight_v1','status':'STATIC_SOURCE_PALETTE_PREVIEW_NOT_RUNTIME_PALETTE',
            'originalSourceArchiveSHA256':H(Path(source_archive).read_bytes()),
            'sourcePaletteLookup':{str(i):list(rgb) for i,rgb in lookup.items()},
            'previewFrameCount':14,'previewRGBAChangedPixels':rgba_changes,
            'frameCensus':frame_census,'previewImageSHA256':H(p),
            'gameplayColorVerification':False,'runtimePaletteSelected':False,'runtimeAnimationActivation':False}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--archive',required=True);p.add_argument('--report',required=True);p.add_argument('--preview',required=True);p.add_argument('--out',required=True);a=p.parse_args()
 r=run(a.archive,json.loads(Path(a.report).read_text()),a.preview)
 out=Path(a.out);assert not out.exists();out.write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:r[k] for k in ('status','previewFrameCount','previewRGBAChangedPixels','sourcePaletteLookup')},indent=2))
