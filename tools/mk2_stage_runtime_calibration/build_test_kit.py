#!/usr/bin/env python3
"""Generate independent full-game DOSBox calibration test installs from user-owned MK2 ZIP.

Game binaries are NEVER included in the project source: output is a separate
runtime test kit for the owner of the original files. Fail closed on fixture
identity and never overwrite an existing kit.
"""
from __future__ import annotations
import argparse,hashlib,json,zipfile
from pathlib import Path
from calibration import cheat_exe,pattern_plane,sha,RESOURCES,CANONICAL_EXE_SHA,CHEAT_SHA

VARIANTS={
 '20_CHEAT_CONTROL':None,
 '21_TOMB_X_RULER':('tomb.gra','x-ruler'),
 '22_TOMB_Y_RULER':('tomb.gra','y-ruler'),
 '23_TOMB_INDEX_RAMP':('tomb.gra','ramp'),
 '24_PORTAL_X_RULER':('portal.gra','x-ruler'),
 '25_PORTAL_Y_RULER':('portal.gra','y-ruler'),
 '26_PORTAL_INDEX_RAMP':('portal.gra','ramp'),
}
README=r'''MK2 O113 STAGE CALIBRATION — PLEASE START HERE
=================================================
PURPOSE: Learn which authentic 896-column stage source bytes reach the
actual DOSBox 320x200 arena floor, and how source indexes map to color.
The project source does not contain this kit's commercial game assets.

YOUR ORIGINAL INSTALLATION IS NOT ALTERED. Unzip this folder so that:
  Mortal Kombat 2\DOSBOX\DOSBox.exe
  Mortal Kombat 2\MK2\MK2.EXE       (your original game)
  Mortal Kombat 2\MK2_O113_Calibration\RUN_CALIBRATION.cmd

Double-click RUN_CALIBRATION.cmd and choose an experiment.

THE IMPORTANT THREE SCREENSHOTS:
  20 CONTROL: use BACKGROUND = THE PORTAL; screenshot active gameplay.
  24 PORTAL X RULER: use BACKGROUND = THE PORTAL; screenshot active gameplay.
  21 TOMB X RULER: use BACKGROUND = KOMBAT TOMB; screenshot active gameplay.

If those look good, optional followups:
  22 TOMB Y RULER: Tomb, row-code source placement.
  23 TOMB INDEX RAMP: Tomb, raw-index-to-visible-color probe.
  25 PORTAL Y RULER: Portal, row-code source placement.
  26 PORTAL INDEX RAMP: Portal, raw-index-to-visible-color probe.

For each independent game copy:
  1. Press F9 once at the early COPYRIGHT screen.
  2. Press F9 again during the intro to open the hidden cheat menu.
  3. Set CHEAT MODE = ON and set BACKGROUND to the arena above.
  4. Exit menu, start fight with F1, choose a character.
  5. Capture *an active fight with the stage floor visible*.
     DOSBox Ctrl+F5 generally saves a native 320x200 PNG. A screenshot
     of the visible window is fine if native capture is inconvenient.
  6. Label screenshots with experiment number. Send the images together.

RULER EXPERIMENTS:
  X: 32 distinct ordered binary 28-byte stripe cells fill 896 source bytes.
     Any 5 neighboring cells give a unique column fingerprint.
  Y: 64-bit binary source-row code, of which 40 or 48 rows are present.
  RAMP: 4-source-byte steps cycle through the original observed source-index
     domain. This does NOT assume a palette RGB or a valid allocated bank.

The floor may display unexpected colors. THAT IS NOT A FAILURE. The goal is
visual provenance: left/source crop, rows, and eventual color mapping.
The renderer may compose other visual layers over these pixels.

IMPORTANT SAFETY:
  * All folders are copies; MK2.EXE only has the O110Z 11-byte F9 cheat edit.
  * Exactly one .GRA authenticated packed suffix differs in each experiment.
  * Every unrelated original game file is byte-identical.
  * Never copy these patches onto the original install.
  * No DOSBox runtime was possible in the research environment. This kit is
    STATICALLY VERIFIED; visual observations are needed from Windows.
'''
LAUNCHER=r'''@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
for %%I in ("%ROOT%..") do set "PARENT=%%~fI"
set "DOSBOX=%PARENT%\DOSBOX\DOSBox.exe"
if not exist "%DOSBOX%" (
 echo DOSBox.exe not found: "%DOSBOX%"
 echo Place MK2_O113_Calibration beside your DOSBOX and MK2 folders.
 pause
 exit /b 1
)
:CHOOSE
echo.
echo === MK2 O113 SOURCE / PALETTE CALIBRATION ===
echo 20 - Original source control
 echo 21 - TOMB X ruler (HORIZONTAL CROP) **
echo 22 - TOMB Y ruler (VERTICAL PLACEMENT)
echo 23 - TOMB source-index color ramp
echo 24 - PORTAL X ruler (HORIZONTAL CROP) **
echo 25 - PORTAL Y ruler (VERTICAL PLACEMENT)
echo 26 - PORTAL source-index color ramp
echo Q  - Quit
echo.
set /p CHOICE=Choose 20-26 or Q: 
set "GAME="
if "%CHOICE%"=="20" set "GAME=20_CHEAT_CONTROL"
if "%CHOICE%"=="21" set "GAME=21_TOMB_X_RULER"
if "%CHOICE%"=="22" set "GAME=22_TOMB_Y_RULER"
if "%CHOICE%"=="23" set "GAME=23_TOMB_INDEX_RAMP"
if "%CHOICE%"=="24" set "GAME=24_PORTAL_X_RULER"
if "%CHOICE%"=="25" set "GAME=25_PORTAL_Y_RULER"
if "%CHOICE%"=="26" set "GAME=26_PORTAL_INDEX_RAMP"
if not defined GAME exit /b 0
set "DIR=%ROOT%%GAME%"
if not exist "%DIR%\mk2.exe" (
 echo Missing full MK2 installation: "%DIR%".
 pause
 exit /b 1
)
echo.
echo Game: %GAME%
echo Press F9 at copyright, then F9 at intro. Enable Cheat Mode and
 echo set Background to KOMBAT TOMB or THE PORTAL before starting the fight.
echo Ctrl+F5 in DOSBox to capture a native screenshot.
set "CONF=%TEMP%\mk2_O113_%RANDOM%_%RANDOM%.conf"
>"%CONF%" echo [autoexec]
>>"%CONF%" echo mount c "%DIR%"
>>"%CONF%" echo c:
>>"%CONF%" echo mk2
"%DOSBOX%" -conf "%CONF%"
if exist "%CONF%" del /q "%CONF%"
goto CHOOSE
'''

