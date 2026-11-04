#!/usr/bin/env python3
"""MK2 DOS bounded cheat-menu unlock test kit builder.

The source DOS MK2.EXE remains untouched. This script makes four
isolated game directories from the already-verified O110Y source fixture.
Only eleven bytes in each copied EXE are modified to replace the cheat
menu's keyboard scan-code sequence. Stage selection itself is performed
by the original game's cheat menu (not a guessed executable jump).
"""
import hashlib
import json
import pathlib
import shutil
import sys
import zipfile

CANON = 'fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65'
ORIGINAL = bytes.fromhex('1e 17 2e 16 26 12 20 1f 1f 16 26')
PATCHED = bytes.fromhex('43 00 00 00 00 00 00 00 00 00 00')
OFFSET = 0xCCF0E
VARIANTS = {
    '10_CHEAT_CONTROL': '00_BASELINE',
    '11_CHEAT_TOMB_CHECKER': '07_TOMB_PACKED_CHECKER',
    '12_CHEAT_TOMB_FLAT': '08_TOMB_PACKED_FLAT',
    '13_CHEAT_PORTAL_CHECKER': '09_PORTAL_PACKED_CHECKER',
}


def digest(x):
    return hashlib.sha256(x).hexdigest()


def patch(data):
    assert len(data) == 861133, f'unexpected EXE size: {len(data)}'
    assert digest(data) == CANON, 'not canonical MK2.EXE'
    matches = [i for i in range(len(data)) if data.startswith(ORIGINAL, i)]
    assert matches == [OFFSET], f'expected unique cheat bytes at {OFFSET:#x}, got {matches}'
    changed = bytearray(data)
    changed[OFFSET:OFFSET + len(ORIGINAL)] = PATCHED
    assert len(changed) == len(data)
    diffs = [i for i, (a, b) in enumerate(zip(data, changed)) if a != b]
    assert diffs == list(range(OFFSET, OFFSET + len(ORIGINAL)))
    assert changed[:OFFSET] == data[:OFFSET]
    assert changed[OFFSET + len(ORIGINAL):] == data[OFFSET + len(ORIGINAL):]
    restored = bytearray(changed)
    restored[OFFSET:OFFSET + len(ORIGINAL)] = ORIGINAL
    assert bytes(restored) == data
    return bytes(changed)


def build(origin, destination):
    root = pathlib.Path(origin)
    out = pathlib.Path(destination)
    if out.exists():
        raise ValueError('Output directory already exists: ' + str(out))
    originals = [root / name for name in VARIANTS.values()]
    assert all(d.is_dir() for d in originals)
    out.mkdir(parents=True)
    original_exe = (root/'00_BASELINE'/'mk2.exe').read_bytes()
    patched = patch(original_exe)
    evidence = json.loads((root/'PROBE_MANIFEST.json').read_text())
    report = {
        'format': 'mk2_cheat_menu_native_stage_selection_probe_v1',
        'status': 'STATICALLY_VERIFIED_RUNTIME_MENU_TEST_PENDING',
        'sourceExecutableSha256': CANON,
        'patchedExecutableSha256': digest(patched),
        'patchedFileOffsetHex': hex(OFFSET),
        'originalScancodesHex': ORIGINAL.hex(' '),
        'patchedScancodesHex': PATCHED.hex(' '),
        'changedBytes': 11,
        'stageSelectionMethod': 'AUTHENTIC_HIDDEN_MENU_BACKGROUND_OPTION_NOT_BINARY_STAGE_ID_PATCH',
        'runtimeNote': 'Press F9 at opening copyright screen to unlock, press F9 during intro to open, toggle CHEAT MODE ON, select BACKGROUND, then exit and choose fighter.',
        'baselineControl': '10_CHEAT_CONTROL',
        'resourceProbeManifest': evidence,
        'variants': {},
    }
    for name, original in VARIANTS.items():
        src = root / original
        dst = out / name
        shutil.copytree(src, dst)
        assert (src / 'mk2.exe').read_bytes() == original_exe
        (dst / 'mk2.exe').write_bytes(patched)
        src_files = sorted(f.relative_to(src).as_posix() for f in src.rglob('*') if f.is_file())
        dst_files = sorted(f.relative_to(dst).as_posix() for f in dst.rglob('*') if f.is_file())
        assert src_files == dst_files and len(src_files) == 614
        changes=[]
        for p in src_files:
            a=(src/p).read_bytes()
            b=(dst/p).read_bytes()
            if a != b:
                assert p == 'mk2.exe', p
                assert b == patched
                changes.append(p)
        assert changes == ['mk2.exe']
        manifest_variant = evidence['variants'][original]
        for key in ('tomb.gra','portal.gra'):
            expected = manifest_variant.get('patchedResourceSHA256') if key == manifest_variant.get('modifiedResource') else digest((root/'00_BASELINE'/key).read_bytes())
            assert digest((dst/key).read_bytes()) == expected, (name,key)
        report['variants'][name] = {'sourceVariant': original, 'fileCount':len(src_files), 'modifiedRelativeToO110YSource':['mk2.exe'], 'exeSha256':digest(patched),'graProbe': manifest_variant.get('modifiedResource'), 'resourceEditRetained':True}
    (out/'PROBE_MANIFEST.json').write_text(json.dumps(report,indent=2))
    (out/'README_FIRST.txt').write_text(README)
    (out/'RUN_STAGE_TESTS.cmd').write_text(LAUNCHER)
    (out/'VERIFY_SHA256.cmd').write_text(VERIFY_BATCH)
    return report


