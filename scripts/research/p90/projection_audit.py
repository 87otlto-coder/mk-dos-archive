"""P90 partial setup-layer projection diagnostics, never a full native scene.

Uses accepted P82 source index/opacity planes and verified P90 root bindings.
Two explicit test vectors exercise translation and clipping. The second is a
synthetic accumulator perturbation, NOT an observed original camera position.
No packed floor, effect objects or live palette allocation is synthesized.
"""
import argparse,hashlib,io,json,zipfile
from pathlib import Path
from PIL import Image
from verify_root_layout import verify

def sha(b):return hashlib.sha256(b).hexdigest()
def need(x,m):
    if not x:raise ValueError('P90 projection: '+m)

def forward(indices,mask,w,h,dx,dy):
    out=bytearray(64000);alpha=bytearray(64000)
    for n,v in enumerate(indices):
        x=dx+n%w;y=dy+n//w
        if mask[n] and 0<=x<320 and 0<=y<200:out[y*320+x]=v;alpha[y*320+x]=255
    return bytes(out),bytes(alpha)

def inverse_oracle(indices,mask,w,h,dx,dy):
    # Destination-first mapping is independent of the forward clipping loop.
    pairs=[]
    for y in range(200):
      for x in range(320):
        sx,sy=x-dx,y-dy
        if sx in range(w) and sy in range(h) and mask[sy*w+sx]:pairs.append((indices[sy*w+sx],255))
        else:pairs.append((0,0))
    return bytes(v for v,a in pairs),bytes(a for v,a in pairs)

def audit(exe,layout,archive):
    acceptance=verify(exe,layout)
    outputs={};cases=[]
    with zipfile.ZipFile(archive) as z:
      need(z.testzip() is None,'ZIP CRC')
      names=z.namelist();need(len(names)==len(set(names)),'duplicate ZIP names')
      source=json.loads(z.read('O132_SCENE_LAYERS.json'))
      need(source['sourceExecutableSHA256']==sha(exe),'source EXE identity')
      need(source['status']=='STATIC_CAMERA_INDEPENDENT_LAYER_EXPORT','source schema')
      for item in source['files']:need(sha(z.read(item['path']))==item['sha256'],'asset hash')
      for stage in ('tomb','portal'):
        record=next(r for r in layout['records'] if r['stage']==stage and r['mode']=='mode_equals_2')
        original=next(r for r in source['stages'] if r['stage']==stage)
        for delta in (0,32):
          state='initializer_inputs' if delta==0 else 'synthetic_all_horizontal_plus_32'
          union=bytearray(64000);overlap=0;layers=[]
          for binding in record['setupBindings']:
            if binding['kind']!='setup_pair':continue
            setup=binding['setupObject2'];item=next(r for r in original['setupLocalLayers'] if r['setupObject2Offset']==setup)
            root=f"{stage}/setups/{item['assetId']}";idx_name=root+'_indices.png';mask_name=root+'_opacity.png'
            idx=Image.open(io.BytesIO(z.read(idx_name)));mask=Image.open(io.BytesIO(z.read(mask_name)))
            need(idx.mode==mask.mode=='L' and list(idx.size)==item['dimensions'] and idx.size==mask.size,'source dimensions/mode')
            indices=idx.tobytes();alpha=mask.tobytes();w,h=idx.size
            need(sha(indices)==item['sourceIndexSHA256'] and sha(alpha)==item['opacitySHA256'],'source planes')
            dx=binding['originSignedXY'][0]-binding['initialHorizontalInteger']-delta
            # The root+8 signed word is stored into high16 of vertical state.
            # This tests that explicit source-input choice, not a live value.
            dy=binding['originSignedXY'][1]-record['headerSignedWords'][2]
            out,opacity=forward(indices,alpha,w,h,dx,dy)
            other,other_alpha=inverse_oracle(indices,alpha,w,h,dx,dy)
            need(out==other and opacity==other_alpha,'independent projected pixels')
            for n,v in enumerate(opacity):
              if v:
                if union[n]:overlap+=1
                union[n]=255
            key=f'{stage}/{state}/{setup:05x}'
            outputs[key]=(out,opacity)
            layers.append({'setupObject2':setup,'sourceIndexPng':idx_name,'sourceOpacityPng':mask_name,
              'sourceIndexSha256':sha(indices),'sourceOpacitySha256':sha(alpha),'translation':[dx,dy],
              'visiblePixelCount':opacity.count(255),'indexSha256':sha(out),'opacitySha256':sha(opacity),
              'independentIndexMismatches':0,'independentOpacityMismatches':0})
          cases.append({'stage':stage,'state':state,'classification':'VALIDATION PENDING',
            'stateOrigin':'SOURCE_INPUT_TEST_VECTOR' if delta==0 else 'SYNTHETIC_TRANSFORM_TEST_VECTOR',
            'layers':layers,'sourceSetupCoveragePixels':union.count(255),
            'notCoveredBySetupLayers':union.count(0),'additionalLayerOverdrawPixelEvents':overlap,
            'unexplainedOriginalFramebufferPixels':None,'originalFramebufferAvailable':False})
    report={'schema':'mk2_p90_partial_projection_audit_v1','status':'PASS_CONDITIONAL_LAYER_PIXEL_PARITY',
      'archiveSha256':sha(Path(archive).read_bytes()),'layoutIndependentVerification':acceptance,'cases':cases,
      'completeStageReconstruction':False,'observedOriginalCameraPositions':0,
      'scope':'SETUP_LAYER_TRANSLATION_ONLY; NOT_PACKED_FLOOR_OR_EFFECT_OR_NATIVE_PALETTE_OR_COMPLETE_SCENE',
      'warning':'Uncovered setup pixels are not original framebuffer mismatches; there is no original capture oracle.'}
    return report,outputs

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--exe',type=Path,required=True);p.add_argument('--layout',type=Path,required=True)
    p.add_argument('--archive',type=Path,required=True);p.add_argument('--out',type=Path);p.add_argument('--private-out',type=Path);a=p.parse_args()
    report,planes=audit(a.exe.read_bytes(),json.loads(a.layout.read_text(encoding='utf-8')),a.archive)
    if a.private_out:
      output=a.private_out.resolve();private=Path(r'F:\Dev\MKEXT\FIXTURES\VALIDATION').resolve()
      need(output.is_relative_to(private) and output!=private and not output.exists(),'new private FIXTURES/VALIDATION subdirectory required')
      output.mkdir()
      for key,(indices,alpha) in planes.items():
        for suffix,pixels in (('indices',indices),('opacity',alpha)):
          path=output/(key+'_'+suffix+'.png');path.parent.mkdir(parents=True,exist_ok=True)
          Image.frombytes('L',(320,200),pixels).save(path)
      (output/'projection-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    text=json.dumps(report,indent=2)+'\n'
    if a.out:
      with a.out.open('x',encoding='utf-8') as f:f.write(text)
    else:print(text,end='')

