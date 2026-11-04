"""Static safety and reference checks. Not an AutoHotkey runtime test."""
from pathlib import Path
import json
import re

root = Path(__file__).resolve().parent
script = (root / 'MK2_Stage_Fatality_F8.ahk').read_text(encoding='utf-8')
reference = json.loads((root / 'MOVE_REFERENCE.json').read_text(encoding='utf-8'))
checks = {
    'AHK v2 required': '#Requires AutoHotkey v2.0' in script,
    'f8 DOSBox-scope condition': '#HotIf GameIsFocused()' in script and 'F8::' in script,
    'both facing directions': '+F8::' in script and 'DoFatality("left")' in script and 'DoFatality("right")' in script,
    'high punch test': 'F7::' in script and 'DoTestPunch()' in script,
    'explicit arming': 'Configured=0' in script and 'Cfg["Configured"] != "1"' in script,
    'focus guard': 'WinGetID("A") != startingWindow' in script,
    'key down and key up paired': 'SendEvent("{" key " down}")' in script and 'SendEvent("{" key " up}")' in script,
    'no exe patch operations': all(x not in script.lower() for x in ('mk2.exe', 'writeprocessmemory', 'dllcall(', 'regwrite(')),
    'no auto-confirmed runtime': not reference['verified_runtime'],
    'four presets available': len(reference['presets']) == 4,
    'Dead Pool uppercut': '"UPPERCUT"' in script and 'DoUppercut(target)' in script,
    'input attempt logging': 'RecordAttempt(preset, facing, "inputs_sent")' in script,
    'no null/boolean timing conversion': '|| 0' not in script,
    'configuration GUI': 'Save and arm hotkeys' in script and 'Gui("+AlwaysOnTop"' in script,
    'notebook readable': (root / 'README_START_HERE.md').exists(),
    'no real game files': not any(x.suffix.lower() in ('.exe','.gra','.dat','.drv') for x in root.iterdir()),
}
for k, ok in checks.items():
    print(('PASS' if ok else 'FAIL'), k)
if not all(checks.values()):
    raise SystemExit('Static helper validation failed')
print(f'PASS: {len(checks)} static safety/reference checks. Windows AHK runtime untested.')