README = r'''MK2 DOS STAGE SELECTOR / TOMB + PORTAL PACKED GRAPHICS EXPERIMENT
==================================================================
This is a self-contained four-directory test kit. It uses the ORIGINAL MK2
hidden cheat menu to force a chosen Background. It does NOT assume a
stage-selector address, and its unlock patch only changes 11 EXE bytes.

INSTALLATION:
  Your original installation stays unchanged:
  Mortal Kombat 2\
    DOSBOX\ (your working DOSBox.exe)
    MK2\ (original game - NOT CHANGED)
    MK2_Stage_Test_Kit\ (extract THIS folder here)
      RUN_STAGE_TESTS.cmd
      10_CHEAT_CONTROL\
      11_CHEAT_TOMB_CHECKER\
      12_CHEAT_TOMB_FLAT\
      13_CHEAT_PORTAL_CHECKER\

DOUBLE CLICK RUN_STAGE_TESTS.cmd. Start with 10 control, then 11 or 13.

IMPORTANT: How to get the actual requested stage as the first fight:
  1. At the first COPYRIGHT text screen, press F9 once. It replaces the
     original 11-key AICULEDSSUL unlock (patched scancodes at 0xCCF0E).
  2. During the intro animation, press F9 again to open the original
     hidden CHEAT MENU. Press it before character selection begins.
  3. Use the menu's original controls to set CHEAT MODE = ON.
  4. Set BACKGROUND = KOMBAT TOMB for tests 11 and 12; BACKGROUND =
     THE PORTAL for test 13. Set the same one in test 10 for control.
  5. Close the cheat menu, press F1 to begin, select the character,
     and reach the first fight.

The cheat menu's Background option is documented for normal matches;
secret encounters and boss encounters can override it. If it doesn't
work, take a screenshot of the hidden menu and the game and report it.

OPTIONAL: Set SOAK TEST in the hidden menu to ON to let the game cycle
through CPU fights (separately from these same-stage comparisons).
Turn it OFF for deterministic manual first-fight screenshots.

COMPARISON PROCEDURE:
  10_CHEAT_CONTROL: stage background forced, original source graphics.
  11_CHEAT_TOMB_CHECKER: changes only packed TOMB.GRA tail pattern.
  12_CHEAT_TOMB_FLAT: alternate constant-color TOMB.GRA tail.
  13_CHEAT_PORTAL_CHECKER: changes only packed PORTAL.GRA tail pattern.
  Remember: TOMB and PORTAL graphics may be used in multiple scene layers;
  a normal-looking image is a useful negative observation, not a broken test.

SCREENSHOTS: DOSBox Ctrl+F5 usually captures game screenshots. Your
previous bot can also capture its 12-second and 25-second windows,
though it does not yet navigate the cheat menu. Share same-stage captures.

WHAT'S VERIFIED HERE:
  * The source MK2.EXE is the SHA-256-matched canonical 861,133-byte exe.
  * The original unlock sequence occurs once, at physical 0xCCF0E.
  * The edited EXE has exactly 11 changed bytes, size unchanged.
  * All original binary bytes are recovered by reversing those edits.
  * Every game's original O110Y graphics probe remains byte-identical.

WHAT'S NOT YET VERIFIED:
  * Windows/DOSBox launch and hidden-menu behavior on your installation.
  * The stage background actually activated by the player's menu choice.
  * Whether the new TOMB/PORTAL pixels appear in the finished gameplay.

The original MK2 installation and all game archives remain untouched.
'''

