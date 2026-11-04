# O199 — Forest conditional initializer and optional runtime probe

O199 adds a source-backed comparison of Forest's mode-specific root **and** initializer behavior-registration paths. It preserves the O197/O198 independent Forest layer assets. It does not render a finished Forest stage or infer a live gameplay mode.

## Browser viewer

From the project directory, run `npm ci`, `npm run build`, `npm run dev` and open `http://localhost:3000`. Load an unmodified original `MK2.EXE`. Go to **Laboratory → Compile & hypotheses → O199 Forest conditional initializer behavior** and click **Trace Forest initializer**. Review the four conditional rows (modes 0, 1, 2, 3), the two original function targets and the limitations. Use **Export O199 forensic ZIP** to transfer the entire report, source-byte windows, SVG comparison and reproduction instructions.

This is the intended Windows build path; the Vite build could not be performed in the authoring environment because npm is missing a cache entry for `yallist@3.1.1`.

## Independent source verification

```sh
node scripts/verify-o199-fixture.cjs "C:/path/to/original/MK2"
python scripts/verify-o199-export.py "C:/path/to/original/MK2" "C:/path/to/exported/MKDOS_O199_Forest_Mode_Gated_Callback_Evidence.zip"
```

## Optional test in DOSBox (generates only local game clones)

**Python 3 required.** Keep your original game folder and DOSBox intact. Run the generator against the **unmodified** game folder:

```bat
python scripts\create-o199-forest-runtime-probe.py "C:\Games\Mortal Kombat 2\MK2" "C:\Games\Mortal Kombat 2\MK2_O199_Forest_Registration_Test"
```

The output directory must **not already exist**, and must be separate from the original `MK2` installation. It will contain a control and a single-call-suppression experiment using two full copies of **your own** game files, plus `README_FIRST.txt`, `PROBE_MANIFEST.json` and `RUN_FOREST_TESTS.cmd`. The project ZIP does **not** contain the original game, clones, or a pre-patched MK2.EXE.

Run the generated `RUN_FOREST_TESTS.cmd` from next to `DOSBOX` and `MK2`. Test case 40, then 41. Press F9 at copyright, F9 in intro, enable Cheat Mode and select Forest. Record comparable fight scenes. Label recordings 40 and 41 and retain `PROBE_MANIFEST.json` when uploading results. Do not overwrite or manually patch the original installation.

Both copies receive only the known 11-byte F9-unlock edit; test 41 additionally suppresses the original second Forest callback registration `CALL 0x67222` using 5 NOPs. The script rejects noncanonical executables and verifies clone integrity. Gameplay behavior of this patch is **unverified**. Differences are evidence to analyze; absence of visual differences does not refute source callback reachability.

## What remains unknown

No real-time mode, registered task execution, camera position, parallax, sprite-frame order or live palette was measured by O199. Nothing is promoted into the verified asset catalogue on the basis of this conditional test alone.
