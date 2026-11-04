#!/usr/bin/env python3
"""O242 — bounded direct-store census of MK2 position integration gate.

The source directly writes both zero and one to global 0x762DE, which the
frame-composition path copies into global 0x75A88 to gate XY integration.
This does not prove fatality live gate states or exclude indirect writes.
"""
import argparse,zipfile,hashlib,struct,json
from pathlib import Path
EXE='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
PIT='af6c10b676011cbbd0b8ef3fe4523cf52b36ebd3be15b2dcb4190b9a34c81d96'
FALL='60e6c56f7720b2bda89714b818c885e41c523e978807697d0d7d8f07d37551a0'
def h(x):return hashlib.sha256(x).hexdigest()
def m(e,p,t):
 v=bytes.fromhex(t);assert e[p:p+len(v)]==v,(hex(p),t)
# Physical starting instruction address, direct immediate+store to 0x762DE.
WRITERS={0x7092c:0,0x70bf2:1,0x766a2:1,0x768b8:1,0x77100:1,0x77621:1,0x77635:0,0x77644:1,0x77e40:1,0x77e4f:0}
# CHECK offsets individually; the final explicit opcode sequence must be exact.
def verify(e):
 found=[]
 for p,v in WRITERS.items():
  match=f'33 c0 a3 de 62 07 00' if v==0 else f'b8 01 00 00 00 a3 de 62 07 00'
  m(e,p,match)
  found.append({'physical_at':hex(p),'value':v,'sequence':match})
 # Original frame comp loads the same gate from that global to global 0x75A88.
 m(e,0x93539,'52 8b 15 de 62 07 00 89 15 88 5a 07 00 5a')
 m(e,0x931f6,'f7 05 88 5a 07 00 ff ff ff ff 75 0c')
 m(e,0x93202,'8b 5d 10 01 5d 18 8b 5d 14 01 5d 1c')
 # Further original reader at 0x70950; tests nonzero. Not a writer.
 m(e,0x70950,'a1 de 62 07 00 a9 ff ff ff ff')
 # Exhaustive *literal* source occurrence census, not all possible aliases.
 needle=bytes.fromhex('de 62 07 00');offs=[];s=0
 while True:
  i=e.find(needle,s)
  if i<0:break
  offs.append(i);s=i+1
 assert len(offs)==28, len(offs)
 assert all(e[p+3:p+7]==needle if v==0 else e[p+6:p+10]==needle for p,v in WRITERS.items())
 return {'global_state':'0x762DE','literal_4byte_occurrences':len(offs),'direct_literal_store_count':len(WRITERS),'zero_writes':sum(v==0 for v in WRITERS.values()),'one_writes':sum(v==1 for v in WRITERS.values()),'writers':found,'related_reads':[{'physical':'0x70950','role':'reads global and tests nonzero'},{'physical':'0x9353B','role':'reads global to stage 0x75A88 composition gate'}],'position_gate':{'state_copy':'0x9353A..0x93540 global 0x762DE to 0x75A88','skip_position_adds_when':'0x75A88 != 0','object_integrator':'0x93202..0x9320D'},'qualified_examples':{'writer_cluster_776':'0x77621 sets 1, 0x77635 sets 0, 0x77644 sets 1 within nearby source (runtime paths not proven)','writer_cluster_77e':'0x77E40 sets 1, 0x77E4F sets 0 in nearby code'},'not_proven':['whether the fatality executes any specific writer','live value of global 0x762DE during falling object composition','indirect writes or aliasing of the same loaded global','main fighter and walker object identity equality','exact video presentation timing'], 'confidence': 'VERIFIED direct source store shapes and destination; runtime paths UNKNOWN'}
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--game-zip',required=True,type=Path);ap.add_argument('--out',required=True,type=Path);a=ap.parse_args()
 assert not a.out.exists()
 with zipfile.ZipFile(a.game_zip) as z:
  bs={n:z.read('mk2/'+n) for n in ('mk2.exe','pit.gra','fall.gra')}
 assert (h(bs['mk2.exe']),h(bs['pit.gra']),h(bs['fall.gra']))==(EXE,PIT,FALL)
 e=bs['mk2.exe'];res=verify(e)
 controls={}
 for p,v in WRITERS.items():
  controls[f'writer_opcode_{p:x}']=p
  controls[f'writer_destination_{p:x}']=p+(3 if v==0 else 6)
 for n,p in [('source_copy',0x9353c),('gate_copy',0x93540),('position_gate',0x931fc),('position_branch',0x93200),('x_add',0x93206),('y_add',0x9320c),('independent_read',0x70952)]:controls[n]=p
 failures=[]
 for name,p in controls.items():
  b=bytearray(e);b[p]^=1
  try:verify(b)
  except AssertionError:failures.append(name)
  else:raise AssertionError('undetected '+name)
 a.out.mkdir(parents=True)
 f=a.out/'O242_PIT_POSITION_GATE_DIRECT_WRITERS.json'
 f.write_text(json.dumps({'schema':'o242_pit_position_gate_direct_writer_census_v1','fixture_sha256':{'exe':EXE,'pit':PIT,'fall':FALL},'source':res,'mutation_controls_rejected':failures},indent=2)+'\n')
 print(json.dumps({'report':str(f),'sha256':h(f.read_bytes()),'negative_controls':len(failures)}))
if __name__=='__main__':main()