LAUNCHER = r'''@echo off
setlocal EnableExtensions
set "KIT=%~dp0"
for %%I in ("%KIT%..") do set "PARENT=%%~fI"
set "DOSBOX=%PARENT%\DOSBOX\DOSBox.exe"
if not exist "%DOSBOX%" (
  echo DOSBox.exe not found at "%DOSBOX%".
  echo Put this kit alongside the DOSBOX and MK2 folders inside your Mortal Kombat 2 folder.
  pause
  exit /b 1
)
echo.
echo === MK2 SECRET STAGE SELECTOR TEST ===
echo 10 - CONTROL - original graphics (patched cheat unlock)
echo 11 - KOMBAT TOMB checker pixel experiment
echo 12 - KOMBAT TOMB flat pixel experiment
echo 13 - THE PORTAL checker pixel experiment
echo Q  - Quit
echo.
set /p CHOICE=Enter 10, 11, 12, or 13: 
set "GAMEDIR="
if "%CHOICE%"=="10" set "GAMEDIR=%KIT%10_CHEAT_CONTROL"
if "%CHOICE%"=="11" set "GAMEDIR=%KIT%11_CHEAT_TOMB_CHECKER"
if "%CHOICE%"=="12" set "GAMEDIR=%KIT%12_CHEAT_TOMB_FLAT"
if "%CHOICE%"=="13" set "GAMEDIR=%KIT%13_CHEAT_PORTAL_CHECKER"
if not defined GAMEDIR exit /b 0
if not exist "%GAMEDIR%\mk2.exe" (
  echo Missing MK2.EXE at "%GAMEDIR%".
  pause
  exit /b 1
)
echo.
echo Press F9 once at copyright, then F9 during intro to open CHEAT MENU.
echo Set CHEAT MODE = ON; BACKGROUND = KOMBAT TOMB or THE PORTAL.
echo Then choose a fighter; your FIRST match should use that arena.
echo.
rem Use the -conf / [autoexec] route already proven by the MK2 O110X bot.
rem This avoids fragile nested command-line quotes when Windows paths have spaces.
set "CONF=%TEMP%\mk2_stage_selector_%RANDOM%_%RANDOM%.conf"
>"%CONF%" echo [autoexec]
>>"%CONF%" echo mount c "%GAMEDIR%"
>>"%CONF%" echo c:
>>"%CONF%" echo mk2
"%DOSBOX%" -conf "%CONF%"
if exist "%CONF%" del /q "%CONF%"
endlocal
'''

VERIFY_BATCH = r'''@echo off
setlocal
where certutil >nul 2>nul
if errorlevel 1 (echo certutil not available on this Windows installation.&pause&exit /b 1)
echo === Patched MK2.EXE SHA-256 hashes should ALL be the same ===
for %%N in (10_CHEAT_CONTROL 11_CHEAT_TOMB_CHECKER 12_CHEAT_TOMB_FLAT 13_CHEAT_PORTAL_CHECKER) do (
  echo -- %%N
  certutil -hashfile "%~dp0%%N\mk2.exe" SHA256 | findstr /R "^[0-9a-fA-F][0-9a-fA-F]"
)
pause
'''

if __name__=='__main__':
    if len(sys.argv) != 3:
        sys.exit('usage: python build_mk2_cheat_stage_kit.py INPUT_O110Y_PROBES OUTPUT_KIT_DIR')
    res=build(sys.argv[1], sys.argv[2])
    print(json.dumps({'status':'PASS','modifiedExeSha256':res['patchedExecutableSha256'],'variants':list(res['variants'])},indent=2))
