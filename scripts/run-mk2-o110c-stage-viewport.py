#!/usr/bin/env python3
"""Produce bounded MK2 packed floor viewport experiments; all screens are normalized, NOT runtime frames."""
import sys,json,hashlib,struct,zipfile,io,collections
from pathlib import Path
from PIL import Image
exe_path, gra_dir, out = map(Path, sys.argv[1:4]);out.mkdir(parents=True,exist_ok=True)
exe=exe_path.read_bytes();digest=lambda b:hashlib.sha256(b).hexdigest()
assert digest(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
source=[('TOMB',0,63776),('BATTLE',1,59436),('TOWER',2,56268),('FOREST',3,198116),('ARMORY',4,126336),('PORTAL',6,56916),('ARENA',7,90488)]
# Qualify exact instructions from the authentic game, and the live constant source image.
assert exe[0x9e138:0x9e15b].hex()=='8bcb81e6ffff00008bc62d200100007412f7d8c1e01099bb70000000f7fba373740700'
assert exe[0x9e16a:0x9e171].hex()=='03348554ef0200'
assert exe[0x9e18b:0x9e197].hex()=='b80100000055e83078fcff5d'
assert exe[0x659e7:0x65a05].hex()=='0fb7e88a04c5065b07004825ff0000008b1485841000008b3cbde4570300'
assert exe[0x65a0f:0x65a3a].hex()=='b950000000ad03c2abe2faa177740700030573740700a377740700c1f81081c5800300008bf52bf04b75d5'
lut=exe[0xa0c54+0x1084:0xa0c54+0x1084+256*4]
assert lut == b''.join(bytes([x])*4 for x in range(256))
def output(raw, available_rows, render_rows, camera, palette_base):
    slope = int(((288-camera)*65536)/112) # truncate towards zero, like signed IDIV
    inc=0;pos=camera;target=bytearray()
    for row in range(render_rows):
        # EDX is the 4-byte repeated lookup, scalar added as uint32 per source DWORD.
        assert row*896<=pos and pos+320<=(row+1)*896 and (row+1)*896<=len(raw), (row,camera,pos)
        bank=palette_base-1
        correction=struct.unpack_from('<I',lut,bank*4)[0]
        for i in range(80):
            d=struct.unpack_from('<I',raw,pos+i*4)[0]
            target.extend(struct.pack('<I',(d+correction)&0xffffffff))
        inc=(inc+slope)&0xffffffff
        signed=inc if inc<0x80000000 else inc-0x100000000
        pos=pos+896-(signed>>16)
    return bytes(target),slope
reports=[];export={}
for n,slot,start in source:
    entire=(gra_dir/f'{n.lower()}.gra').read_bytes();end=entire[start:]
    assert len(end)%896==0 and struct.unpack_from('<I',exe,0xcfbac+4*slot)[0]==((['TOMB','BATTLE','TOWER','FOREST','ARMORY','PORTAL','ARENA'].index(n) if False else {'TOMB':28,'BATTLE':34,'TOWER':30,'FOREST':27,'ARMORY':26,'PORTAL':25,'ARENA':31}[n])<<24|start) # authentic packed resource IDs
    R=len(end)//896
    rec=dict(resource=n+'.GRA',slot=slot,packedOffset=start,sourceBytes=len(end),rows=R,sourceSHA256=digest(end),rawMinimum=min(end),rawMaximum=max(end),uniqueSourceValues=len(set(end)),cases=[])
    export[n+'_source_index_896x'+str(R)+'.idx8']=end
    for x in (176,288,400):
        for palette_base in (1,193) if x==288 else (1,):
            height=R if x==288 else min(16,R)
            data,slope=output(end,R,height,x,palette_base)
            fn=f'{n.lower()}_x{x}_bank{palette_base}_320x{height}'
            export[fn+'.idx8']=data
            # Visually debug-only: grayscale is index value, not source hardware RGB.
            im=Image.frombytes('L',(320,height),data)
            temp=io.BytesIO();im.save(temp,format='PNG');export[fn+'_diagnostic_gray.png']=temp.getvalue()
            rec['cases'].append({'x':x,'hypotheticalBankStart':palette_base,'startOffsetFromResource':start+x,'slope16_16':slope,'width':320,'height':height,'indexSHA256':digest(data),'diagnosticPNGSHA256':digest(export[fn+'_diagnostic_gray.png']),'outputFile':fn+'.idx8', 'indexRange':[min(data),max(data)], 'withinSourceRowNoCross':True, 'uniformByteShiftWouldDiffer':palette_base>176 and any(rawByte+palette_base-1>=256 for rawByte in end)})
    reports.append(rec)
manifest={'format':'mk2_o110c_packed_floor_normalized_viewports_v1','exeSHA256':digest(exe),'purpose':'Source-derived 320-by-R viewport projections with explicit hypothetical camera and palette-base inputs; not observed gameplay, palette ownership or full-frame geometry.','math':{'stride':896,'width':320,'centerCamera':288,'slopeDivisor':112,'slopeNumerator':'(288-x)*65536','paletteRule':'DWORD ADD using the EXE Object-2 replicated-byte LUT at 0x1084, shift=(hypotheticalBankStart-1)&255','rowCursor':'posNext=pos+896-(signedAccIncrement>>16), with 32-bit accumulator wrap'},'caseSource':'authentic mk2.exe + seven source GRA suffixes','rows':reports,'hypothesesNotQualified':['actual runtime camera x','bankStart value at palette slot 1','stage scene placement or activation','full RGB palette','full 320x200 gameplay frame','VFRAME/PLAYSTA ownership','gameplay timing']}
manifestBytes=(json.dumps(manifest,indent=2)+'\n').encode();export['MANIFEST.json']=manifestBytes
zipPath=out/'MK2_PACKED_STAGE_7_PARAMETERIZED_VIEWPORTS_O110C.zip'
with zipfile.ZipFile(zipPath,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for n,d in sorted(export.items()):z.writestr(n,d)
assert zipfile.ZipFile(zipPath).testzip() is None
(out/'mk2_o110c_stage_viewport_manifest.json').write_bytes(manifestBytes)
print(json.dumps({'output':str(zipPath),'manifestSHA256':digest(manifestBytes),'zipSHA256':digest(zipPath.read_bytes()),'totalCases':sum(len(r['cases']) for r in reports),'totalSourceBytes':sum(r['sourceBytes'] for r in reports),'stageRows':sum(r['rows'] for r in reports),'records':[(r['resource'],r['rows']) for r in reports]},indent=2))