def original_files(z):
    entries={}
    for info in z.infolist():
        if info.is_dir():continue
        n=info.filename
        if not n.startswith('mk2/') or '..' in Path(n).parts:raise ValueError('unexpected game ZIP path: '+n)
        key=n[4:].lower()
        if key in entries:raise ValueError('duplicate game file: '+key)
        entries[key]=z.read(info)
    if len(entries)!=614:raise ValueError('unexpected file count')
    if sha(entries['mk2.exe'])!=CANONICAL_EXE_SHA:raise ValueError('EXE fingerprint mismatch')
    for name in RESOURCES:
        _,_,ofs,rows=__import__('calibration').resource_identity(name,entries[name])
    return entries

def build(game_zip:Path,destination:Path):
    if destination.exists():raise FileExistsError(destination)
    with zipfile.ZipFile(game_zip) as z:src=original_files(z)
    cheat=cheat_exe(src['mk2.exe'])
    manifest={'format':'mk2_o113_stage_calibration_kit_v1',
        'researchStatus':'STATIC_VERIFIED__DOSBOX_VISUAL_TEST_REQUIRED',
        'canonicalExeSha256':CANONICAL_EXE_SHA,'patchedCheatExeSha256':CHEAT_SHA,
        'filesPerVariant':len(src),'stageSourceGeometry':'896-byte rows; 320-byte native viewport',
        'semanticWarning':'SOURCE_INDEX_SPACE_NOT_PRECONFIRMED_VGA_RGB',
        'variants':{},'sourceCanonFileDigests':{name:sha(src[name]) for name in sorted(src)}}
    # Run once and prederive all replacements before writing the archive.
    patches={}
    for key,spec in VARIANTS.items():
        if spec:
            name,pat=spec;modified,info=pattern_plane(name,src[name],pat)
            patches[key]=(name,modified)
        else:info=None
        manifest['variants'][key]={'resourcePatch':info,'fileCount':len(src),'exeSha256':CHEAT_SHA}
    root='MK2_O113_Calibration/'
    destination.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(destination,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as out:
        out.writestr(root+'README_FIRST.txt',README)
        out.writestr(root+'RUN_CALIBRATION.cmd',LAUNCHER)
        out.writestr(root+'PROBE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
        for key in VARIANTS:
            name,patch=patches.get(key,(None,None))
            for original_name,original_bytes in sorted(src.items()):
                payload=(cheat if original_name=='mk2.exe' else patch if original_name==name else original_bytes)
                out.writestr(root+key+'/'+original_name,payload)
    return manifest

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('canonical_game_zip');p.add_argument('output_zip');a=p.parse_args()
 d=build(Path(a.canonical_game_zip),Path(a.output_zip));print(json.dumps({'variants':list(d['variants']),'kitBytes':Path(a.output_zip).stat().st_size},indent=2))
