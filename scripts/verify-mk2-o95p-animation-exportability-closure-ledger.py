#!/usr/bin/env python3
"""Independent O95P consistency and original-callsite-byte verifier.
Does not import/run the JS report builder; no new semantic interpretation.
Usage: verifier <fixture-mk2-dir> <source-root> <generated-o95p-report.json>
"""
import hashlib, json, struct, sys
from pathlib import Path
if len(sys.argv)!=4:
    raise SystemExit('Usage: verify-mk2-o95p-animation-exportability-closure-ledger.py <mk2-fixture-dir> <source-root> <o95p-report>')
fixture,root,out=(Path(x) for x in sys.argv[1:])
ledger=json.loads(out.read_text())
files=ledger['provenance']['sourceEvidence']
checks=[]
def ck(tag,valid):
    checks.append(tag)
    if not valid:raise AssertionError(tag)
def hexhash(data):return hashlib.sha256(data).hexdigest()
exe=(fixture/'mk2.exe').read_bytes()
PIN='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ck('authentic_executable_hash',hexhash(exe)==PIN and ledger['provenance']['exeSha256']==PIN)
actual_files=[p for p in fixture.rglob('*') if p.is_file()]
ck('fixture_inventory',len(actual_files)==ledger['provenance']['fixtureFiles']==614)
ck('fixture_bytes',sum(p.stat().st_size for p in actual_files)==ledger['provenance']['fixtureBytes']==19921006)
for tag,file in files.items():
    p=root/file['file']
    ck('source_report_hash_'+tag,p.exists() and hexhash(p.read_bytes())==file['sha256'])
previous={tag:json.loads((root/entry['file']).read_text()) for tag,entry in files.items()}
ck('baseline_status',all(v.get('status')=='SUCCESS' for k,v in previous.items() if k!='O95A'))
ck('report_format_status',ledger['format']=='mk2_animation_exportability_closure_ledger_o95p_v1' and ledger['status']=='SUCCESS')
ck('evidence_scope_limited',not ledger['scope']['freshExecutableSemantics'] and not ledger['scope']['changesToGameAssets'])
# Independently reconstitute each unique root's exact extent and aliases from the O95B rows.
base=previous['O95B']
ck('identity_slot_count',base['summary']['identitySlots']==ledger['rootGeometry']['identitySlots']==17)
accum=0; known=0
for family in base['families']:
    family_id=family['label']
    printed=next(z for z in ledger['rootGeometry']['families'] if z['family']==family_id)
    rows=family['rootRows']; slots=family['slotRoots']; root_by_slot={s['slot']:s['rootObject2Offset'] for s in slots}
    ck('all_slots_'+family_id,set(root_by_slot)==set(range(17)))
    ck('unique_roots_'+family_id,len({r['rootObject2Offset'] for r in rows})==printed['uniqueRoots']==family['uniqueRootCount'])
    ck('printed_rows_'+family_id,len(printed['perRootEntries'])==len(rows))
    for i,rr in enumerate(rows):
        pr=printed['perRootEntries'][i]
        ck('root_entry_'+family_id+'_'+str(i),pr['rootObject2OffsetHex']==rr['rootObject2OffsetHex'] and pr['contiguousRelocationEntries']==rr['contiguousRelocatableEntryCount'] and pr['oneHopDescriptorWitnesses']==rr['oneHopKnownDescriptorCount'])
        ck('root_slot_alias_'+family_id+'_'+str(i),set(rr['slots'])=={slot for slot,pointer in root_by_slot.items() if pointer==rr['rootObject2Offset']}==set(pr['slotAliases']))
    subtotal=sum(r['contiguousRelocatableEntryCount'] for r in rows)
    hop=sum(r['oneHopKnownDescriptorCount'] for r in rows)
    ck('root_subtotals_'+family_id,printed['contiguousRelocationEntriesAtUniqueRoots']==subtotal and printed['oneHopKnownDescriptorWitnesses']==hop)
    accum+=subtotal; known+=hop
ck('unique_root_entry_count',accum==925==ledger['rootGeometry']['contiguousRootEntriesTotal'])
ck('onehop_witness_count',known==117==ledger['rootGeometry']['oneHopKnownDescriptorWitnessTotal'])
ck('no_root_completeness_claim',all(not x['individualStreamCompletenessEstablished'] for x in ledger['rootGeometry']['families']))
# Independent opcode and rel32 target verification for all historical O95H calls.
h=previous['O95H']
expected={}
for group in h['consumerFamilies']:
    for route in group['callsites']:
        p=route['physical']
        ck('unique_callsite_'+hex(p),p not in expected)
        expected[p]=route['family']
        ck('call_opcode_'+hex(p),exe[p]==0xE8)
        dest=p+5+struct.unpack_from('<i',exe,p+1)[0]
        ck('rel32_destination_'+hex(p),dest==(0x918F1 if route['family']=='A' else 0x91909))
