#!/usr/bin/env python3
"""O118 runtime gate: five isolated full game copies with 80-vs-79 palette-record probes.
Original source is user-supplied canonical mk2.zip; unmodified original stays untouched.
One original color word per experiment becomes VGA DAC6 bright magenta (0x7C1F).
No inference of active palette handles; only DOSBox can establish visual behavior.
"""
import zipfile,hashlib,json,struct,argparse,io
from pathlib import Path
SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CHEAT_AT=0xCCF0E;CHEAT_ORIG=bytes.fromhex('1e172e162612201f1f1626');CHEAT_NEW=bytes.fromhex('4300000000000000000000')
# probe tuple (record offset, palette count, source index, index-to-word shift, label)
CASES={
 '40_CHEAT_CONTROL':None,
 '41_TOMB_80_RECORD':(0x893c6,80,41,1,'Kombat Tomb'),
 '42_TOMB_79_RECORD':(0x8cdbe,79,41,2,'Kombat Tomb'),
 '43_PORTAL_80_RECORD':(0x891e0,80,67,1,'The Portal'),
 '44_PORTAL_79_RECORD':(0x8cd1e,79,67,2,'The Portal'),
}
MAGENTA=0x7C1F
h=lambda b:hashlib.sha256(b).hexdigest()

def game_sources(path):
 with zipfile.ZipFile(path) as z:
  all_files={p[len('mk2/'):].lower():z.read(p) for p in z.namelist() if p.startswith('mk2/') and not p.endswith('/')}
 assert len(all_files)==614,len(all_files)
 assert h(all_files['mk2.exe'])==SHA
 return all_files

def patch(original,rule):
 assert len(original)==861133 and h(original)==SHA
 assert original[CHEAT_AT:CHEAT_AT+11]==CHEAT_ORIG
 ex=bytearray(original);ex[CHEAT_AT:CHEAT_AT+11]=CHEAT_NEW
 edits=[]
 if rule is not None:
  offset,n,index,shift,stage=rule
  assert struct.unpack_from('<H',original,offset)[0]==n
  word_pos=offset+2+(index-shift)*2
  old=struct.unpack_from('<H',original,word_pos)[0]
  struct.pack_into('<H',ex,word_pos,MAGENTA)
  edits=[{'stage':stage,'sourceIndex':index,'countedPaletteRecordPhysical':offset,'recordCount':n,
       'recordWordOrdinal':index-shift,'wordPhysical':word_pos,
       'originalWordHex':f'{old:04x}','patchedWordHex':f'{MAGENTA:04x}',
       'expectedVGA8':[255,4,255]}]
 allowed=set(range(CHEAT_AT,CHEAT_AT+11))
 for r in edits:allowed|=set(range(r['wordPhysical'],r['wordPhysical']+2))
 changed=[p for p in range(len(original)) if original[p]!=ex[p]]
 assert changed and set(changed)<=allowed
 assert ex[CHEAT_AT:CHEAT_AT+11]==CHEAT_NEW
 return bytes(ex),{'editedRecords':edits,'changedByteOffsets':changed,'patchedExeSHA256':h(ex)}

def make_readme():
 return '''MK2 O118 — SOURCE PALETTE 80-vs-79 RUNTIME TEST
=================================================
PURPOSE: Find which original EXE palette source records, if any, visibly influence
Kombat Tomb and The Portal stage floors. This will not prove a live handle value.

Extract MK2_O118_Palette_Ownership_Test beside your original DOSBOX and MK2 folders.
Double-click RUN_PALETTE_TESTS.cmd. Your installed MK2 folder stays untouched.

Run ONLY these five setups:
  40 - untouched graphics, EXE with F9 cheat unlock; establish stage control
  41 - TOMB, 80-color record at EXE offset 0x893C6, source byte 41 -> magenta
  42 - TOMB, 79-color record at EXE offset 0x8CDBE, source byte 41 -> magenta
  43 - PORTAL, 80-color record at EXE offset 0x891E0, source byte 67 -> magenta
  44 - PORTAL, 79-color record at EXE offset 0x8CD1E, source byte 67 -> magenta

For 40: capture one original Tomb or Portal floor if convenient (prior controls exist).
For 41 & 42: choose BACKGROUND = KOMBAT TOMB.
For 43 & 44: choose BACKGROUND = THE PORTAL.

Game setup for each copy: Press F9 at copyright screen, then F9 during intro;
CHEAT MODE On, choose Background; exit menu and start first match.
Capture an active fight, ideally before characters obstruct the floor; Ctrl+F5
in DOSBox saves a native screenshot. Label 41,42,43,44 and send them together.

EXPECTED (hypothesis, NOT runtime evidence): If the altered palette record
actually provides floor RGB in that fight, some floor pixels or other objects
may show bright magenta. If there is no change, do not interpret it as proof
of no connection without considering dynamic allocation, alternate paths,
restoration, palette fades and display timing.

All 5 installations are 614-file copies. The ONLY edits are the 11 F9-unlock
bytes of MK2.EXE, plus one 16-bit palette word in each of variants 41–44.
All original commercial game resource files are byte-identical in all copies.
Never overwrite your original MK2 directory.
No DOSBox gameplay was possible on the research machine: runtime unknown.
'''

