#!/usr/bin/env python3
from pathlib import Path
import hashlib,json,struct,sys
root=Path(sys.argv[1]); report_path=Path(sys.argv[2]); out=Path(sys.argv[3]); report=json.loads(report_path.read_text())
files={p.name.upper():p for p in root.iterdir() if p.is_file()}; exe=files['MK2.EXE'].read_bytes(); jc0=files['JC0.GRA'].read_bytes();checks=[]
def ck(i,ok,detail):checks.append({'id':i,'passed':bool(ok),'detail':str(detail)})
def sha(b):return hashlib.sha256(b).hexdigest()
def i32(o):return struct.unpack_from('<i',exe,o)[0]
def u16(o):return struct.unpack_from('<H',exe,o)[0]
ck('exe_sha',sha(exe)=='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65',sha(exe));ck('exe_size',len(exe)==861133,len(exe));ck('report_verdict',report['decision']['verdict']=='MK2_PALETTE_STORAGE_ALLOCATION_AND_DAC_TRANSFER_ESTABLISHED_JC0_BINDING_UNRESOLVED',report['decision']['verdict'])
# independent LE file-backed boundary
le=0x28f0c;tail=struct.unpack_from('<I',exe,le+0x80)[0]+112*4096+struct.unpack_from('<I',exe,le+0x2c)[0];ck('file_backed_end',tail==0xabd79,hex(tail));ck('allocator_file_backed',0x7b439<tail,hex(0x7b439));
# diagnostics
for ident,text,off in [('getpal',b'mk: Ran out of palettes in GETPAL.\n',0xa0e08),('palset',b'mk: Ran out of palettes in PALSET.\n',0xa0e2c)]:ck(ident+'_string',exe.find(text)==off,hex(exe.find(text)))
# exact code spans independently hashed
spans={
'queue_init_enqueue':(0x7b2c0,0x7b30b,'bfee57e1d842380996ef90d4b17539d4e5773fe70d184dc23e2e9b87197c1253'),
'palette_transfer':(0x7b30b,0x7b3f8,'d922d6d95d6580d641bf7e58a69a164e0bed8462319638d187b7e1eaebe942e1'),
'object_release_bridge':(0x7b3f8,0x7b404,'9297cab37fae675450b81087d3d7afb65993d3d129c0fb54008241fec9de46b5'),
'palette_table_init':(0x7b41f,0x7b439,'555654d02d79962d05031515408380cb4c0f9a8c018d8b1d41d445f621ef29f2'),
'palette_allocator':(0x7b439,0x7b505,'abdd7eba4bbda3a1fe136d46abd78469ccdfbb47b1849bda15329f93fb501b9c'),
'palette_release':(0x7b505,0x7b55e,'268e49d3c5f9133e1efdbfa32b16d05dbc7e2768b2e95e81b43c9727af3520cf'),
'dynamic_selector_object_store':(0x81db0,0x81df0,'e3ae40a6c9f56c8c48e0ee2f254ab94440d4137cb962b825a9fa8269c0fbb134'),
'dynamic_pointer_object_store':(0x85c60,0x85c90,'eb79ff9d3e0ccf8b3226a743aa99dd1b61eb0bde8252d7ab9bedb0d1299d6451'),
'structure_pointer_object_store':(0x86b10,0x86b35,'feba0a1760b46d9ef192a0ef07a48aa74fa3bfe5796946899b7cfcfdf54dc3e9'),
'sequential_palette_block_allocator':(0x98c45,0x98c8d,'fa809cc486d2b029b93e7a305b684712f9143d0e4c04f979abdd4e66170fc976'),
'bytecode_palette_pointer_caller':(0x9959a,0x995b9,'6e855db0f0a73379d836e758db8961cc1c011ceff336a0efbdb6a0ce3b25d459')}
for k,(a,z,h) in spans.items():ck('span_'+k,sha(exe[a:z])==h,sha(exe[a:z]))
# direct relative call census within file-backed object2 area
calls=[]
for p in range(0x7a600,tail-5):
 if exe[p]==0xe8 and p+5+i32(p+1)==0x7b439:calls.append(p)
