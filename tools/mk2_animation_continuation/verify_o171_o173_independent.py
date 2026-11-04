#!/usr/bin/env python3
"""Independent verification of O171–O173. Re-decodes LE fixups and source bytes;
does not load the producing module nor trust its reported source anchors.
"""
import argparse, hashlib, json, struct
from pathlib import Path
EXEH='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
B1=0x61c54;B2=0xa0c54;L=0x28f0c
TARGETS=(0x224f,0x22ac,0x22bd,0x22c7,0x22e2,0x230b,0x2297,0x2282,0x2263,0x225c)
GRAMMAR=('return','jump_to_DWORD_pointer','call_helper_no_extra_operands','signed_i16_then_helper','two_signed_i16_then_helper','DWORD_then_helper_and_carry','DWORD_indirect_code_call','DWORD_then_helper','WORD_condition_then_DWORD_jump_or_skip','call_helper_and_continue')
CODE={
0x63e79:'a1785a07008b00',0x63e80:'8305785a070004',0x63e87:'a9ffffffff7415',0x63e8e:'83f8097611',0x63ea4:'c1e00205a40700008b00ffe0',0x63ea3:'c3',0x63f00:'a1785a07008b00a3785a0700',0x63f11:'e8af030000',0x63f1b:'a1785a07000fbf00',0x63f36:'a1785a07000fbf00',0x63f5f:'a1785a07008b00',0x63f7c:'f9c3',0x63eeb:'a1785a07008b00',0x63ef9:'ffd0',0x63ed6:'a1785a07008b00',0x63eb7:'a1785a07000fb700',0x63ecb:'7233',0x63eb0:'e823040000',0x63e93:'e847020000',0x63ea2:'f8',
0x86cc5:'8b15785a07008b1a',0x86ccd:'8305785a070004',0x86cd4:'f7c30000f0ff',0x86cdc:'b800000200668bc3',0x86ce4:'3bd8',0x86ce8:'8325685a0700ef',0x86cef:'81e3ffff0000',0x86cf5:'091d685a0700',0x86d26:'e851ca0000',0x86d33:'f7c30000f0ff',0x86d3b:'83fb00',0x86d40:'83fb01',0x86d46:'8b5204',0x86d49:'8915785a0700',0x86d50:'f8c3',0x86d52:'f9c3',
0x665fa:'ba58430800',0x665ff:'8b5820',0x66603:'8b501c',0x66613:'8b12',0x6661d:'8b4a20',0x66620:'3bd9',0x66622:'7fe9',0x66624:'7c0b',0x66626:'8b4a1c',0x66629:'390d6c5a0700',0x6662f:'7fdc',0x66631:'8910',0x93390:'8b6d00',0x93393:'85ed',0x93395:'0f8549feffff',0x935a1:'8be8',0x935a3:'e8e8fdffff',0x931f6:'f705885a0700ffffffff',0x93205:'015d18',0x9320b:'015d1c',0x9320e:'f705d462050001000000'
}
SETS={
 'O171':set([0x63e79,0x63e80,0x63e87,0x63e8e,0x63ea4,0x63ea3,0x63f00,0x63f11,0x63f1b,0x63f36,0x63f5f,0x63f7c,0x63eeb,0x63ef9,0x63ed6,0x63eb7,0x63ecb,0x63eb0,0x63e93,0x63ea2]),
 'O172':set([0x86cc5,0x86ccd,0x86cd4,0x86cdc,0x86ce4,0x86ce8,0x86cef,0x86cf5,0x86d26,0x86d33,0x86d3b,0x86d40,0x86d46,0x86d49,0x86d50,0x86d52]),
 'O173':set([0x665fa,0x665ff,0x66603,0x66613,0x6661d,0x66620,0x66622,0x66624,0x66626,0x66629,0x6662f,0x66631,0x93390,0x93393,0x93395,0x935a1,0x935a3,0x931f6,0x93205,0x9320b,0x9320e])}

def u32(b,p):return struct.unpack_from('<I',b,p)[0]
def independently_reconstruct_fixups(b):
 if b[L:L+2]!=b'LE' or u32(b,L+0x14)!=113 or u32(b,L+0x44)!=2:raise ValueError('Wrong MK2 LE header')
 table=L+u32(b,L+0x40)
 first=[u32(b,table+i*24+12) for i in range(2)]
 pages=[u32(b,table+i*24+16) for i in range(2)]
 if first!=[1,64] or pages!=[63,50]:raise ValueError('Bad LE object structure')
 ptrtab=L+u32(b,L+0x68);raw=L+u32(b,L+0x6c)
 targets={(1,0x63ea8-B1):(2,0x7a4)}
 targets.update({(2,0x7a4+4*i):(1,v) for i,v in enumerate(TARGETS)})
 matches={};count=0
 for pg in range(113):
  obj=1 if pg<63 else 2
  page_no=(pg if obj==1 else pg-63)
  p=raw+u32(b,ptrtab+4*pg);end=raw+u32(b,ptrtab+4*(pg+1))
  if end<p or end>len(b):raise ValueError('Out of range original fixup page')
  while p<end:
   if end-p<4:raise ValueError('Truncated fixup')
   opcode,flags= b[p],b[p+1];sourceoff=struct.unpack_from('<h',b,p+2)[0];p+=4
   if flags&3:raise ValueError('Unknown external fixup')
   if flags&64:
    objto=struct.unpack_from('<H',b,p)[0];p+=2
   else:objto=b[p];p+=1
   if (opcode & 15)!=2:
    dest=u32(b,p) if flags&16 else struct.unpack_from('<H',b,p)[0];p+=4 if flags&16 else 2
   else:dest=None
   if flags&4:p+=4 if flags&32 else 2
   key=(obj,page_no*4096+sourceoff)
   if key in targets:
    if (opcode&15)!=7 or (objto,dest)!=targets[key]:raise ValueError('Missing typed LE object link '+str(key))
    matches[key]=(objto,dest)
   count+=1
  if p!=end:raise ValueError('Fixup page overrun')
 if count!=27004 or matches!=targets:raise ValueError('Incomplete original typed fixups')
 return len(matches)