def launcher():
 s='''@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
for %%I in ("%ROOT%..") do set "PARENT=%%~fI"
set "DOSBOX=%PARENT%\\DOSBOX\\DOSBox.exe"
if not exist "%DOSBOX%" (
 echo DOSBox not found: "%DOSBOX%"
 echo Put MK2_O118_Palette_Ownership_Test beside DOSBOX and MK2.
 pause
 exit /b 1
)
:CHOOSE
echo.
echo === MK2 O118 ORIGINAL PALETTE RECORD TESTS ===
echo 40 - Control (original graphics)
echo 41 - TOMB 80-color record magenta
echo 42 - TOMB 79-color record magenta
echo 43 - PORTAL 80-color record magenta
echo 44 - PORTAL 79-color record magenta
echo Q - Quit
echo.
set /p CHOICE=Choose 40-44 or Q: 
set "GAME=" 
'''
 for key in CASES:s+=f'if "%CHOICE%"=="{key[:2]}" set "GAME={key}"\n'
 s+='''if not defined GAME exit /b 0
set "DIR=%ROOT%%GAME%"
if not exist "%DIR%\\mk2.exe" (echo Missing game directory: "%DIR%" & pause & exit /b 1)
echo Starting %GAME%. Press F9 at copyright, then F9 during intro.
echo Toggle Cheat Mode ON, set Background to Tomb for 41/42 or Portal for 43/44.
echo Capture active fight with Ctrl+F5. Name screenshot by test number.
set "CONF=%TEMP%\\mk2_o118_%RANDOM%_%RANDOM%.conf"
>"%CONF%" echo [autoexec]
>>"%CONF%" echo mount c "%DIR%"
>>"%CONF%" echo c:
>>"%CONF%" echo mk2
"%DOSBOX%" -conf "%CONF%"
if exist "%CONF%" del /q "%CONF%"
goto CHOOSE
'''
 return s

def build(zpath,kit_zip):
 files=game_sources(zpath);source=files['mk2.exe'];manifest={
  'format':'mk2_o118_palette_record_executable_runtime_gate_v1','canonicalExeSHA256':SHA,
  'stageFloorPayloadsOriginal':True,'runtimeProven':False,'expectedStageFloorChanges':'HYPOTHESIS',
  'colorPatchWord':'7c1f','units':'physical original EXE offsets',
  'cases':{},'canonicalCommercialResourceCount':len(files),
  'safety':'Each variant isolated 614-file copy; unrelated source files preserved; no user original overwritten'}
 root='MK2_O118_Palette_Ownership_Test/'
 with zipfile.ZipFile(kit_zip,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as out:
  out.writestr(root+'README_FIRST.txt',make_readme())
  out.writestr(root+'RUN_PALETTE_TESTS.cmd',launcher())
  for label,rule in CASES.items():
   patched,m=patch(source,rule)
   manifest['cases'][label]=m
   for file,data in sorted(files.items()):
    if file=='mk2.exe':data=patched
    out.writestr(root+label+'/'+file,data)
  out.writestr(root+'PROBE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
 assert zipfile.ZipFile(kit_zip).testzip() is None
 return manifest

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('originalMK2ZIP',type=Path);p.add_argument('outputZIP',type=Path);p.add_argument('manifestOutput',type=Path);a=p.parse_args()
 assert not a.outputZIP.exists() and not a.manifestOutput.exists()
 m=build(a.originalMK2ZIP,a.outputZIP)
 a.manifestOutput.write_text(json.dumps(m,indent=2)+'\n')
 print(json.dumps({'cases':list(m['cases']),'archiveSize':a.outputZIP.stat().st_size,'archiveSHA256':h(a.outputZIP.read_bytes())},indent=2))
