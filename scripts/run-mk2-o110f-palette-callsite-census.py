#!/usr/bin/env python3
"""O110F: original MK2 palette-allocator direct-call and relocated-immediate census.

Static research only. A byte-confirmed E8 encoding does not imply observed execution,
and an allocator request does not identify a stage runtime palette handle.
"""
import argparse
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

EXE_HASH = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ALLOCATOR = 0x7b439
OBJ1_IMAGE = 0x61c54
OBJ1_PAGES = 63
OBJ1_END = OBJ1_IMAGE + OBJ1_PAGES * 4096
LE = 0x28f0c
OLD_O71 = [0x81dda, 0x85abf, 0x85c79, 0x86b1f, 0x989af, 0x98c65,
           0x98c79, 0x98d6f, 0x995a6, 0x9964f, 0x997ba, 0x9ab0e,
           0x9abd9, 0x9d626, 0x9e3be]
STAGE_SOURCES = [('TOMB', 63776, 28), ('BATTLE', 59436, 34),
                 ('TOWER', 56268, 30), ('FOREST', 198116, 27),
                 ('ARMORY', 126336, 26), ('PORTAL', 56916, 25),
                 ('ARENA', 90488, 31)]

sha = lambda b: hashlib.sha256(b).hexdigest()
u16 = lambda b, off: struct.unpack_from('<H', b, off)[0]
u32 = lambda b, off: struct.unpack_from('<I', b, off)[0]
s16 = lambda b, off: struct.unpack_from('<h', b, off)[0]
s32 = lambda b, off: struct.unpack_from('<i', b, off)[0]


def typed_fixups(b):
    assert u32(b, LE + 0x14) == 113 and OBJ1_IMAGE == 0x61c54
    table = LE + u32(b, LE + 0x68)
    block = LE + u32(b, LE + 0x6c)
    out = {}
    count = 0
    for page in range(113):
        pos = block + u32(b, table + 4 * page)
        end = block + u32(b, table + 4 * (page + 1))
        while pos < end:
            kind = b[pos] & 15
            flags = b[pos+1]
            relative = s16(b, pos+2)
            pos += 4
            assert flags & 3 == 0
            obj = u16(b, pos) if flags & 64 else b[pos]
            pos += 2 if flags & 64 else 1
            target = None
            if kind != 2:
                target = u32(b, pos) if flags & 16 else u16(b, pos)
                pos += 4 if flags & 16 else 2
            if flags & 4:
                pos += 4 if flags & 32 else 2
            source = OBJ1_IMAGE + page * 4096 + relative
            if source in out:
                assert out[source] == (kind, flags, obj, target)
            out[source] = (kind, flags, obj, target)
            count += 1
            assert pos <= end
        assert pos == end
    assert count == 27004
    return out, count


