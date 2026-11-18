"""Normalize the source-safe reports from Spelunks 003–009 (result-N.json)."""
import hashlib
import json
import sys
from pathlib import Path
import zipfile

reports, archive, output = map(Path, sys.argv[1:])
r = {i: json.loads((reports / f'result-{i}.json').read_bytes()) for i in range(3, 10)}
families = {}

def digest(records, key):
    return hashlib.sha256(b''.join(bytes.fromhex(x[key]) for x in records)).hexdigest()

def config(name, resource_hash, rows, layout):
    fields, index_key, mask_key = layout
    by_descriptor = {}
    for row in rows:
        d = row['descriptorObject2']
        values = []
        for field in fields:
            value = row[field]
            values.extend(value if isinstance(value, list) else [value])
        if d in by_descriptor:
            assert values == by_descriptor[d][0]
            assert row[index_key] == by_descriptor[d][1][index_key]
            assert row[mask_key] == by_descriptor[d][1][mask_key]
        by_descriptor[d] = (values, row)
    ordered = [by_descriptor[k] for k in sorted(by_descriptor, key=lambda k: (by_descriptor[k][0][0], k))]
    with zipfile.ZipFile(archive) as z:
        matches = [p for p in z.namelist() if p.rsplit('/', 1)[-1].upper() == name]
        assert len(matches) == 1
        data = z.read(matches[0])
    assert hashlib.sha256(data).hexdigest() == resource_hash
    families[name.lower()] = dict(bytes=len(data), sha256=resource_hash, records=[x[0] for x in ordered],
                                  indices=digest([x[1] for x in ordered], index_key),
                                  opacity=digest([x[1] for x in ordered], mask_key))

for track in r[3]['tracks']:
    config(track['resourceName'], track['sourceResourceSha256'], track['frames'],
           (['encodedOffset','encodedEndExclusive','descriptorObject2','originalWidth','originalHeight','descriptorLocalX','descriptorLocalY'],
            'indexedPlaneSha256','opacityPlaneSha256'))
for name, resource_hash in r[4]['originalResourceSha256'].items():
    rows = [f for t in r[4]['tracks'] if t['sourceResource'] == name for f in t['sourceOrderedFrames']]
    config(name, resource_hash, rows,
           (['streamStart','streamEndExclusive','descriptorObject2','width','height','signedDescriptorLocalX','signedDescriptorLocalY'],
            'indexedPlaneSha256','opacityMaskSha256'))
sys.path.insert(0, str(reports / 'scripts/research/spelunk005'))
import trace_bang_suck_sources as bang_source

original = bang_source.original(archive)
exe = original['MK2.EXE']
fixups = bang_source.common.fixups(exe)
bang = r[5]['BANG']
extras = [bang_source.descriptor(exe, fixups, original['BANG.GRA'], 12, row['descriptorObject2'])
          for row in bang['otherDistinctSourceSprites']]
for row, observed in zip(bang['otherDistinctSourceSprites'], extras):
    assert row['sourceSpan'] == [observed['sourceStart'], observed['sourceEndExclusive']]
    assert row['sourceSha256'] == observed['sourceSha256']
config('BANG.GRA', bang['fullResourceSha256'],
       [f for t in bang['sourceListFamilies'] for f in t['orderedEntries']] + extras,
       (['sourceStart','sourceEndExclusive','descriptorObject2','dimensions','signedLocalXY'],'indexedSha256','maskSha256'))
config('SUCK.GRA', r[6]['originalSuckSha256'], r[6]['descriptors'],
       (['streamStart','streamEndExclusive','descriptorObject2','dimensions','localXY'],'indexedSha256','opacityMaskSha256'))
config('BLOOD.GRA', r[7]['sourceBloodGraSha256'], r[7]['allSprites'],
       (['sourceStart','sourceEndExclusive','descriptorObject2','dimensions','localXY'],'indexedSha256','opacityMaskSha256'))
assert [len(families[f]['records']) for f in ['armory.gra','forest.gra','soul.gra','fireskel.gra','bang.gra','suck.gra','blood.gra']] == [12,7,17,12,101,83,178]
output.write_text(json.dumps(families,separators=(',',':'))+'\n',encoding='utf8')

