#!/usr/bin/env python3
import sys,json,struct,hashlib
from pathlib import Path
if len(sys.argv)<4: raise SystemExit('Usage: verify-mk2-o95c-animation-stream-grammar.py <MK2.EXE> <o69-json> <o95c-json>')
exe=Path(sys.argv[1]).read_bytes(); o69=json.loads(Path(sys.argv[2]).read_text()); report=json.loads(Path(sys.argv[3]).read_text()); checks=[]
def ck(n,c,d=''):
 checks.append((n,bool(c),d))
 if not c: raise AssertionError(f'{n}: {d}')
U=lambda o:struct.unpack_from('<I',exe,o)[0]; H=lambda o:struct.unpack_from('<H',exe,o)[0]; I=lambda o:struct.unpack_from('<i',exe,o)[0]; SH=lambda o:struct.unpack_from('<h',exe,o)[0]
ck('exe_sha',hashlib.sha256(exe).hexdigest()=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65')
LE=0x28f0c;DATA=0x61c54;OBJ2_FILE=0xA0C54
ps=U(LE+0x28);pages=U(LE+0x14);objtab=LE+U(LE+0x40);objc=U(LE+0x44);mp=LE+U(LE+0x48);fpt=LE+U(LE+0x68);frt=LE+U(LE+0x6c);objs=[]
for i in range(objc): p=objtab+i*24; objs.append((i+1,U(p+12),U(p+16)))
pnums=[(exe[mp+i*4]<<16)|(exe[mp+i*4+1]<<8)|exe[mp+i*4+2] for i in range(pages)]
def pp(lp): return DATA+(pnums[lp-1]-1)*ps
def ofp(lp):
 for idx,mi,pc in objs:
  if mi<=lp<mi+pc:return idx,lp-mi
 raise AssertionError('page object')
def op(obj,off):
 _,mi,pc=objs[obj-1]; pg=off//ps
 return None if pg>=pc else pp(mi+pg)+(off%ps)
po=[U(fpt+i*4) for i in range(pages+1)]; by={}
for pg0 in range(pages):
 p=frt+po[pg0]; end=frt+po[pg0+1]
 while p<end:
  src,flags=exe[p],exe[p+1];p+=2;st=src&15;so=SH(p);p+=2
  ck('no_source_list_'+hex(p),not(src&0x20)); ck('internal_'+hex(p),(flags&3)==0)
  ob=2 if flags&0x40 else 1; tobj=H(p) if ob==2 else exe[p]; p+=ob; toff=0
  if st!=2:
   if flags&0x10: toff=U(p);p+=4
   else: toff=H(p);p+=2
  if flags&4:p+=4 if flags&0x20 else 2
  oi,pw=ofp(pg0+1); by[(oi,pw*ps+so)]=(tobj,toff,op(tobj,toff),st)
 ck('page_end_'+str(pg0),p==end)
# Authenticated code slices.
ck('interpreter_hash',hashlib.sha256(exe[0x63e79:0x63e79+0x105]).hexdigest()=='6f0826bdac12e9f51ac2fc3af55bc915dea9fccfeedfd784ead73a41bea300cf')
ck('builder_hash',hashlib.sha256(exe[0x640df:0x640df+0xbd]).hexdigest()=='64dbc1105b4a7dd9039b75c90fb4621f410063c879e152423e6c9582fb57d3dd')
# Token 0..9 dispatch table.
handler_targets=[0x224f,0x22ac,0x22bd,0x22c7,0x22e2,0x230b,0x2297,0x2282,0x2263,0x225c]
for token,target in enumerate(handler_targets):
 f=by.get((2,0x7a4+token*4)); ck(f'jump_{token}',f is not None and f[0]==1 and f[1]==target and f[3]==7,str(f))
# Direct lookup->interpreter adjacency and immediate index census.
def call_target(p): return p+5+I(p+1) if exe[p]==0xe8 else None
def sites(target): return [p for p in range(len(exe)-5) if exe[p]==0xe8 and call_target(p)==target]
def imm_before(p):
 if p>=10 and exe[p-10:p-4]==bytes.fromhex('c705785a0700'):return U(p-4)
 if p>=10 and exe[p-10]==0xb8 and exe[p-5:p]==bytes.fromhex('a3785a0700'):return U(p-9)
 return None
for label,lookup,count,expected in [('A',0x918f1,11,[0,6,7,16,38,60]),('B',0x91909,17,[0,1,2,3,4,5,7])]:
 ds=[p for p in sites(lookup) if p+5<len(exe)-5 and call_target(p+5)==0x63e79]
 vals=sorted(set(v for p in ds if (v:=imm_before(p)) is not None))
 ck(f'{label}_direct_count',len(ds)==count,str(len(ds)));ck(f'{label}_immediates',vals==expected,str(vals))
# Explicit bounded caller witness.
ck('witness_identity_write',exe[0x9509d:0x9509d+8]==bytes.fromhex('b80c000000894746'))
ck('witness_index_write',exe[0x950d0:0x950d0+10]==bytes.fromhex('c705785a070007000000'))
ck('witness_lookup_call',call_target(0x950da)==0x918f1,hex(call_target(0x950da) or 0))
ck('witness_interpreter_call',call_target(0x950df)==0x63e79,hex(call_target(0x950df) or 0))
ck('witness_slice_hash',hashlib.sha256(exe[0x9509d:0x9509d+0x47]).hexdigest()=='5b94d164fec96c7fee59a9f6a736d779ac50febf08f326505531dc9834fbba8f')
# Family A slot 12 root and nested index 7.
f=by.get((2,0x1d544+12*4));ck('slot12_root',f is not None and f[0]==2 and f[1]==0x12e74 and f[3]==7,str(f))
f=by.get((2,0x12e74+7*4));ck('slot12_index7_stream',f is not None and f[0]==2 and f[1]==0x130b8 and f[3]==7,str(f))
arrays=[0x130fc,0x13104,0x1310c,0x13114,0x1311c,0x13124,0x1312c,0x13134]; desc=[0x2a6d0,0x2a6dc,0x2a6e8,0x2a6f4,0x2a700,0x2a70c,0x2a718,0x2a724]
expected=[(125,105,56,-6,221568),(124,105,56,-6,229308),(119,108,56,-3,236988),(107,116,51,5,243896),(126,108,63,-1,250888),(139,95,69,-15,257828),(135,92,66,-18,265140),(137,89,67,-21,272484)]
# Build O69 descriptor index only from qualified/partial records, using physical address.
o69map={}
for r in o69['qualifiedResources']+o69['partialOrAmbiguousResources']:
 for s in r['streams']: o69map[s['descriptorPhysical']]=(r['resourceName'],s)
for i,(a,d,e) in enumerate(zip(arrays,desc,expected)):
 f=by.get((2,0x130b8+i*4));ck(f'stream_frame_{i}',f is not None and f[0]==2 and f[1]==a and f[3]==7,str(f))
 f=by.get((2,a));ck(f'composition_ptr_{i}',f is not None and f[0]==2 and f[1]==d and f[3]==7,str(f))
 p=op(2,a+4);ck(f'composition_zero_{i}',p is not None and U(p)==0,hex(p or 0))
 dp=OBJ2_FILE+d; w,h,x,y,ref=struct.unpack_from('<HHhhI',exe,dp); expw,exph,expx,expy,expoff=e
 ck(f'descriptor_bytes_{i}',(w,h,x,y,ref&0xffffff)==e,f'{w},{h},{x},{y},{ref&0xffffff}')
 rec=o69map.get(dp);ck(f'o69_fn0_{i}',rec is not None and rec[0]=='GO.GRA',str(rec[0] if rec else None))
 if rec:
  s=rec[1];ck(f'o69_fields_{i}',(s['width'],s['height'],s['x'],s['y'],s['graOffset'])==e,str((s['width'],s['height'],s['x'],s['y'],s['graOffset'])))
# Token 0 terminates this bounded eight-frame witness.
p=op(2,0x130d8);ck('termination_token_0',p is not None and U(p)==0,hex(p or 0))
# Reconcile report boundaries/headlines.
ck('report_format',report['format']=='mk2_animation_stream_grammar_anchor_o95c_v1')
ck('report_verdict',report['decision']['verdict']=='MK2_O95C_SHARED_STREAM_INTERPRETER_AND_BOUNDED_EIGHT_FRAME_SEQUENCE_ESTABLISHED')
ck('report_boundaries',report['decision']['universalAnimationGrammarPromoted'] is False and report['decision']['allIdentityRootEntriesClassified'] is False and report['decision']['timingEstablished'] is False and report['decision']['humanMoveNamesEstablished'] is False)
ck('report_frame_count',len(report['boundedWitness']['frames'])==8)
ck('report_loop',report['boundedWitness']['termination']['tokenObject2Offset']==0x130d8)
print(json.dumps({'status':'PASS','checks':len(checks),'failures':0,'directConsumerCalls':{'A':11,'B':17},'boundedWitness':{'identitySlot':12,'nestedIndex':7,'frames':8,'streamObject2Offset':'0x130B8','terminationTokenOffset':'0x130D8'}},indent=2))