def main():
    p = argparse.ArgumentParser()
    p.add_argument('fixture', type=Path, help='Folder containing original mk2.exe and stage .gra files')
    p.add_argument('outdir', type=Path)
    args = p.parse_args()
    b = (args.fixture / 'mk2.exe').read_bytes()
    assert sha(b) == EXE_HASH, 'Original MK2 executable SHA mismatch'
    assert b[ALLOCATOR:ALLOCATOR+5].hex() == '53515233db'
    fxs, fix_count = typed_fixups(b)
    sites = []
    rec_targets = {}
    for at in range(OBJ1_IMAGE, OBJ1_END - 4):
        if b[at] != 0xe8 or at+5+s32(b, at+1) != ALLOCATOR:
            continue
        item = {'callPhysical': at, 'callHex': b[at:at+5].hex(),
                'previouslyEnumeratedO71': at in OLD_O71,
                'immediatelyPrecedingMovEaxImmediate': False}
        if b[at-5] == 0xb8:
            src = at-4
            word = u32(b, src)
            fix = fxs.get(src)
            assert fix == (7, 16, 1, word), 'Expected typed Object-1 palette pointer at ' + hex(src)
            target_phys = OBJ1_IMAGE + word
            assert target_phys + 2 <= len(b)
            n = u16(b, target_phys)
            assert 0 < n <= 256 and target_phys + 2 + n*2 <= OBJ1_END
            contents = b[target_phys:target_phys+2+n*2]
            colors = list(struct.unpack_from('<'+str(n)+'H', b, target_phys+2))
            assert all(0 <= w <= 0x7fff for w in colors)
            rec_targets[word] = {'object1Offset': word, 'filePhysical': target_phys,
                                 'colors': n, 'recordLength': len(contents),
                                 'sha256': sha(contents), 'distinctWords': len(set(colors)),
                                 'allWords15Bit': True,
                                 'dac6FirstThree': [[((w>>9)&63)|1, ((w>>4)&63)|1, ((w<<1)&63)|1] for w in colors[:3]]}
            item.update({'immediatelyPrecedingMovEaxImmediate': True,
                         'loadPhysical': at-5, 'relocationSourcePhysical': src,
                         'paletteTargetObject': 1, 'paletteTargetOffset': word,
                         'paletteRecordPhysical': target_phys,
                         'paletteRecordColorCount': n})
        sites.append(item)
    assert len(sites) == 23
    historical = set(OLD_O71)
    found = {i['callPhysical'] for i in sites}
    assert historical <= found and len(found - historical) == 8
    counts = Counter(i.get('paletteTargetOffset') for i in sites if i['immediatelyPrecedingMovEaxImmediate'])
    assert counts == {0x26cc4:13, 0x2ab28:1}
    assert sorted((k, v['colors']) for k,v in rec_targets.items()) == [(0x26cc4,48),(0x2ab28,64)]
    resources = []
    for name, start, file_id in STAGE_SOURCES:
        gfx = (args.fixture / (name.lower() + '.gra')).read_bytes()
        raw = gfx[start:]
        assert len(raw) and len(raw) % 896 == 0
        # O110C original packed refs: verified in EXE by resource table at 0xCFBAC.
        # Slot order is not contiguous with packed resource file IDs.
        slot = {'TOMB':0,'BATTLE':1,'TOWER':2,'FOREST':3,'ARMORY':4,'PORTAL':6,'ARENA':7}[name]
        assert u32(b,0xcfbac + 4*slot) == ((file_id<<24)|start)
        resources.append({'name':name+'.GRA', 'fileId':file_id, 'sourceOffset':start,
                          'rows896':len(raw)//896, 'sourceSHA256':sha(raw),
                          'sourceIndexMin':min(raw), 'sourceIndexMax':max(raw),
                          'rawIndexFits48EntryPaletteWithoutRemap':max(raw)<48,
                          'rawIndexFits64EntryPaletteWithoutRemap':max(raw)<64})
    report = {
        'format':'mk2_o110f_palette_allocator_callsite_census_v1',
        'status':'PASS_STATIC_ONLY', 'sourceExecutableSHA256':EXE_HASH,
        'method':'Exact E8 rel32 byte encodings in canonical Object-1 file-backed image; immediate predecessor B8+imm32 requires type-7 Object-1 LE fixup',
        'object1FileImage':[OBJ1_IMAGE, OBJ1_END], 'allocationTargetPhysical':ALLOCATOR,
        'fixupEntriesParsed':fix_count, 'historicalO71Sites':OLD_O71,
        'historicalO71Count':len(OLD_O71),'allExactRel32SitesCount':len(sites),
        'newSitesNotInO71':[i['callPhysical'] for i in sites if not i['previouslyEnumeratedO71']],
        'directPrecedingRelocatedPaletteLoadsCount':sum(i['immediatelyPrecedingMovEaxImmediate'] for i in sites),
        'remainingDynamicOrNonImmediateCallsites':sum(not i['immediatelyPrecedingMovEaxImmediate'] for i in sites),
        'callSites':sites,
        'sourcePaletteRecords':[rec_targets[o] for o in sorted(rec_targets)],
        'packedStageSuffixIndexDomains':resources,
        'researchBoundaries':{
            'directE8ByteShapeMeansRuntimeExecution':False,
            'immediatePaletteLoadMeansStageOwnership':False,
            'stagePaletteBankSlot1IdentityProven':False,
            'fullyColoredStageReady':False,
            'noRemapIndexRangeCompatibilityProvesPaletteOwnership':False,
            'paletteAllocatorMayAllocateOrReuseHandlesDynamically':True,
        },
        'notes':['Extends, rather than silently rewrites, the earlier bounded O71 list of 15.',
                 '13 relocated immediate callers name the same 48-color Object-1 record; one names a 64-color record.',
                 'The seven packed stage tails contain raw values above 64, but stage rendering adds a dynamic palette-bank correction by DWORD arithmetic; no direct table-ordinal inference is licensed.',
                 'No gameplay execution, stage scene selection, palette-handle slot 1, final compositing or DOSBox screenshot is proven.']
    }
    args.outdir.mkdir(parents=True,exist_ok=True)
    path = args.outdir / 'MK2_O110F_PALETTE_CALLSITE_EVIDENCE.json'
    path.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'status':'PASS', 'evidence':str(path), 'fixups':fix_count,
        'calls':len(sites),'addedBeyondO71':len(found-historical),
        'typedImmediateLoads':report['directPrecedingRelocatedPaletteLoadsCount'],
        'paletteRecordColorCounts':[(hex(k),v['colors']) for k,v in sorted(rec_targets.items())],
        'runtimeStagePaletteProven':False},indent=2))

if __name__ == '__main__':
    main()
