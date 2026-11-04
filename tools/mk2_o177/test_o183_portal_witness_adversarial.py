#!/usr/bin/env python3
"""O183: adversarial falsification tests for O182 report, original game source only."""
import argparse,copy,json,sys
from pathlib import Path
from verify_o183_portal_visual_witness_independent import verify

def test(exe,gra,source,r):
    passed=0
    base=verify(exe,gra,source,r)
    assert base['status'].startswith('PASS_')
    cases=[]
    def case(name,mutate):
        m=copy.deepcopy(r);mutate(m);cases.append((name,m))
    case('false-runtime-certainty',lambda x:x.update(gameplayBehaviorVerified=True))
    case('false-palette-certainty',lambda x:x.update(runtimePaletteVerified=True))
    case('false-activation-certainty',lambda x:x.update(gameplayActivationVerified=True))
    case('wrong-input-hash',lambda x:x.update(originalResourceSHA256='0'*64))
    case('wrong-output-hash',lambda x:x.update(editedResourceSHA256='1'*64))
    case('wrong-coordinate',lambda x:x['frames'][0].update(width=32))
    case('wrong-frame-count',lambda x:x.update(frameCount=13))
    case('missing-frame',lambda x:x['frames'].pop())
    case('wrong-opacity-hash',lambda x:x['frames'][0].update(opacityMaskSHA256='2'*64))
    case('changed-source-pixel-count',lambda x:x['frames'][0].update(changedOpaquePixels=x['frames'][0]['changedOpaquePixels']+1))
    case('reversed-patch-list',lambda x:x['modifiedBytes'].reverse())
    case('extra-patch',lambda x:x['modifiedBytes'].append({'offset':0,'before':0,'after':255}))
    case('missing-patch',lambda x:x['modifiedBytes'].pop())
    case('tampered-patch-before',lambda x:x['modifiedBytes'][0].update(before=255))
    case('tampered-patch-after',lambda x:x['modifiedBytes'][0].update(after=244))
    case('duplicate-patch',lambda x:x['modifiedBytes'].insert(0,copy.deepcopy(x['modifiedBytes'][0])))
    case('changed-remap-rule',lambda x:x['sourcePaletteRemap'].update({'55':62}))
    case('changed-resource-name',lambda x:x.update(resourceName='TOWER.GRA'))
    case('wrong-clone-length',lambda x:x.update(editedResourceLength=x['editedResourceLength']+1))
    case('wrong-source-color-histogram',lambda x:x['sourceColorPixelsChanged'].update({'55':1}))
    for name,forged in cases:
        try:verify(exe,gra,source,forged)
        except (AssertionError,ValueError,KeyError,IndexError):passed+=1
        else:raise AssertionError('Forged case accepted: '+name)
    return {'originalValid':True,'negativeCasesRejected':passed,'caseNames':[n for n,_ in cases]}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('exe');p.add_argument('gra');p.add_argument('manifest');p.add_argument('report');a=p.parse_args()
 print(json.dumps(test(Path(a.exe).read_bytes(),Path(a.gra).read_bytes(),json.loads(Path(a.manifest).read_text()),json.loads(Path(a.report).read_text())),indent=2))