def check(b,reports):
 if len(b)!=861133 or hashlib.sha256(b).hexdigest()!=EXEH:raise ValueError('Noncanonical original MK2.EXE')
 for p,h in CODE.items():
  s=bytes.fromhex(h)
  if b[p:p+len(s)]!=s:raise ValueError('Original opcode absent '+hex(p))
 refcount=independently_reconstruct_fixups(b)
 if [u32(b,B2+0x7a4+4*i) for i in range(10)]!=list(TARGETS):raise ValueError('Wrong table entries')
 if 0x935a3+5+struct.unpack_from('<i',b,0x935a4)[0]!=0x93390:raise ValueError('Renderer iterator mismatch')
 if 0x86d26+5+struct.unpack_from('<i',b,0x86d27)[0]!=0x9377c:raise ValueError('Render object consumer mismatch')
 if 0x93395+6+struct.unpack_from('<i',b,0x93397)[0]!=0x931e4:raise ValueError('Loop target mismatch')
 if 0x66622+2+struct.unpack_from('<b',b,0x66623)[0]!=0x6660d:raise ValueError('First insertion compare target')
 if 0x66624+2+struct.unpack_from('<b',b,0x66625)[0]!=0x66631:raise ValueError('Second insertion compare target')
 for name,idx in SETS.items():
  r=reports[name]
  if r.get('schema')!={'O171':'mk2_o171_alternate_animation_command_dispatch_v1','O172':'mk2_o172_original_normal_stream_special_flags_v1','O173':'mk2_o173_within_list_original_insert_and_draw_order_v1'}[name] or r.get('originalExeSHA256')!=EXEH:raise ValueError('Wrong report origin/schema')
  w=r.get('witnesses')
  if not isinstance(w,list) or len(w)!=len(idx):raise ValueError('Incomplete report witnesses')
  seen=set()
  for x in w:
   at=int(x['physicalOffset'],16)
   if at in seen or at not in idx or x['originalBytes']!=CODE[at]:raise ValueError('Report source forged')
   seen.add(at)
  if seen!=idx:raise ValueError('Witness omission')
 a=reports['O171']
 expected=[{'token':i,'originalObject1Target':v,'physicalHandler':B1+v,'operandForm':GRAMMAR[i]} for i,v in enumerate(TARGETS)]
 if a.get('table')!={'object2Offset':0x7a4,'physicalFileOffset':B2+0x7a4,'entries':expected,'sourcePointerRelocationObject':2,'entryRelocationTargetObject':1}:raise ValueError('Alternate jump table changed')
 if a.get('limits')!={'handlersSourceProven':True,'callbacksEverExecutedInFight':False,'safeToBlindlyDecodeAllListsAsThisGrammar':False,'zeroTokenSetsCarry':False,'animationTimingKnown':False}:raise ValueError('Alternate safety claims')
 if a.get('unknownCommand')!='values greater than 9 call 0x640DF and return carry clear':raise ValueError('Unknown command incorrectly labeled')
 a=reports['O172']
 if a.get('cursorGlobalOperand')!=0x75a78 or a.get('specialClass')!={'constructedPrefix':0x20000,'sourceLow16':True,'condition':'EBX equals 0x20000 OR low16(EBX)','flagStorageOperand':0x75a68,'clearMask':0xffffffef,'orSourceLow16':True}:raise ValueError('Special flags altered')
 if (a.get('sourceFirstDescriptorConsumer'),a.get('sourceLoopToken'),a.get('sourceZeroToken'),a.get('carrySetOnlyOnSourceZero'))!=(0x9377c,1,0,True):raise ValueError('Normal token semantic altered')
 if a.get('limits')!={'separateFromAlternateInterpreter':True,'specialFlagMeaningFullyKnown':False,'runtimeFlagsKnown':False,'actualDrawStateProven':False}:raise ValueError('Normal token overclaim')
 a=reports['O173']
 if (a.get('linkedNodeNextField'),a.get('insertKeyOffsets'),a.get('ordering'))!=(0,[0x20,0x1c],'signed_int32_lexicographic_ascending_at_insertion; equals inserted before existing'):raise ValueError('Sort claim wrong')
 if a.get('positiveControlTokenToRenderer')!={'rootInEBPAtPhysical':0x935a1,'callIteratorAtPhysical':0x935a3,'iterateAtPhysical':0x93390,'nextField':0}:raise ValueError('Render loop evidence')
 if a.get('conditionalMotion')!={'mutatedPositionFields':[0x18,0x1c],'motionGateOperand':0x75a88,'drawGateOperand':0x562d4}:raise ValueError('Motion evidence wrong')
 if a.get('limits')!={'withinListInsertionOrderSourceProven':True,'linkedTraversalUsesSameNextField':True,'laterPositionsMayMutate':True,'alwaysCurrentlySorted':False,'interListDrawOrderProven':False,'runtimeListContentsObserved':False}:raise ValueError('Rendered order overclaim')
 return len(CODE)+refcount+3*4+6
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--exe',required=True);p.add_argument('--reports',required=True);a=p.parse_args();b=Path(a.exe).read_bytes()
 print('PASS O171–O173 independent assertions:',check(b,{k:json.loads((Path(a.reports)/(k+'_REPORT.json')).read_text()) for k in SETS}))
