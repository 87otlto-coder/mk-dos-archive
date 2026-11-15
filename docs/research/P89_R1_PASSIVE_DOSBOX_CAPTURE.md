# P89 R1 — Passive original MK3 read-return witness (first implementation)

**Status (2026-11-15): SOURCE-ONLY IMPLEMENTATION; ORIGINAL-WINDOWS BUILD AND RUNTIME VALIDATION PENDING.** Do not describe this as a decoded P79 image, working native decoder, completed DOSBox-X binary build or successful original game capture.

## Why the original DEBUGBOX experiment is suspended

Complete user-uploaded original-game file-I/O log SHA256 \`d769b69dd90139b38ae1e13e28a59889ed7346cc972c0d1fc0bffd6e416bcaa9\` (279,299 bytes; 11,497 lines); accompanying config SHA256 \`149cdfa502972a6c29384f56e15b01bb8ec9d0e0ae23bfc82efc4a1849cb964e\`; stderr **zero bytes**.

This session was **not** the successful prior normal-MK3 P79 traversal. It configured \`mount c\` / \`imgmount d\` / \`c:\` / **\`debugbox mk3.exe\`**, and set a generic DOS \`BPINT 21 42\` seek breakpoint before the game archive was open. Full-log observations: \`MK3.EXE\` opened/read; executable source seeks to **62,580** and **157,268**; a single attempted \`C:\MK3.ETX\` open (no success/failure evidence); **nine successful** \`STEPIN\` operations and **515 rejected** \`STEPIN\` calls; warning that stepping may malfunction with the **Dynamic CPU core**; \`MK3.EXE\` closed at log line 3298, followed by \`Z:\AUTOEXEC.BAT\` reopening; **zero \`DATA.MK3\` lines** in the full log. The DOSBox emulator log contains only lengths for \`CON\` writes, so it does not establish why the executable exited. These events make \`DEBUGBOX\`/remote step startup unsuitable as accepted extraction evidence.

The independent **normal original game** \`fileio(1).log\`, SHA256 \`97bb848338737a2e44c84f1931c441826146001b6eff385aaf422cacd9a9bb0c\`, remains VERIFIED for **215 of 216** original P79 source record *read requests*, not successful returned buffers or output frames. Do not invalidate that earlier evidence.

## New extraction-focused route: passive hook, no guest pauses

[Patch generator](../../scripts/research/p89/r1_dosbox_passive_read_overlay.py) targets the exact upstream DOSBox-X **\`029bd65c5dcc7cdc7f2e14e35278620d9707d969\`** original \`src/dos/dos.cpp\` INT 21h AH=3Fh read path. Its source anchor was independently checked **unique** in that original source; this is **source inspection**, not compiled/runtime verification.

It generates a reviewable unified \`.patch\` and **never modifies the upstream source checkout automatically**. Source tree must be clean and at the exact original commit. The injected code is **disabled** unless \`MKEXT_P89_CAPTURE_DIR\` is set to an existing **new private \`F:\Dev\MKEXT\FIXTURES\VALIDATION\...\`** folder. During a **normal MK3 run**, it filters the DOS handle named \`DATA.MK3\`, queries current file position without changing it (\`DOS_SEEK_CUR\`), and matches exactly offset **732662**, requested bytes **1506**. It preserves \`DOS_ReadFile\`, \`MEM_BlockWrite\` and \`diskio_delay_handle\` in their existing order. If reached, it records return success, **actual returned byte count**, guest selector/offset/physical copy location, **post-copy guest memory parity**, and whether a private first-return binary was written.

Private output names: \`p89-record0-read-return.tsv\` and \`p89-record0-return.bin\`. Existing bin files are not overwritten. **These files must stay out of GitHub**; the bin is original commercial data. [Verifier](../../scripts/research/p89/r1_validate_passive_record0_return.py) checks the bin byte-for-byte against the canonical original DATA.MK3 P79 ordinal-0 payload, SHA256 \`0efcbfd8fba8738a5485c9d434c432aee64aacc34627e3999550772579e01213\`, and requires a complete successful read plus actual guest parity in TSV. It emits **metadata-only private JSON**, not assets. A successful result proves **source read return and DOS guest copy**, not native decompression, graphics pixels, or timing.

**Original-free Windows CI coverage:** the generator's 10 safety/idempotence/source-selection tests and the verifier's 12 success/refusal tests are in \`scripts/research/p89/test_r1_dosbox_passive_read_overlay.py\` and \`test_r1_validate_passive_record0_return.py\`. CI is a *source-only* gate; do not claim C++ compilation or DOS runtime acceptance from Python tests.

## Safe Windows integration path (not yet run)

Use the existing verified normal-run disposable game copy only. Clone **upstream DOSBox-X source** in a new, distinct location under \`F:\Dev\MKEXT\TOOLS\` and check out exact \`029bd65\`, leaving the existing portable debugger binary untouched. From the original project's \`F:\Dev\MKEXT\SOURCE\mkdosext\`, generate a patch using:

\`\`\`powershell
Set-Location 'F:\Dev\MKEXT\SOURCE\mkdosext'
python scripts/research/p89/r1_dosbox_passive_read_overlay.py --upstream 'F:\Dev\MKEXT\TOOLS\DOSBOX_X_P89_PASSIVE_SOURCE' --output 'F:\Dev\MKEXT\FIXTURES\VALIDATION\P89-PASSIVE-<NEW_ID>\dosbox-p89-read-return.patch'
\`\`\`

The private output directory must already exist; replace \`<NEW_ID>\` with a fresh folder. Inspect \`git -C ... apply --check ...\` before using \`git apply\`, and retain a recoverable upstream Git checkout. Build **SDL2** following upstream \`BUILD.md\` with Windows MSYS2/MinGW64 or a separately provisioned toolchain. **Building has not yet been tested**; if Windows lacks a compiler, do not assume the portable DOSBox-X distribution includes one. Never upload or save a full browser/DOSBox binary artifact automatically to GitHub Actions.

After a newly compiled and identified executable is verified with an original-free start, run normal \`mk3\` (not \`debugbox mk3.exe\`) with \`MKEXT_P89_CAPTURE_DIR\` pointing at a separate fresh private directory. Preserve original \`fileio\` logging. Only call the private verifier after files exist. Do not continue to native pixel output until a correct original return witness is observed.

## Confidence

- **VERIFIED:** original 215/216 P79 requested source boundaries from previous normal run; original DEBUGBOX failure details; exact original source hook location.
- **IMPLEMENTED / TEST PENDING:** reversible source overlay and original-free verifier; source-only Windows CI.
- **RUNTIME VALIDATION PENDING:** compiled instrumented DOSBox-X, complete original record-0 returned 1506 bytes and guest copy parity.
- **UNKNOWN:** P79 native codec, indexed output, palette assignment, frame sequence/timing. **New verified decoded continuation images: 0.**
