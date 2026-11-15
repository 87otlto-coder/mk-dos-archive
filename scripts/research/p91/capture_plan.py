"""P91: exact original-source plan for relocation-aware frame capture.

No game execution, P90 projection or graphics export. The generated plan has
code fingerprints, not original code bytes, and can be committed as metadata.
"""
import argparse,hashlib,json,struct,sys
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
O1=0x61c54;O2=0xa0c54
BOUNDARIES={'frame_entry':(0x67050,0x67068),'draw_entry':(0x933c2,0x933e9),
 'draw_ret':(0x935e5,0x935e6),'present_entry':(0x65420,0x65435),
 'scheduler_entry':(0x670dd,0x6710f)}

def need(x,m):
    if not x:raise ValueError('P91 plan: '+m)
def make(b,root):
    need(hashlib.sha256(b).hexdigest()==SHA,'canonical MK2.EXE required')
    sys.path.insert(0,str(Path(root)/'tools/mk2_native_stage_palettes'))
    from trace_o120_setup_graph import fixups
    fx=fixups(b)
    # Fresh claims only: source call order, buffer swap, mutable object update,
    # palette-slot extent and object allocation size. Not P90 revalidation.
    pins={0x670c7:'f705d462050001000000750a',0x670d8:'e843e3ffff',
      0x654c5:'c7052e66070024650500c7052a660700245f0600',
      0x654ee:'c7052e660700245f0600c7052a66070024650500',
      0x931f6:'f705885a0700ffffffff',0x93202:'8b5d10015d188b5d14015d1c',
      0x936e9:'b9160000008bf833c0f3ab8bc783e858',
      0x7b44c:'80fb3c',0x7b4b1:'8814dd065b0700'}
    for at,h in pins.items():need(b[at:at+len(h)//2].hex()==h,'source anchor '+hex(at))
    windows=[]
    for name,(a,z) in BOUNDARIES.items():
      data=bytearray(b[a:z]);relocs=[]
      for f in fx.values():
        p=f['sourcePhysical']
        if not a<=p<z:continue
        need(p+4<=z and f['kind']==7 and f['flags']==16,'window relocation type/bounds')
        relocs.append({'byteOffset':p-a,'targetObject':f['targetObject'],'targetOffset':f['targetOffset']})
        data[p-a:p-a+4]=b'\0'*4
      windows.append({'name':name,'physical':a,'object1Offset':a-O1,'length':z-a,
        'relocations':sorted(relocs,key=lambda x:x['byteOffset']),'maskedSha256':hashlib.sha256(data).hexdigest()})
    le=0x28f0c;ot=le+struct.unpack_from('<I',b,le+0x40)[0]
    objects=[{'number':i+1,'virtualSize':struct.unpack_from('<I',b,ot+24*i)[0],
      'preferredBaseNotRuntimeBase':struct.unpack_from('<I',b,ot+24*i+4)[0]} for i in range(2)]
    # Reuse the accepted Tomb stream grammar solely to select actual draw-list
    # heads. Adjacent globals (e.g. 0x84354/0x8435C) are not assumed to be lists.
    cursor=0x17300;commands=[];heads=[]
    for _ in range(32):
      token=struct.unpack_from('<i',b,O2+cursor)[0];site=cursor;cursor+=4
      if token==0:break
      if token>0:
        channel=struct.unpack_from('<I',b,O2+cursor)[0]
        for p,value in ((site,token),(cursor,channel)):
          r=fx.get((2,p));need(r and r['targetObject']==2 and r['targetOffset']==value,'typed Tomb command pointer')
        commands.append({'kind':'object_list','headObject2':token,'horizontalWordObject2':channel});heads.append(token);cursor+=4
      elif token==-1:
        commands.append({'kind':'packed_floor','arguments':list(struct.unpack_from('<3I',b,O2+cursor))});cursor+=12
      else:need(token==-2,'unexpected Tomb command');commands.append({'kind':'conditional_effect'})
    else:raise ValueError('P91 plan: unterminated Tomb stream')
    return {'schema':'mk2_p91_capture_plan_v1','sourceExeSha256':SHA,
      'requiredOriginalFingerprints':{'MK2.EXE':SHA,'TOMB.GRA':'be4f2427e79ff50eaca2fdbfb2fb6f534d9b61fb20cc79744648401d07a9b613',
        'IMAGES.GRA':'2b26796a64c2aebfee75832696aeae9bbcf9df56d82cb9a39df58a557d3ad8cf'},
      'objects':objects,'windows':windows,
      'mapping':{'discoveryPhysical':0x67050,'dataOperandByteOffset':2,'dataOperandTargetObject2':0x562d4,
        'object1LinearBase':'CS.base + EIP - (physical - 0x61C54)',
        'object2OperandBias':'relocated inline DWORD - original Object2 target offset',
        'object2LinearBase':'DS.base + object2OperandBias',
        'acceptance':'All masked code windows and every relocation must agree; never use LE preferred bases as loaded bases.'},
      'stateObject2':{'mode':0x3014c,'stage':0x7747f,'controlStream':0x75cf6,'renderGate':0x562d4,
        'updateEnable':0x75cf2,'alternatePath':0x563e0,'drawBuffer':0x7662a,'lastPresentedBuffer':0x7662e,
        'horizontalAccumulators':list(range(0x84310,0x84334,4)),'vertical':0x842e8,'verticalRate':0x842e4,
        'listHeads':heads,'movementGate':0x75a88,
        'paletteSlots':{'offset':0x75b00,'count':60,'stride':8},'resourceTable':{'offset':0x2f434,'stride':24}},
      'target':{'stage':1,'mode':2,'controlStreamObject2':0x17300,'sourceCommandOrder':commands},
      'renderObject':{'bytes':0x58,'nextOffset':0,'xVelocity':0x10,'yVelocity':0x14,'xPosition':0x18,
        'yPosition':0x1c,'sortKey':0x20,'shapeFlags':0x24,'resourceToken':0x28,'dimensions':0x2c,
        'paletteHandle':0x30,'objectFlags':0x34,'descriptor':0x3c,'clipFlags':0x4a},
      'pairing':'draw-entry -> draw-ret stores generation keyed by source buffer -> present-entry byte equality -> scheduler-entry after PRESENT',
      'classification':'VERIFIED_STATIC_SOURCE','originalRuntimeObserved':False}

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--exe',type=Path,required=True);p.add_argument('--source-root',type=Path,default=Path(__file__).resolve().parents[3]);p.add_argument('--out',type=Path);a=p.parse_args()
    s=json.dumps(make(a.exe.read_bytes(),a.source_root),indent=2)+'\n'
    if a.out:
      with a.out.open('x',encoding='utf-8') as f:f.write(s)
    else:print(s,end='')
