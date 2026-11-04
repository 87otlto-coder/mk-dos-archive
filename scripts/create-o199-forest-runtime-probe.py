#!/usr/bin/env python3
"""O199 Forest original background callback runtime probe.
Clones the user's OWN MK2 installation into separate DOSBox-friendly test folders.
No original game bytes are bundled in project source. Original fixture is never edited.
The 11-byte F9 cheat-menu unlock is applied to both clones. Exactly one bounded
five-byte CALL is replaced with NOPs in the experimental clone.
"""
import argparse, hashlib, json, os, shutil, sys, tempfile
from pathlib import Path

CANONICAL_SHA='fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
CHEAT_AT=0xccf0e
CHEAT_ORIGINAL=bytes.fromhex('1e172e162612201f1f1626')
CHEAT_UNLOCK=bytes.fromhex('4300000000000000000000')
SECOND_CALL_AT=0x82afc
SECOND_CALL_ORIGINAL=bytes.fromhex('e82147feff')
SECOND_CALL_NOP=bytes.fromhex('9090909090')
CONTROL='40_F9_CHEAT_CONTROL'
EXPERIMENT='41_FOREST_SECOND_REGISTRATION_DISABLED'

def sha(b):return hashlib.sha256(b).hexdigest()

def patch(exe:bytes,disable:bool):
 if len(exe)!=861133 or sha(exe)!=CANONICAL_SHA:raise ValueError('Canonical unmodified MK2.EXE required')
 if exe[CHEAT_AT:CHEAT_AT+11]!=CHEAT_ORIGINAL:raise ValueError('Unknown cheat-menu bytes')
 if exe[SECOND_CALL_AT:SECOND_CALL_AT+5]!=SECOND_CALL_ORIGINAL:raise ValueError('Unknown Forest registration bytes')
 out=bytearray(exe);out[CHEAT_AT:CHEAT_AT+11]=CHEAT_UNLOCK
 if disable:out[SECOND_CALL_AT:SECOND_CALL_AT+5]=SECOND_CALL_NOP
 changed=[i for i,(a,b) in enumerate(zip(exe,out)) if a!=b]
 allowed=set(range(CHEAT_AT,CHEAT_AT+11)) | (set(range(SECOND_CALL_AT,SECOND_CALL_AT+5)) if disable else set())
 if not changed or set(changed)!=allowed:raise ValueError('Unexpected patch byte difference')
 return bytes(out),changed

README='''MK2 O199 — FOREST SECOND REGISTRATION RUNTIME PROBE
==================================================
PURPOSE: Test whether Forest's SECOND initializer registration call has
an observable visual effect in real MK2 gameplay. Not proof of animation
semantics or exact timing. The source evidence is documented in O199.

This folder contains YOUR OWN copied game files, not part of the shared
MK DOS Archive source ZIP. The generator never modifies your original MK2.

INSTALL LAYOUT:
  Mortal Kombat 2\\DOSBOX\\DOSBox.exe
  Mortal Kombat 2\\MK2\\mk2.exe (original untouched)
  Mortal Kombat 2\\MK2_O199_Forest_Registration_Test\\RUN_FOREST_TESTS.cmd

Use the same original MK2 installation for both cases.
40 - F9 unlock control; original Forest registration logic intact.
41 - F9 unlock + ONLY the 5-byte CALL at original EXE offset 0x82AFC
     replaced with five NOPs; the surrounding stack balance is unchanged.

For each run:
  1. Press F9 on copyright screen and F9 again in intro.
  2. Enable Cheat Mode, select BACKGROUND = THE LIVING FOREST / FOREST.
  3. Enter a fight with the same fighters, stage and startup settings.
  4. Capture screenshots or recordings of the opening and subsequent
     scene behavior for 40 and 41, using comparable camera positions.
  5. Upload both captures plus PROBE_MANIFEST.json for comparison.

IMPORTANT: The experimental executable is NOT a verified playable patch.
If it crashes, record exactly when. A visible difference is evidence that
this call may matter; unchanged graphics do NOT prove that the callback
never runs. The selected runtime mode is NOT directly measured by this kit.
No guarantee that the selected background or startup conditions execute
this call or that suppression has a visible effect.
Do not copy either edited executable over your original installation.
'''

