#!/usr/bin/env python3
"""Independent O169 source token control and list audit, no producer dependency."""
import argparse,hashlib,json,struct
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
# Physical original executable offsets, distinct original reads from earlier O140 producer.
HEADS=[('tomb_flying_a','Tomb',0x17814,8,1),('tomb_flying_b','Tomb',0x177ec,8,1),
 ('portal_swaying','Portal',0x164b4,7,1),('portal_hanging','Portal',0x164d8,7,0),
 ('portal_electric','Portal',0x164f8,6,0),('tower_original_effect','Tower',0x16490,7,1)]
SOURCE={0x86cc5:'8b15785a0700',0x86ccb:'8b1a',0x86ccd:'8305785a070004',
 0x86cd4:'f7c30000f0ff',0x86d2b:'8b15785a07008b1a',0x86d33:'f7c30000f0ff',
 0x86d3b:'83fb00',0x86d3e:'7412',0x86d40:'83fb01',0x86d46:'8b5204',
 0x86d49:'8915785a0700',0x86d50:'f8c3',0x86d52:'f9c3',
 0x86ca1:'e81f000000',0x86ca6:'720a',0x86cab:'e85f04feff'}

def verify(b,r):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=SHA:raise ValueError('Require canonical EXE')
 if r.get('originalExeSHA256')!=SHA or r.get('originalExeLength')!=861133 or r.get('schema')!='mk2_o169_original_effect_list_loop_and_carry_semantics_v1':raise ValueError('Provenance')
 if r.get('originalExeObject2FileBase')!=0xa0c54 or r.get('distinctDescriptorCount')!=43:raise ValueError('Wrong source coordinate base/count')
 witnesses=r.get('witnesses',[])
 if len(witnesses)!=len(SOURCE):raise ValueError('Incorrect control witness coverage')
 observed=set()
 for row in witnesses:
  at=int(row['physicalOffset'],16)
  if at not in SOURCE or at in observed or SOURCE[at]!=row['originalBytes']:raise ValueError('False original code identity')
  obs=bytes.fromhex(SOURCE[at])
  if b[at:at+len(obs)]!=obs:raise ValueError('Original source byte corrupted')
  observed.add(at)
 if observed!=set(SOURCE):raise ValueError('Missing instruction witness')
 for at,dest in [(0x86ca6,0x86cb2),(0x86d3e,0x86d52)]:
  if at+2+struct.unpack_from('<b',b,at+1)[0]!=dest:raise ValueError('Wrong carry branch')
 if b[0x86ca1]!=0xe8 or 0x86ca6+struct.unpack_from('<i',b,0x86ca2)[0]!=0x86cc5:raise ValueError('Wrong instruction target')
 expected={'cursorGlobalAddressOperand':0x75a78,'sentinelLoopToken':1,'sentinelStopToken':0,'callSite':0x86ca1,
   'streamReader':0x86cc5,'postReaderStopFlag':'carry','carryExitDestination':0x86cb2,'noncarryTaskYieldCall':0x86cab}
 if r.get('sourceMechanism')!=expected:raise ValueError('Wrong cursor grammar')
 limits={'sourceLoopTerminationVerified':True,'loopIterationTimeMeasured':False,'liveObjectActivationObserved':False,
         'allEffectsActiveAtOnceProven':False,'renderedFPSProven':False,'runtimeFramePlacementProven':False}
 if r.get('limits')!=limits:raise ValueError('False runtime claims')
 if len(r.get('tracks',[]))!=len(HEADS):raise ValueError('Incorrect list count')
 seen=[]
 for row,(name,stage,start,n,marker) in zip(r['tracks'],HEADS):
  p=0xa0c54+start
  original=[struct.unpack_from('<I',b,p+4*j)[0] for j in range(n)]
  found=struct.unpack_from('<I',b,p+n*4)[0]
  if found!=marker:raise ValueError('Bad list terminator')
  if marker==1 and struct.unpack_from('<I',b,p+n*4+4)[0]!=start:raise ValueError('Bad list return pointer')
  goal={'name':name,'stage':stage,'sourceListObject2':start,'sourceListPhysical':p,
     'originalDescriptorPointersObject2':original,'frameCount':n,'terminalToken':marker,
     'termination':'loop_to_original_list_start' if marker else 'zero_marker_carry_exit',
     'terminalPointerObject2':start if marker else None,
     'postDescriptorCursorBehavior':'rewind_to_beginning_on_loop_lookahead' if marker else 'caller_exits_on_carry_marker'}
  if row!=goal:raise ValueError('List tokens, identity or interpretation tampered')
  seen.extend(original)
 if len(seen)!=43 or len(set(seen))!=43:raise ValueError('Unexpected sprite list duplicate')
 return len(SOURCE)+len(HEADS)*7+12
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--exe',required=True);ap.add_argument('--report',required=True);a=ap.parse_args()
 print('PASS O169 original list-token source assertions:',verify(Path(a.exe).read_bytes(),json.loads(Path(a.report).read_text())))
