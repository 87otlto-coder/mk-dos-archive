# P66 accepted original DOS three-game checkpoint

On 8 November 2026 the P66 verifier exited 0 on the original local GOG DOS installations. The tested develop commit is `2f911b7961a706022927bd0db187f9cf2cba555c`, tree `04b2ee39313b655232e719f32ec63a525ebd14a1`. Its parent is the accepted P65 documentation commit `6bddbf20007bf8dde287d518aee445fe63ea1f4c`. Its three changed files are the cumulative runner, its refusal tests and the source CI workflow. The extractor, indexed representations and research workbench are byte-for-byte the accepted P65 Git blobs.

## Original fixture results

| Gate | Observed on the tested commit |
| --- | --- |
| P61 | All nine groups passed. MK1 2,656 + MK2 5,369 + MK3 9,186 = 17,211 assets. The nested P51 run passed 27 game gates, 12 independent image families, 10,712,883 checks and 54 falsified exports. |
| P57–P60 inside P61 | 24 / 10 / 416 source-backed thumbnails. Five Forest index/color pairs and two witnessed floor strips. The independent Python oracle reproduced 2,650 architecture and 823 sky samples. Three Tomb components passed with P59 file parity, P15 floor index/mask and RGBA parity and 15,360 floor pixels. P57–P60 refusal groups passed. |
| P62 MK1 WAV | All 244 selected ZIP WAVs matched original bytes. The executable supplied 243 record bindings and one path-pool-only WAV. |
| P63 MK3 WAV | All 1,024 selected WAV intervals matched their source and retained physical identities, including repeated bytes. There were 673 distinct whole-WAV byte strings, 451 records at 6,000 Hz and 573 at 11,025 Hz. |
| P64 MK2 scores | 33 source scores, 212 streams, 82 repeat boundaries and 130 stops. All 37,481 independently reconstructed MIDI events and ticks matched. All 66 selected entries passed source and MIDI readback. |
| P65 MK1 ANITAB | Eight tables, 739 cells, 514 unique streams, 1,824 frame and 786 control instruction occurrences. Original opcodes and pointers matched. 1,853 frame-part references linked to 1,102 distinct descriptor keys. The O60 index and opacity payloads were byte-identical. |
| P62–P65 synthetic controls | All four suites passed, including 4 / 4 / 8 / 15 refusal cases respectively. |

## Provenance

Both opening and closing audits matched all 2,328 tracked blobs (397 under `src/`) after checkout newline normalization. Both found a clean develop checkout, zero missing or mismatched blobs and zero unsafe paths. Commercial inputs and generated exports stayed in the private local run directory or in memory. Run times were 09:45:39 through 09:51:21 UTC.

| Evidence | SHA-256 |
| --- | --- |
| Original MK1.EXE | `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` |
| Original MK2.EXE | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| Original MK3.EXE | `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0` |
| Tracked source inventory | `35dc9fa3bba8c7ec4b3ecac2e5094ddcffe318de0a823112b7740d32d4acc915` |
| Private P66 report | `8680adf639f65779b209d3c4c40d6e5fe4818fdc10b757eae5aab93690a5da6f` |
| Nested P61 report | `cd8d95d73ed70fc5835c158a6b017c41f33ed2daceede02104a73931a338ec98` |
| Reconstructed P59 ZIP | `036e0d553065239b798657b4a6c38db221e3939cac3459a600237379cad6d445` |

## Source CI and remaining unknowns

GitHub source-only CI passed on the tested SHA, including cumulative refusals, file hygiene, TypeScript, production Vite build and headless Chrome rendering the brand and offline onboarding. Local TypeScript and production build also passed. [P66 GitHub Actions run](https://github.com/87otlto-coder/mk-dos-archive/actions/runs/42468520562).

Interactive source selection, browser package download, listening, animation playback and gameplay were outside this run. Runtime audio event identity, repeat duration and hardware timbre, animation timing and palette selection, and full scene composition remain unresolved.

## Reproduce the accepted source

In PowerShell, use Git, Node with npm and a Python interpreter with Pillow installed. The game arguments point to the directories containing the original executables. Select a new private output directory for every attempt.

```powershell
git clone --branch develop https://github.com/87otlto-coder/mk-dos-archive p66-replay
cd p66-replay
git switch --detach 2f911b7961a706022927bd0db187f9cf2cba555c
git branch -f develop HEAD
git switch develop
npm ci --no-audit --no-fund
python -c "import PIL"
python scripts/test-p66-checkpoint.py
python scripts/verify-p66-checkpoint.py --mk1 'E:/GOG/Games/Mortal Kombat/mk1' --mk2 'E:/GOG/Games/Mortal Kombat 2/mk2' --mk3 'E:/GOG/Games/Mortal Kombat 3/mk3' --work (Join-Path $env:TEMP ('p66-' + [guid]::NewGuid()))
```

The private output contains the cumulative report, the nested P61 report and original-derived verification artifacts. Keep this directory outside Git. The P66 report hash identifies this specific run and includes its timestamps and local paths.
