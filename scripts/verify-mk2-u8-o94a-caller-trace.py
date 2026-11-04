#!/usr/bin/env python3
import hashlib, json, sys
from pathlib import Path

EXPECTED = {
    'mk2.exe':'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',
    'rm.drv':'87d2d37bbd69a69d47e4bfc11a4a6495a8ac348cb7824ec1c9c59de3ed186546',
    'gmi.bin':'7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633',
    'scc.bin':'7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633',
}
SIGS = {
    ('exe',0x62658): bytes.fromhex('53515256575589c3c1fb1889c585db7c0881fb800000007c0c'),
    ('exe',0x62c74): bytes.fromhex('5352e8ddf9ffff89c385c0750aba54070000e869f1ffffc1eb0489d85a5bc3'),
    ('exe',0x62eb6): bytes.fromhex('b800000039e8b4fdffff89c2a17c17030066895016668b501631c96689501a31db668b501666c74014000081c2d30500008a0d400103006689501e31d266c74018ca1a'),
    ('exe',0x815c9): bytes.fromhex('e853000000ba4837010033c0b43dcd210f823dffffff8bd8b9ffff0000a17c1703000fb7501ec1e2046653b43fcd21665b0f821cffffffb43ecd210f8212ffffff8b157c17030066c742300100a148010300894232fb61c3'),
    ('rm',0x07ca): bytes.fromhex('8bd83d01000f848f01e9a801'),
    ('rm',0x08d3): bytes.fromhex('a12c003dffff7403e8ecfea12e003dffff7403e8e1fea130003dffff7403e8d6feb8ffffa32c00a32e00a33000'),
    ('rm',0x0962): bytes.fromhex('06a11e008ec0bf0000e8520080f9007408b000b411ff1e140007c3'),
    ('gmi',0x0000): bytes.fromhex('e83a02cb'),
    ('gmi',0x023d): bytes.fromhex('9c1e5351525756558bec0e1ffc3a263c0277138adcd0e332ffff976802'),
    ('gmi',0x0f03): bytes.fromhex('3c03774d8ad883e303d0e38b9f2013d0e980e13f7402fec11e06061f0e078bf78bfb8bde'),
}

def sha(b): return hashlib.sha256(b).hexdigest()
def locate(root, name):
    hits=[p for p in root.rglob('*') if p.is_file() and p.name.lower()==name.lower()]
    if len(hits)!=1: raise SystemExit(f'Expected exactly one {name}, found {len(hits)}')
    return hits[0]
def pool_names(exe):
    marker=b'PLAYSTA.GRA\0'; start=exe.find(marker)
    if start<0: raise AssertionError('pool marker absent')
    out=[]; pos=start
    while True:
        z=exe.find(b'\0',pos)
        if z<0: raise AssertionError('unterminated pool')
        name=exe[pos:z].decode('ascii'); out.append(name); pos=z+1
        if name.upper()=='RM.DRV': break
        if len(out)>256: raise AssertionError('pool runaway')
    return start,pos,out

def main():
    if len(sys.argv)<2: raise SystemExit('Usage: verify-mk2-u8-o94a-caller-trace.py <mk2-install-dir> [output-json]')
    root=Path(sys.argv[1]).resolve(); output=Path(sys.argv[2]).resolve() if len(sys.argv)>2 else None
    paths={k:locate(root,k) for k in EXPECTED}
    data={k:p.read_bytes() for k,p in paths.items()}
    checks=[]
    def check(cid, ok, detail): checks.append({'id':cid,'passed':bool(ok),'detail':detail})
    for name,want in EXPECTED.items(): check(f'{name}_sha256',sha(data[name])==want,sha(data[name]))
    check('scc_gmi_identity',data['scc.bin']==data['gmi.bin'] and len(data['scc.bin'])==0x1aca,f"bytes={len(data['scc.bin'])} identical={data['scc.bin']==data['gmi.bin']}")
    start,end,names=pool_names(data['mk2.exe'])
    check('resource_pool_bounds',start==0xa0ef1 and end==0xa13a7,f'{start:#x}..{end:#x}')
    check('resource_pool_ordinal_57',len(names)>57 and names[57].upper()=='SCC.BIN',names[57] if len(names)>57 else '<missing>')
    blobs={'exe':data['mk2.exe'],'rm':data['rm.drv'],'gmi':data['gmi.bin']}
    for (which,off),sig in SIGS.items(): check(f'{which}_{off:x}_signature',blobs[which][off:off+len(sig)]==sig,f'{which}+{off:#x}')
    word=int.from_bytes(data['gmi.bin'][0x28a:0x28c],'little')
    check('gmi_ah11_dispatch_word',word==0x0f03,f'{word:#x}')
    # Cross-link facts encoded directly by the authenticated instruction signatures.
    check('selector_39_maps_to_pool_57',names[0x39].upper()=='SCC.BIN',names[0x39])
    check('driver_image_size_matches_install_immediate',len(data['scc.bin'])==0x1aca,f'{len(data["scc.bin"]):#x}')
    failed=[c for c in checks if not c['passed']]
    report={
        'format':'mk2_u8_o94a_independent_caller_trace_audit_v1',
        'fixture':str(root),
        'status':'SUCCESS' if not failed else 'FAIL',
        'checks':checks,
        'decision':{
            'callerChainAuthenticated':not failed,
            'diskEndFieldMeaningEstablished':False,
            'activePcmRangeEstablished':False,
            'wavAdapterAuthorized':False,
            'nextPass':'O94B +0x04 field lifetime/transformation',
        }
    }
    if output:
        output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'status':report['status'],'checks':len(checks),'failed':[c['id'] for c in failed],'pool57':names[57],'dispatchAh11':hex(word)},indent=2))
    if failed: return 1
    return 0
if __name__=='__main__': raise SystemExit(main())