programs = {}
def asset_id(name, descriptor):
    return f'mk2:sprite:{name}:{descriptor:x}'

def ordered(name, label, root, marker, rewind, entries, evidence=None):
    result = dict(kind='descriptor-list', label=label, rootObject2=root,
                  entries=[dict(siteObject2=root + i*4, descriptorObject2=d, assetId=asset_id(name, d))
                           for i, d in enumerate(entries)],
                  control=dict(kind='stop' if marker == 0 else 'rewind', sourceMarker=marker,
                               targetObject2=rewind, targetOrdinal=None if rewind is None else (rewind-root)//4))
    if rewind is not None:
        assert rewind >= root and (rewind-root)%4 == 0 and result['control']['targetOrdinal'] < len(entries)
    if evidence is not None:
        result['consumerEvidence'] = evidence
    return result

for t in r[3]['tracks']:
    name = t['resourceName'].lower()
    programs[name] = dict(programs=[ordered(name, t['track'], t['listObject2'], t['terminalWord'], None,
                                           [f['descriptorObject2'] for f in t['frames']], t['sourceCode'])])

for resource in ['SOUL', 'FIRESKEL']:
    name = resource.lower()+'.gra'
    programs[name] = dict(kind='source-phases' if resource == 'SOUL' else 'conditional-source-lists',
                          sourceControl=r[4][resource]['sourceControl'], programs=[
       ordered(name,t['track'],t['listObject2'],t['sourceLoopToken'],t['sourceBackPointerObject2'],
               [f['descriptorObject2'] for f in t['sourceOrderedFrames']])
       for t in r[4]['tracks'] if t['sourceResource'].lower() == name])

for resource in ['BANG', 'SUCK']:
    name = resource.lower()+'.gra'
    programs[name] = dict(sourceControl=r[5]['control'][resource], programs=[
       ordered(name, t.get('selectorIndex', t.get('trackName')), t['listObject2'], t['terminator'], t['backPointer'],
               [f['descriptorObject2'] for f in t['orderedEntries']])
       for t in r[5][resource]['sourceListFamilies']])

def link(name, row):
    return dict(row, assetId=asset_id(name, row['descriptorObject2']))

programs['suck.gra'].update(selectorTableObject2=r[6]['sourceSelectorTableObject2'],
                            selectorSlots=r[6]['selectorSlots'], nestedInterpreter=r[6]['codeProvenance'],
                            nestedGroups=[dict(t, records=[link('suck.gra', f) for f in t['records']])
                                          for t in r[6]['nestedSourceGroups']],
                            singleDescriptorLookup=[link('suck.gra', t) for t in r[5]['SUCK']['separateSingleDescriptorLookup']])
programs['bang.gra'].update(selectorTableObject2=bang['selectorTableObject2'],
                            secondaryGroups=[dict(t, records=[link('bang.gra', f) for f in t['records']])
                                             for t in r[9]['secondaryGroups']],
                            constructor=r[9]['consumerInstructions'],
                            paletteSourceAnchors=r[9]['sourceColourGroups'])
programs['blood.gra'] = dict(programs=[
    ordered('blood.gra', t['rootObject2'],t['rootObject2'],t['marker'],t['rewindObject2'],
            t['originalDescriptorOrderObject2'],
            dict(kind=t['codeLinked'], cursorWritesPhysical=t['directCodeCursorWritePhysical']))
    for t in r[7]['sourceLists']], entrySelector=r[7]['sourceReaderAndVariantControls'],
    paletteSourceAnchors=r[8]['paletteAnchors'], directSeeds=r[8]['directSourceSeeds'],
    constructors=r[8]['constructorCallWits'], placementReferences=r[8]['pitPairedDescriptorReferences'],
    structuralOnlyLists=r[8]['unlinkedListRoots'])
for name, program in programs.items():
    output.with_name(name.removesuffix('.gra')+'-program.json').write_text(
        json.dumps(program,separators=(',',':'))+'\n', encoding='utf8')
