#!/usr/bin/env python3
"""Independent O199 original LE-fixup and exported-Forest-initializer evidence verifier.
Does not use the browser report producer. Requires original unpatched MK2.EXE.
"""
import argparse,hashlib,json,struct,zipfile,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools/mk2_native_stage_palettes'))
from trace_o120_setup_graph import fixups,OBJ1,OBJ2,EXE_SHA

def verify(game,package):
 p=Path(game);exe=(p/'MK2.EXE') if (p/'MK2.EXE').is_file() else (p/'mk2.exe')
 b=exe.read_bytes();assert len(b)==861133 and hashlib.sha256(b).hexdigest()==EXE_SHA
 def d(at):return struct.unpack_from('<I',b,at)[0]
 def i(at):return struct.unpack_from('<i',b,at)[0]
 fx=fixups(b)
 def typed(src_obj,src_at,target_obj,target_off):
  v=fx.get((src_obj,src_at));assert v and (v['kind'],v['flags'],v['targetObject'],v['targetOffset'])==(7,16,target_obj,target_off),(src_obj,hex(src_at),v)
  assert d((OBJ1 if src_obj==1 else OBJ2)+src_at)==target_off
 # Independently ground the Forest root-mode references and initializer pointer.
 tables=(0x15bec,0x15c68,0x15ce4);roots=(0x16b56,0x16bda,0x16c46)
 for table,root in zip(tables,roots):
  typed(2,table+16,2,root)
  typed(2,root+0x10,1,0x82ad4-OBJ1)
 # Ground each registered function pointer via a typed relocation and its relative call target.
 for at,target in [(0x82adb,0x82b04),(0x82af7,0x82c44)]:
  assert b[at]==0xba and b[at+5]==0xe8
  typed(1,at+1-OBJ1,1,target-OBJ1)
  assert at+10+i(at+6)==0x67222
  assert b[at-5:at]==bytes.fromhex('bb06000000')
 assert b[0x82ae7:0x82af0]==bytes.fromhex('833d4c010300007413')
 typed(1,0x82ae9-OBJ1,2,0x3014c) # operand starts at 0x82ae9
 assert b[0x82b01:0x82b04]==bytes.fromhex('595ac3')
 # Verify helper actually stores EDX into object +1C and BX into +04.
 assert b[0x67222:0x6722d]==bytes.fromhex('5551a1085b030085c07452')
 typed(1,0x67225-OBJ1,2,0x35b08)
 assert b[0x67248:0x6724e]==bytes.fromhex('89501c896808')
 assert b[0x67272:0x6727f]==bytes.fromhex('66895804c7404c000000005dc3')
 with zipfile.ZipFile(package) as z:
  assert z.testzip() is None and len(z.namelist())==9
  assert not any(n.lower().endswith(('.exe','.gra')) for n in z.namelist())
  j=json.loads(z.read('evidence/report.json'));manifest=json.loads(z.read('MANIFEST.json'))
  assert manifest['originalExeSHA256']==EXE_SHA
  assert j['source']['exeSHA256']==EXE_SHA
  assert j['source']['initializerPhysical']==0x82ad4
  assert j['source']['modeGlobalObject2']==0x3014c
  assert [r['targetPhysical'] for r in j['registrations']]==[0x82b04,0x82c44]
  assert [m['modeValue'] for m in j['modes']]==[0,1,2,3]
  assert [m['rootObject2'] for m in j['modes']]==[roots[2],roots[1],roots[0],roots[2]]
  assert [m['setupVariantsReferenced'] for m in j['modes']]==[[1,2,5],[1,2,5],[1,2,3,4,5],[1,2,5]]
  assert [m['initializerRegistrationsReached'] for m in j['modes']]==[['first'],['first','second'],['first','second'],['first','second']]
  for r,at,end in zip(j['registrations'],(0x82adb,0x82af7),(0x82c44,0x82cd7)):
   assert r['pointerOperandPhysical']==at+1
   assert r['pointerSourceObject1']==at+1-OBJ1
   assert r['targetObject1']==r['targetPhysical']-OBJ1
   assert r['codeBytesHex']==b[at:at+10].hex()
   assert r['targetFunctionBytesHex']==b[r['targetPhysical']:end].hex()
   assert r['targetFunctionSHA256']==hashlib.sha256(b[r['targetPhysical']:end]).hexdigest()
   assert r['groupArgumentEBX']==6 and r['liveObjectAllocated'] is False
   assert r['functionExecutedDuringGameplay'] is False
  assert j['helperEvidence']['codeBytesHex']==b[0x67222:0x6728b].hex()
  assert j['functionObservations']['first']['originalBoundedConstants']==[100,80,84,320,12,64]
  assert j['functionObservations']['second']['rawImmediateEdxValues']==[0x650106,0x650232,0x650352]
 print('PASS independent O199: 3 root dispatch pointers + 3 initializer pointers + 2 function typed pointers + mode guard + pool helper, exported full function byte windows and 4 conditional cases')
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('originalMk2Directory');p.add_argument('forensicZip');args=p.parse_args();verify(args.originalMk2Directory,args.forensicZip)
