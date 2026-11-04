#!/usr/bin/env python3
"""O209 Gate 1: bounded static investigation of MK2 DOS stage-fatality hotkey feasibility.

No original files are modified; no gameplay patch is generated. This script
intentionally does not claim stage initializer == fatality dispatcher.
"""
import argparse, hashlib, json, struct, sys
from pathlib import Path

HERE = Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[2] / 'tools' / 'mk2_native_stage_palettes'))
from verify_o120_independent import parse_fixups  # independently established LE parser

CANON = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
OBJ1,OBJ2 = 0x61c54, 0xa0c54
MODES = {'mode_equals_2':0x15bec,'mode_equals_1':0x15c68,'mode_other':0x15ce4}
STAGES = {0:('Dead Pool','DEDPOOL.GRA'),1:('Kombat Tomb','TOMB.GRA'),6:('The Pit II','PIT.GRA')}
# Original callback pointer at stage root offset 0x10; these are stage init
# callbacks, not demonstrated fatality handlers.
KNOWN_INITIALIZERS = {0:0x82447,1:0x82cd7,6:0x831b2}
MENU_STRINGS = {'fatality_1':(0xce041,b'FATALITY 1\x00'),
                'fatality_2':(0xce04c,b'FATALITY 2\x00'),
                'babality':(0xce057,b'BABALITY\x00'),
                'friendship':(0xce060,b'FRIENDSHIP\x00')}
AUDIO_NAMES = {'pit_descent_audio_label':(0xd1d02,b'PITFALL '),
               'pit_fatality_music_a':(0xb50f5,b'PIT2EA\x00'),
               'pit_fatality_music_b':(0xb50fc,b'PIT2EB\x00')}
CODE_ANCHORS={
  'stage_mode_2_compare':(0x82334, bytes.fromhex('833d4c01030002')),
  'stage_mode_1_compare':(0x82342, bytes.fromhex('833d4c01030001')),
  'stage_root_load':(0x82353, bytes.fromhex('8b00')),
  'cheat_menu_keyboard_esc':(0x9b3e3, bytes.fromhex('3c1b')),
  'cheat_menu_keyboard_up':(0x9b3eb, bytes.fromhex('663d0048')),
  'cheat_menu_keyboard_left':(0x9b3f1, bytes.fromhex('663d004b')),
  'cheat_menu_keyboard_right':(0x9b3f7, bytes.fromhex('663d004d')),
  'cheat_menu_keyboard_down':(0x9b401, bytes.fromhex('663d0050')),
  'cheat_menu_selection_handler':(0x9b4f5,bytes.fromhex('813d6f020300e4d00200')),
}

def check(x,msg):
 if not x: raise ValueError('O209 Gate1 rejected: '+msg)

def u32(b,p):return struct.unpack_from('<I',b,p)[0]

def typed_ptr(b,fix,owner,addr,dest_owner):
 v=u32(b,(OBJ1 if owner==1 else OBJ2)+addr)
 check(fix.get((owner,addr))==(7,16,dest_owner,v),f'LE relocation from Obj{owner}+0x{addr:X} to Obj{dest_owner}+0x{v:X}')
 return v

