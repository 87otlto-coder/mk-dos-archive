# O209 Stage Fatality Hotkey Investigation — Gate 1 only

## Result

The bounded three-pass original-MK2 investigation **did not locate a safe, verified stage-fatality dispatcher**. Do not patch the game based on the known stage initializers or the cheat-menu controller. The original source findings, hashes, offsets and failed candidate interpretations are exported in `research_outputs/O209_GATE1_REPORT.json` and the checkpoint note.

## Re-run with your own original DOS MK2.EXE

```
python tools/mk2_stage_fatality_gate1/trace_gate1.py --exe "C:\path\to\MK2.EXE" --out O209_GATE1_REPORT.json
python tools/mk2_stage_fatality_gate1/verify_gate1.py --exe "C:\path\to\MK2.EXE" --report O209_GATE1_REPORT.json
```

Modified game binaries (including F9 patched EXEs) will be refused; use the original canonical fixture. Output file must not exist before running the producer.

No npm, emulator or game patch is required. O208 UI and research functionality are unchanged.
