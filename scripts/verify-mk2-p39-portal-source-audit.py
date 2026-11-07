#!/usr/bin/env python3
"""P39 independent original PORTAL effect-list/descriptor/row reconstruction."""
import argparse,hashlib,json,struct
from pathlib import Path
H=lambda b:hashlib.sha256(b).hexdigest()
EXE_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
GRA_SHA='cf16116e96a21fcc17dbfd841e0fb3b5b73c972b1addb5177bfc09b8d1745b82'
BASE=0xa0c54
def originals(root):
    files={}
    for p in root.rglob('*'):
        if p.is_file():files.setdefault(p.name.lower(),[]).append(p)
    assert len(files['mk2.exe'])==len(files['portal.gra'])==1
    exe=files['mk2.exe'][0].read_bytes();gra=files['portal.gra'][0].read_bytes()
    assert H(exe)==EXE_SHA and H(gra)==GRA_SHA and len(gra)==92756
    assert exe[0xa0ef1:0xa13a7].split(bytes([0]))[25]==b'PORTAL.GRA'
    frames=[];checks=3
    for name,list_offset,writer,count,terminal in [('portal_swaying',0x164b4,0x82746,7,1),('portal_hanging',0x164d8,0x828ff,7,0),('portal_electric',0x164f8,0x82994,6,0)]:
        assert exe[writer:writer+6]==bytes([199,5,108 if name=='portal_swaying' else 120,90,7,0])
        assert struct.unpack_from('<I',exe,writer+6)[0]==list_offset
        pointers=struct.unpack_from('<'+str(count)+'I',exe,BASE+list_offset)
        assert struct.unpack_from('<I',exe,BASE+list_offset+count*4)[0]==terminal
        if terminal:assert struct.unpack_from('<I',exe,BASE+list_offset+(count+1)*4)[0]==list_offset
        if name=='portal_swaying':
            assert exe[0x82764:0x8276a]==bytes([199,5,108,90,7,0])
            assert struct.unpack_from('<I',exe,0x8276a)[0]==list_offset
            assert exe[0x8280c:0x82817]==bytes([139,86,84,139,70,92,163,120,90,7,0])
        previous=None
        for ordinal,offset in enumerate(pointers):
            at=BASE+offset
            width,height,x,y,ref=struct.unpack_from('<HHhhI',exe,at)
            start=ref&0xffffff;assert ref>>24==25
            assert 0<width<=640 and 0<height<=480
            assert previous is None or previous==start
            pixels=[];paint=[];pos=start
            for row in range(height):
                line=[];mask=[]
                while len(line)<width:
                    assert pos+4<=len(gra);command=struct.unpack_from('<I',gra,pos)[0];pos+=4
                    if command&1:count=command//2;values=[0]*count;bits=[0]*count
                    elif command&2:count=command//1024;values=[(command//4)%256]*count;bits=[1]*count
                    else:
                        count=command//4;assert 0<count<=64 and pos+((count+3)//4)*4<=len(gra)
                        values=list(gra[pos:pos+count]);bits=[1]*count;pos+=((count+3)//4)*4
                    assert 0<count<=width-len(line)
                    line.extend(values);mask.extend(bits)
                pixels.extend(line);paint.extend(mask)
            previous=pos
            frames.append(dict(assetId=f'mk2-stage-effect:{name}:{ordinal:02}',sequence=name,ordinal=ordinal,
                sourcePointerObject2=list_offset,descriptorObject2=offset,descriptorPhysical=at,width=width,height=height,
                anchor={'x':x,'y':y},start=start,endExclusive=pos,indicesSha256=H(bytes(pixels)),maskSha256=H(bytes(paint)),encodedSha256=H(gra[start:pos])))
            checks+=2*len(pixels)+9
    ordered=sorted(frames,key=lambda r:r['start']);previous=35912
    for f in ordered:assert f['start']==previous;previous=f['endExclusive']
    assert previous==56916
    return {'schema':'mkdos_p39_portal_effect_original_reference_v1','exeSha256':EXE_SHA,'graSha256':GRA_SHA,'frames':frames,
            'streamStart':35912,'streamEndExclusive':56916,'encodedBytes':21004},checks

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('root',type=Path);p.add_argument('--report',type=Path,required=True)
    a=p.parse_args();ref,checks=originals(a.root)
    assert len(ref['frames'])==20
    ref.update(status='PASS',originalFileDecoderChecks=checks,indexedPixels=sum(f['width']*f['height'] for f in ref['frames']),
        runtimeChanged=False,coverageReportIntegrated=False,newRepresentations=0,nativeTimingOrPaletteClaimsAdded=False,
        scope='Targeted original-file source audit only; existing extractor exports and complete regression not rerun')
    a.report.write_text(json.dumps(ref,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:ref[k] for k in ['status','originalFileDecoderChecks','indexedPixels','streamStart','streamEndExclusive','encodedBytes']},indent=2))
if __name__=='__main__':main()