def build_report(b):
 digest=hashlib.sha256(b).hexdigest()
 check(len(b)==861133 and digest==CANON,'canonical executable fingerprint')
 fix,total=parse_fixups(b)
 check(total==27004 and len(fix)==26994,'complete LE fixup census')
 stages=[]
 for i,(name,resource) in STAGES.items():
  rows=[]
  for mode,base in MODES.items():
   entry=base+4*i
   root=typed_ptr(b,fix,2,entry,2)
   callback=typed_ptr(b,fix,2,root+0x10,1)
   callback_p=OBJ1+callback
   check(callback_p==KNOWN_INITIALIZERS[i], f'known stage initializer {name} {mode}: {callback_p:#x}')
   rows.append({'mode':mode,'stageRootObject2':f'0x{root:X}',
     'rootPointerFieldPhysical':f'0x{OBJ2+entry:X}',
     'initializerPointerFieldPhysical':f'0x{OBJ2+root+0x10:X}',
     'initializerObject1':f'0x{callback:X}',
     'initializerPhysical':f'0x{callback_p:X}',
     'initializerEntryBytes':b[callback_p:callback_p+24].hex(),
     'pointerRelocationsAuthenticated':True})
  check(len(set(row['initializerPhysical'] for row in rows))==1,'stage initializer diverged by mode')
  stages.append({'index':i,'name':name,'resourceName':resource,
    'sourceFamily':'background stage initialization, not identified fatality dispatch',
    'configurations':rows})
 check(len(set(s['configurations'][0]['initializerPhysical'] for s in stages))==3,
       'three stage initializers are distinct')
 names={}
 for name,(addr,raw) in {**MENU_STRINGS,**AUDIO_NAMES}.items():
  check(b[addr:addr+len(raw)]==raw,'original label bytes '+name)
  names[name]={'physicalOffset':f'0x{addr:X}', 'rawHex':raw.hex(),
               'text':raw.rstrip(b'\0').decode('latin1'),
               'semanticBound':'menu literal' if name in MENU_STRINGS else 'audio/media label, NOT execution proof'}
 code={}
 for name,(at,raw) in CODE_ANCHORS.items():
  check(b[at:at+len(raw)]==raw,name)
  code[name]={'physicalOffset':f'0x{at:X}','instructionBytes':raw.hex(),
              'windowPhysicalStart':f'0x{at-16:X}','windowHex':b[at-16:at+len(raw)+32].hex()}
 check(typed_ptr(b,fix,1,0x82330-OBJ1,2)==0x15bec,'mode2 selector relocation')
 check(typed_ptr(b,fix,1,0x8233e-OBJ1,2)==0x15c68,'mode1 selector relocation')
 check(typed_ptr(b,fix,1,0x8234c-OBJ1,2)==0x15ce4,'fallback selector relocation')
 # Verified menu-selection opcode references option-row *addresses*, but these
 # toggle cheat fields; no stage-fatality selector is identified.
 for ptr in [0x2d0e4,0x2d100,0x2d11c,0x2d138]:
  check(ptr.to_bytes(4,'little') in b[0x9b4f5:0x9b580],
        'cheat option handling comparison')
 return {'schema':'mk2_o209_stage_fatality_gate1_static_v1','sourceSHA256':digest,
  'status':'GATE1_NO_GO_FOR_HOTKEY_PATCH',
  'scope':{'passes':3,'game':'original DOS MK2','patchGenerated':False,
           'gameFilesModified':False,'runtimeFatalityDispatcherLocated':False},
  'leRelocations':{'records':total,'uniqueSites':len(fix)},
  'pass1':{'title':'Original stage/source identity and setup roots','stages':stages,
           'interpretation':'Three distinct relocation-backed stage INITIALIZER functions. Not fatality entry points.'},
  'pass2':{'title':'Original cheat-menu options and handler','optionAndMediaLabels':names,
           'instructionAnchors':code,
           'interpretation':'The documented cheat menu names Fatality 1 and 2, Babality and Friendship, with no explicit Stage Fatality selection. The handler identified here is menu navigation/toggle logic, not a fatality executor.'},
  'pass3':{'title':'Candidate reuse and patch-safety gate',
           'sharedStageConfigurationSelector':{'mode2TableObject2':'0x15BEC','mode1TableObject2':'0x15C68','fallbackTableObject2':'0x15CE4','codeSite':'0x82321'},
           'disqualifiedCandidatePaths':[{'path':'stage root +0x10 initializer','reason':'initializes stage resources/behavior; no source evidence it invokes a finishing move'},
             {'path':'cheat-menu Fatality 1/2 selection','reason':'menu selection/toggle code has not established a stage-fatality action ID'},
             {'path':'PITFALL / PIT2EA / PIT2EB strings','reason':'audio/media identifiers do not authenticate corresponding execution path'},
             {'path':'generic stage-selection code','reason':'selects stage background; no safe injection path to finishing-state logic'}],
           'necessaryBeforePatch':['Identify authentic finishing-state dispatch site and stage-specific action ID(s)',
             'Establish fighter and round preconditions and register/stack conventions',
             'Verify call effects and safe trigger location for each stage',
             'Build a reversible isolated clone and collect DOSBox runtime witness'],
           'decision':'STOP at Gate 1 as agreed. No defensible stage-fatality hotkey entry point yet.'},
  'limitations':['Static original-source evidence, no original stage-fatality forced or observed at runtime',
    'Disassembled instruction windows do not alone prove control-flow reachability in active fighting state',
    'The scratch global 0x75A80 is reused and must not be assumed to be a stable stage identifier',
    'No negative claim that a shared fatality dispatcher does not exist',
    'No original game assets or executable should be included in evidence ZIP']}

def main():
 a=argparse.ArgumentParser();a.add_argument('--exe',type=Path,required=True);a.add_argument('--out',type=Path,required=True);x=a.parse_args()
 check(not x.out.exists(),'output already exists')
 report=build_report(x.exe.read_bytes());x.out.parent.mkdir(parents=True,exist_ok=True)
 x.out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':report['status'],'sourceSHA256':report['sourceSHA256'],
                   'checkedStages':[x['name'] for x in report['pass1']['stages']],
                   'originalRelocations':report['leRelocations']['records']}))
if __name__=='__main__':main()
