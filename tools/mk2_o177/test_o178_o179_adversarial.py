#!/usr/bin/env python3
"""O178/O179 independent report tamper-and-source-rejection regression."""
import copy, json, tempfile
from pathlib import Path
from verify_o178_encoded_frame_spans_independent import verify as verify178
from verify_o179_literal_source_pixel_edit_independent import verify as verify179
from compile_o179_literal_source_pixel_edit import do_edit

def main(exe,gra,report178,report179,patched,manifest136,gra_paths):
    passed=[]
    with tempfile.TemporaryDirectory() as d:
        root=Path(d);base178=json.loads(Path(report178).read_text());base179=json.loads(Path(report179).read_text())
        def t178(label,fn):
            doc=copy.deepcopy(base178);fn(doc);q=root/'r178.json';q.write_text(json.dumps(doc))
            try:verify178(exe,gra_paths,q)
            except (AssertionError,KeyError,IndexError,ValueError):passed.append(label)
            else:raise AssertionError('accepted forged O178 '+label)
        def t179(label,fn):
            doc=copy.deepcopy(base179);fn(doc);q=root/'r179.json';q.write_text(json.dumps(doc))
            try:verify179(exe,gra,patched,q)
            except (AssertionError,KeyError,IndexError,ValueError):passed.append(label)
            else:raise AssertionError('accepted forged O179 '+label)
        t178('false_runtime_observation',lambda j:j.__setitem__('runtimeAnimationObserved',True))
        t178('falsified_frame_start',lambda j:j['stages'][0]['spans'][0].__setitem__('start',0))
        t178('falsified_span_hash',lambda j:j['stages'][0]['spans'][0].__setitem__('encodedSegmentSHA256','0'*64))
        t178('false_source_pointer',lambda j:j['stages'][0]['spans'][0].__setitem__('descriptorObject2',12))
        t178('fake_span_overlap',lambda j:j['stages'][0]['spans'][1].__setitem__('start',j['stages'][0]['spans'][0]['start']))
        t178('claim_variable_repack',lambda j:j.__setitem__('variableLengthRepackAllowed',True))
        t179('fake_two_edits',lambda j:j.__setitem__('editedByteCount',2))
        t179('fake_old_index',lambda j:j.__setitem__('oldOriginalPaletteIndex',0))
        t179('fake_pixel_x',lambda j:j.__setitem__('pixelX',100))
        t179('fake_source_descriptor',lambda j:j.__setitem__('sourceDescriptorObject2',1))
        t179('fake_mask_hash',lambda j:j.__setitem__('editedOpacityMaskSHA256','0'*64))
        t179('false_gameplay_verification',lambda j:j.__setitem__('gameplayEffectVerified',True))
        # Source producer must refuse altered GRA, even if only a single unreferenced byte is changed.
        raw=bytearray(Path(gra).read_bytes());raw[-1]^=1;bad=root/'bad.gra';bad.write_bytes(raw)
        try:do_edit(exe,bad,manifest136,'tomb','tomb_flying_a',0)
        except AssertionError:passed.append('noncanonical_original_gra_rejected')
        else:raise AssertionError('producer accepted mutated GRA')
        try:do_edit(exe,gra,manifest136,'tomb','missing_track',0)
        except StopIteration:passed.append('unknown_track_rejected')
        else:raise AssertionError('producer accepted unknown track')
        assert len(passed)==14
    return {'status':'PASS_O178_O179_ADVERSARIAL','cases':len(passed),'rejected':passed}
if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--tomb',required=True);p.add_argument('--portal',required=True);p.add_argument('--tower',required=True);p.add_argument('--o178',required=True);p.add_argument('--o179',required=True);p.add_argument('--patched-tomb',required=True);p.add_argument('--o136',required=True);a=p.parse_args()
    print(json.dumps(main(a.exe,a.tomb,a.o178,a.o179,a.patched_tomb,a.o136,{'tomb':a.tomb,'portal':a.portal,'tower':a.tower}),indent=2))