ck('distinct_lookup_calls',len(expected)==253 and list(expected.values()).count('A')==144 and list(expected.values()).count('B')==109)
cv=ledger['consumerCoverage'];os=previous['O95O']['summary']
ck('consumer_coverage',cv['authenticatedDirectLookups']==len(expected)==253 and cv['byFamily']=={'A':144,'B':109})
ck('strong_partition',cv['strictTerminalQualified']==os['strictTerminalQualifiedAfterO95O']==210 and cv['strongConsumerQualified']==os['strongConsumerQualifiedAfterO95O']==239)
ck('nonterminal_and_held',cv['strongNonterminalQualified']==29 and cv['withoutStrongQualifiedConsumer']==14 and 210+29+14==253)
held=[x for x in previous['O95O']['routes'] if x['qualification']!='TERMINAL_QUALIFIED']
ck('exact_held_population',{(x['family'],x['lookupCallPhysicalHex'],x['qualification'],x['subtype'],x['originClass']) for x in held}=={(x['family'],x['lookupCallPhysicalHex'],x['qualification'],x['subtype'],x['originClass']) for x in cv['heldRoutes']})
ck('held_class_partition',cv['conditionalHeld']==4 and cv['structuralHeld']==10 and len(held)==14)
# Fixed numeric witnesses are reassembled from separate, existing O95C/E/F/G reports.
origins=[('O95C',previous['O95C']['boundedWitness']),('O95E',previous['O95E']['fixedDelayedWitness']),('O95F',previous['O95F']['fixedWitness']),('O95G',previous['O95G']['slot1DelayedStandardWitness']),('O95G',previous['O95G']['slot0SpecializedDirectDescriptorWitness'])]
w=ledger['boundedFixedIdentityWitnesses']
ck('fixed_numeric_witness_count',w['count']==len(origins)==len(w['witnesses'])==5)
for idx,(label,v) in enumerate(origins):
    row=w['witnesses'][idx]
    ck('witness_source_'+str(idx),row['source']==label and row['identitySlot']==v['identitySlot'] and row['family']==v['family'])
    ck('witness_stream_'+str(idx),int(row['streamObject2OffsetHex'],16)==v['streamObject2Offset'])
    ck('witness_order_count_'+str(idx),row['boundedOrderedRenderEntries']==len(v.get('frames',v.get('descriptorSteps',[]))))
    ck('no_witness_semantic_claim_'+str(idx),not any([row['provedFullIdentityAnimationTable'],row['provedWallClockTiming'],v['timingEstablished'],v['semanticNameEstablished']]))
ck('distinct_witness_streams',len({r['streamObject2OffsetHex'] for r in w['witnesses']})==5)
ck('no_exhaustive_witness_claim',not w['comprehensivePerIdentityCoverage'])
# O95A is historical completion context; O95P must not silently promote its open domains.
a=previous['O95A']
ck('graphics_partition',ledger['graphics']['installedGra']==a['graphics']['installedGra']==124 and ledger['graphics']['exactFullWholeResource']==94 and ledger['graphics']['nonExactFull']==15+14+1==30)
ck('palette_baseline',ledger['palette']['selectorSlots']==17 and ledger['palette']['qualifiedSlots']==9 and ledger['palette']['unresolvedSlots']==8)
ck('unresolved_palette_slots',set(ledger['palette']['unresolvedSlotIds'])=={z['slot'] for z in a['palettes']['slots'] if z['status']=='UNRESOLVED_FOR_CORRECT_COLOR'}=={6,7,10,11,12,13,14,15})
obs=ledger['animationObligations']
ck('exact_animation_obligations',len(obs)==8 and {x['id'] for x in obs}=={'AN%02d'%j for j in range(1,9)})
ck('blocking_obligations_explicit',sum(x['blocking'] for x in obs)==7 and any(x['state']=='UNKNOWN' for x in obs))
ck('no_incorrect_closure',ledger['decision']['animationReconstructionClosed'] is False and ledger['decision']['mk2ResearchClosed'] is False)
ck('deferred_product_order',ledger['decision']['researchOrder']=='FINISH_MK2_THEN_MK1_THEN_MK3_THEN_UI_DISCUSSION_THEN_BUILD')
ck('unsafe_exports_blocked',{'UNIVERSAL_MK2_ANIMATION_EXPORT','MILLISECONDS_OR_FPS_CONVERSION','FULL_IDENTITY_ROOT_CROSS_PRODUCT','UNIVERSAL_FAMILY_A_OR_B_STREAM_PARSER'}.issubset(ledger['exportability']['blocked']))
ck('original_O95O_no_semantics',previous['O95O']['decision']['completeMK2AnimationCoverageEstablished'] is False)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'exeSha256':PIN,'distinctCalls':len(expected),'rootRelocationEntries':accum,'fixedNumericWitnesses':len(origins),'animationBlockers':7},indent=2))