expected=[0x81dda,0x85abf,0x85c79,0x86b1f,0x989af,0x98c65,0x98c79,0x98d6f,0x995a6,0x9964f,0x997ba,0x9ab0e,0x9abd9,0x9d626,0x9e3be]
ck('direct_call_count',len(calls)==15,len(calls));ck('direct_call_sites',calls==expected,[hex(x) for x in calls]);ck('report_call_sites',report['codeEvidence']['paletteAllocatorDirectCallSites']==expected,report['codeEvidence']['paletteAllocatorDirectCallSitesHex'])
# queue layout from literal instructions
ck('queue_ring_literals',exe[0x7b2c0:0x7b2ca]==bytes.fromhex('b8d8620500a3d8630500') and b'\xd8\x63\x05\x00' in exe[0x7b2ca:0x7b30b],exe[0x7b2c0:0x7b2ca].hex());ck('queue_entry_writes',exe[0x7b2d7:0x7b2e4]==bytes.fromhex('8901668951046689590683c108'),exe[0x7b2d7:0x7b2e4].hex());ck('queue_slots',(0x563d8-0x562d8)//8==32,32);ck('queue_report',report['requestQueue']['slotCount']==32 and report['requestQueue']['entryByteLength']==8,report['requestQueue']);
# palette record grammar and handles from instructions
ck('record_count_read',exe[0x7b489:0x7b48f]==bytes.fromhex('668b1883c002'),exe[0x7b489:0x7b48f].hex());ck('record_formula_report',report['paletteRecordFormat']['recordByteLengthFormula']=='2 + colorCount * 2',report['paletteRecordFormat']);ck('handle_limit_cmp',exe[0x7b44b:0x7b451]==bytes.fromhex('4380fb3c7ced'),exe[0x7b44b:0x7b451].hex());ck('handle_init_clear',exe[0x7b427:0x7b435]==bytes.fromhex('bf005b0700b97800000033c0f3ab'),exe[0x7b427:0x7b435].hex());ck('handle_count',report['paletteHandles']['entryCount']==60,report['paletteHandles']['entryCount']);ck('object_release_field',exe[0x7b3f9:0x7b3fd]==bytes.fromhex('0fb74030'),exe[0x7b3f9:0x7b3fd].hex());ck('object_field_report',report['paletteHandles']['objectPaletteHandleOffset']==0x30,report['paletteHandles']['objectPaletteHandleOffsetHex']);
# DAC port + component transformation literals
transfer=exe[0x7b30b:0x7b3f8];ck('vga_ports',bytes.fromhex('66bada03') in transfer and bytes.fromhex('bac8030000') in transfer,'0x3DA / 0x3C8');ck('component0',bytes.fromhex('c1e809243f0c01ee') in transfer,'>>9 &3F |1');ck('component1',bytes.fromhex('c1e804243f0c01ee') in transfer,'>>4 &3F |1');ck('component2',bytes.fromhex('d1e0243f0c01ee') in transfer,'<<1 &3F |1');ck('dac_report',report['dacTransfer']['statusPort']=='0x3DA' and report['dacTransfer']['writeIndexPort']=='0x3C8' and report['dacTransfer']['componentPort']=='0x3C9',report['dacTransfer']);
# object assignment paths
ck('dynamic_table_store',exe[0x81dda]==0xe8 and exe[0x81ddf:0x81de3]==bytes.fromhex('66894530'),exe[0x81ddf:0x81de3].hex());ck('dynamic_ptr_store',exe[0x85c79]==0xe8 and exe[0x85c7e:0x85c82]==bytes.fromhex('66894730'),exe[0x85c7e:0x85c82].hex());ck('structure_ptr_store',exe[0x86b1f]==0xe8 and exe[0x86b30:0x86b34]==bytes.fromhex('66894730'),exe[0x86b30:0x86b34].hex());ck('bytecode_pointer_call',exe[0x9959f:0x995ab]==bytes.fromhex('8bd88b0783c704e88e1efeff'),exe[0x9959f:0x995ab].hex());
# sequential palette-record traversal
ck('block_first_count',exe[0x98c60:0x98c65]==bytes.fromhex('8bc70fb71f'),exe[0x98c60:0x98c65].hex());ck('block_advance',exe[0x98c6c:0x98c70]==bytes.fromhex('8d7c5f02'),exe[0x98c6c:0x98c70].hex());ck('block_report',report['selectionSurface']['sequentialPaletteBlockAllocator']['recordTraversal']=='next = current + 2 + 2 * current.colorCount',report['selectionSurface']['sequentialPaletteBlockAllocator']);
# structural candidates are explicitly examples, never ownership
for p,n,end in [(0x891e0,80,0x89282),(0x89282,80,0x89324),(0x8cd1e,79,0x8cdbe),(0x8cdbe,79,0x8ce5e)]:ck('candidate_'+hex(p),u16(p)==n and p+2+2*n==end,(u16(p),hex(p+2+2*u16(p))))
ck('candidate_policy',all(x['classification']=='STRUCTURAL_CANDIDATE_ONLY_NOT_OWNERSHIP' for x in report['structuralRecordExamples']),[x['classification'] for x in report['structuralRecordExamples']]);ck('naive_chain_rejected',report['correction']['naive223RecordChainObservedDuringReconnaissance'] and not report['correction']['naive223RecordChainPromoted'],report['correction']);
# independently reconstruct JC0 descriptor count/index domain to ensure boundary is not silently strengthened
def decode(data,off,w,h):
 pos=off;used=set()
 for _ in range(h):
  x=0
  while x<w:
   if pos+4>len(data):raise ValueError
   cmd=struct.unpack_from('<I',data,pos)[0]
   if cmd&1:n=cmd>>1;pos+=4
   elif cmd&2:n=cmd>>10;used.add((cmd>>2)&255);pos+=4
   else:
    n=cmd>>2;pos+=4
    if n<1 or n>64 or pos+n>len(data):raise ValueError
    used.update(data[pos:pos+n]);pos+=(n+3)&~3
   if n<1 or x+n>w:raise ValueError
   x+=n
 return pos-off,used
overlay=range((tail+3)&~3,len(exe)-11,4);found=[]
for p in overlay:
 w,h,x,y=struct.unpack_from('<HHhh',exe,p);ref=struct.unpack_from('<I',exe,p+8)[0];rid=ref>>24;off=ref&0xffffff
 if rid!=109 or not(1<=w<=640 and 1<=h<=480 and -1000<=x<=1000 and -1000<=y<=1000) or off>=len(jc0):continue
 try:l,u=decode(jc0,off,w,h);found.append((p,off,w,h,l,u))
 except Exception:pass
found.sort(key=lambda x:(x[1],x[0]));union=set().union(*(x[5] for x in found));tiles=all(x[1]+x[4]==(found[i+1][1] if i+1<len(found) else len(jc0)) for i,x in enumerate(found))
ck('jc0_descriptor_count',len(found)==35,len(found));ck('jc0_tiling',tiles and found[0][1]==0,(found[0][1],found[-1][1]+found[-1][4],len(jc0)));ck('jc0_index_domain',union==set(range(1,64)),(min(union),max(union),len(union)));ck('jc0_report_unbound',report['jc0Boundary']['descriptorCount']==35 and not report['jc0Boundary']['concretePaletteRecordBindingEstablished'] and not report['jc0Boundary']['correctColorRgbaEstablished'],report['jc0Boundary']);ck('decision_boundary',not report['decision']['jc0PaletteOwnershipEstablished'] and not report['decision']['correctColorRgbaEstablished'] and not report['decision']['mk1PaletteAssumptionsImported'],report['decision']);
failed=[c for c in checks if not c['passed']];res={'format':'mk2_o71_independent_audit_v1','reportSha256':sha(report_path.read_bytes()),'checkCount':len(checks),'passedCount':len(checks)-len(failed),'failedCount':len(failed),'allChecksPassed':not failed,'checks':checks,'decision':{'paletteMechanismIndependentlyReconstructed':not failed,'jc0PaletteOwnershipEstablished':False,'correctColorRgbaEstablished':False,'naive223RecordChainPromoted':False,'verdict':'MK2_O71_PALETTE_MECHANISM_INDEPENDENT_AUDIT_PASSED' if not failed else 'AUDIT_FAILED'}};out.write_text(json.dumps(res,indent=2));print(json.dumps({k:res[k] for k in ['reportSha256','checkCount','passedCount','failedCount','allChecksPassed']},indent=2));
if failed:print(json.dumps(failed,indent=2));sys.exit(1)
