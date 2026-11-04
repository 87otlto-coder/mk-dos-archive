#!/usr/bin/env python3
"""Independent stdlib-only audit: source executable vs O195 forensic ZIP.

Usage: python scripts/verify-o195-export.py /path/to/MK2.EXE /path/to/O195_evidence.zip
This does not import the TypeScript decoder or modify any source files.
"""
import sys,json,zipfile,hashlib,struct
O2=0xA0C54
TABLES=(0x15BEC,0x15C68,0x15CE4)
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'

def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def i32(b,p):return struct.unpack_from('<i',b,p)[0]
def check(exe_path,evidence_path):
    e=open(exe_path,'rb').read()
    assert len(e)==861133 and hashlib.sha256(e).hexdigest()==SHA,'Wrong MK2 source exe'
    with zipfile.ZipFile(evidence_path) as z:
        assert z.testzip() is None,'Corrupt evidence zip'
        record=json.loads(z.read('results/row_geometry.json'))
        tokens=json.loads(z.read('evidence/full_control_tokens.json'))
        manifest=json.loads(z.read('MANIFEST.json'))
        params=json.loads(z.read('EXPERIMENT.json'))['parameters']
        assert len(record)==len(tokens)==7
        assert manifest['sourceGameFilesBundled'] is False and manifest['sourceSHA256']==SHA
        stage_names=[x for x in e[0xA0EF1:0xA13A7].decode('ascii').split('\0') if x]
        expected={'TOMB.GRA','BATTLE.GRA','TOWER.GRA','FOREST.GRA','ARMORY.GRA','PORTAL.GRA','ARENA.GRA'}
        assert {x['stage'] for x in record}==expected
        assert {x['stage'] for x in tokens}==expected
        for item in record:
            index=item['stageIndex'];stage=item['stage'];
            roots=[u32(e,O2+t+index*4) for t in TABLES]
            streams=[u32(e,O2+r+24) for r in roots]
            assert len(set(streams))==1 and streams[0]==item['streamObject2']
            rid=u32(e,O2+roots[0])>>24
            assert stage_names[rid]==stage and rid==item['sourceResourceID']
            ptr=streams[0]
            full=[]
            for ordinal in range(128):
                physical=O2+ptr;opcode=i32(e,physical)
                assert opcode>=0 or opcode in (-1,-2)
                cnt=3 if opcode==-1 else 1 if opcode>0 else 0
                byte_len=4*(cnt+1)
                extras=[u32(e,physical+4+i*4) for i in range(cnt)]
                full.append(dict(ordinal=ordinal,kind=('terminator' if opcode==0 else 'packed-draw' if opcode==-1 else 'other-negative' if opcode==-2 else 'positive-pair'),object2Offset=ptr,
                 exePhysicalOffset=physical,rawSignedToken=opcode,rawWordHex=e[physical:physical+byte_len].hex(),extraDwords=extras,physicalByteLength=byte_len))
                ptr+=byte_len
                if opcode==0:break
            else:raise AssertionError('No terminator')
            proof=next(x for x in tokens if x['stage']==stage)['tokens']
            assert proof==full,f'Token mismatch for {stage}'
            draw=[t for t in full if t['kind']=='packed-draw'];assert len(draw)==1
            source_ptr,y,n=draw[0]['extraDwords']
            assert item['sourcePointer']==source_ptr and item['rawDestinationY']==y and item['requestedRows']==n
            assert item['originalPackedCommandPhysical']==draw[0]['exePhysicalOffset']
            scroll_pixels=(params['verticalScrollFixed'] >>16)
            start=y-scroll_pixels
            expected_visible=min(n,max(0,200-start)) if start>=0 else 0
            assert item['visibleRows']==expected_visible and item['clippedRows']==n-expected_visible
            assert item['pairCount']==sum(t['kind']=='positive-pair' for t in full)
        assert all(not n.lower().endswith(('.gra','.exe')) for n in z.namelist())
        return {'rows':len(record),'control_tokens':sum(len(r['tokens']) for r in tokens),'source_sha256':SHA,'complete_streams_exact':True,'visible_rows_reproduced':True}
if __name__=='__main__':
    assert len(sys.argv)==3,__doc__
    print(json.dumps(check(sys.argv[1],sys.argv[2]),indent=2))