LAUNCHER=r'''@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
for %%I in ("%ROOT%..") do set "PARENT=%%~fI"
set "DOSBOX=%PARENT%\DOSBOX\DOSBox.exe"
if not exist "%DOSBOX%" (echo DOSBox not found: "%DOSBOX%" & pause & exit /b 1)
:MENU
echo.
echo === MK2 O199 FOREST CONTROLLED REGISTRATION TEST ===
echo 40 - F9 cheat control, both original Forest callback registration calls
echo 41 - Second registration call replaced by NOPs, first retained
echo Q - Quit
echo.
set "GAME="
set /p CHOICE=Select 40 or 41 or Q:
if "%CHOICE%"=="40" set "GAME=40_F9_CHEAT_CONTROL"
if "%CHOICE%"=="41" set "GAME=41_FOREST_SECOND_REGISTRATION_DISABLED"
if not defined GAME exit /b 0
set "DIR=%ROOT%%GAME%"
if not exist "%DIR%\mk2.exe" (echo Missing executable: "%DIR%\mk2.exe" & pause & exit /b 1)
echo Press F9 at copyright, F9 in intro, enable cheats and choose FOREST.
set "CONF=%TEMP%\mk2_o199_%RANDOM%_%RANDOM%.conf"
>"%CONF%" echo [autoexec]
>>"%CONF%" echo mount c "%DIR%"
>>"%CONF%" echo c:
>>"%CONF%" echo mk2
"%DOSBOX%" -conf "%CONF%"
if exist "%CONF%" del /q "%CONF%"
goto MENU
'''

def game_exe(source):
 matches=[p for p in source.iterdir() if p.is_file() and p.name.lower()=='mk2.exe']
 if len(matches)!=1:raise ValueError('Supply the MK2 game folder containing exactly one MK2.EXE')
 return matches[0]

def build(source:Path,out:Path):
 source=source.resolve();out=out.resolve()
 if not source.is_dir():raise ValueError('Source MK2 folder not found')
 if out.exists():raise FileExistsError('Output path already exists; refusing to overwrite: '+str(out))
 if source==out or source in out.parents or out in source.parents:raise ValueError('Output must not contain or be inside source game folder')
 for p in source.rglob('*'):
  if p.is_symlink():raise ValueError('Symbolic links are not supported for safe cloning: '+str(p))
 exe_path=game_exe(source);original=exe_path.read_bytes();control,control_deltas=patch(original,False);trial,trial_deltas=patch(original,True)
 if out.parent.exists() is False:raise ValueError('Output parent directory must already exist')
 staged=Path(tempfile.mkdtemp(prefix='.o199_staging_',dir=out.parent))
 try:
  originals={str(p.relative_to(source)):sha(p.read_bytes()) for p in source.rglob('*') if p.is_file()}
  cases={}
  for name,patched,changed in [(CONTROL,control,control_deltas),(EXPERIMENT,trial,trial_deltas)]:
   clone=staged/name;shutil.copytree(source,clone)
   copy_exe=clone/exe_path.name;copy_exe.write_bytes(patched)
   for rel,identity in originals.items():
    data=(clone/rel).read_bytes()
    if rel!=exe_path.name and sha(data)!=identity:raise ValueError('Unexpected change to '+rel)
   if copy_exe.read_bytes()!=patched:raise ValueError('Written executable mismatch')
   cases[name]={'patchedExeSHA256':sha(patched),'changedByteOffsets':changed,
    'originalOtherFilesPreserved':True,'modifiedOriginalGameDirectory':False}
  manifest={'format':'mkdos_o199_forest_second_registration_runtime_probe_v1',
   'originalExeSHA256':CANONICAL_SHA,'sourceFileCount':len(originals),
   'sourceOtherFiles':len(originals)-1,'experimentalCallPhysical':SECOND_CALL_AT,
   'originalCallBytesHex':SECOND_CALL_ORIGINAL.hex(),'patchedCallBytesHex':SECOND_CALL_NOP.hex(),
   'unlockPatchPhysical':CHEAT_AT,'cases':cases,'runtimeEvidenceCollected':False,
   'hypothesis':'Suppressing second source-reachable Forest registration might change scene behavior; this is not established'}
  (staged/'PROBE_MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
  (staged/'README_FIRST.txt').write_text(README)
  (staged/'RUN_FOREST_TESTS.cmd').write_text(LAUNCHER,newline='\r\n')
  os.rename(staged,out)
  return manifest
 except BaseException:
  shutil.rmtree(staged,ignore_errors=True)
  raise

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('originalMk2GameDirectory',type=Path)
 parser.add_argument('newOutputDirectory',type=Path)
 args=parser.parse_args()
 manifest=build(args.originalMk2GameDirectory,args.newOutputDirectory)
 print(json.dumps({'newTestDirectory':str(args.newOutputDirectory),'originalExeSHA256':manifest['originalExeSHA256'],'cases':manifest['cases']},indent=2))
