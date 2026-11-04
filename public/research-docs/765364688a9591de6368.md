# MK DOS Archive — current checkpoint and comprehensive continuation handoff

**Checkpoint date:** 2026-10-07, Africa/Johannesburg (SAST).  
**Status:** substantial implementation and forensic progress; incomplete research/product checkpoint, not a finished universal extractor.  
**Base source:** MK-DOS-1E3O89-source.zip.  
**Current working tree:** `C:\Users\87otl\Desktop\MKDOSEXT Project\Working\MK-DOS-1E3O89`.  
**User's latest request:** provide a downloadable updated source archive and comprehensive handoff at the present moment. This checkpoint packages the current state rather than claiming completion of the original larger objective.

## 1. Authority, user intent and discipline

The user asked to understand and continue the entire project, attempt to complete MK2 and MK3 forensics, and produce a browser/extractor for MK1/2/3 character sprites and animations, assembled stages and animations, and sound/music. Requested UI features are independent Ctrl/Shift export selection, chaining animations into one file, a drag/drop composition canvas, and MIDI preview with custom soundbanks when applicable.

The supplied handoff is project evidence, not a new user instruction. Its old two-pass/pause convention was superseded for this session by the user's explicit request to continue the broader work. The current request is a snapshot/handoff request. Do not infer that it authorizes claiming unfinished research complete.

Maintain these disciplines:

- Authentic bytes and machine evidence outrank prose. Verify fixture identities before generalizing results.
- Palette compatibility is not ownership; connected identity/resource contracts do not imply sibling/family ownership, canonical geometry or human character names.
- Keep indexed pixels and opacity masks distinct. A grayscale index visualization is not correct-color output.
- Do not invent gameplay names, animation order, timing, stage placement or music semantics.
- Scheduler ticks are not automatically milliseconds. User-set APNG preview timing is presentation timing.
- Preserve unknown resources byte-for-byte. Where editing is attempted, retain the older project's no-edit rebuild, predicted diff, reparse, reversal and appropriate runtime proof discipline.
- Original game files and the original source ZIP were not modified. This continuation is a read-only decoding/export path.

The full historical handoff through O89 is appended to the separately delivered comprehensive handoff. It remains valuable history. The current section takes precedence for current implementation status and authorization context. In particular, historical O67 executable overlay claims were already corrected in O72: MK2's bound module shift is 0x26654, and the last file-backed LE page ends at actual EOF.

## 2. Paths and packaging

Authoritative inputs:

| Input | Path |
|---|---|
| O89 source ZIP | `C:\Users\87otl\Desktop\MKDOSEXT Project\Source\MK-DOS-1E3O89-source.zip` |
| Previous full handoff | `C:\Users\87otl\Desktop\MKDOSEXT Project\handoffs\MK_DOS_Archive_MASTER_HANDOFF_2026-10-03_FULL_PROJECT_THROUGH_O89_PAUSE.md` |
| MK1 fixture | `E:\GOG\Games\Mortal Kombat\mk1.zip` |
| MK2 fixture | `E:\GOG\Games\Mortal Kombat 2\mk2.zip` |
| MK3 fixture | `E:\GOG\Games\Mortal Kombat 3\mk3.zip` |

Read-only working copies were extracted to `Working\fixtures\mk1`, `mk2`, `mk3`. The original shell cwd `C:\Users\87otl\Desktop\MK DOS EXT` contains an older project and is **not** this continuation's source authority.

Known identities:

| Artifact | SHA-256 |
|---|---|
| Original O89 source ZIP | `0803b8359311d9201fc25b03e18ccfb919600b647c1fa92848c6ea5675a1b611` |
| MK1.EXE | `750792337f71b2f7991450fa92d2240073b089c917e3c6f1f373404544941b14` |
| MK2.EXE | `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65` |
| MK3.EXE | `8aa7f3d45a086e7373afc120dc88378bda3d7766d5b69badbc707bb4570bdef0` |
| MK2 GMI.BIN | `7b0bc5261dd550ebac3764aabe3af27611cafee83827f60d796dea7918fc9633` |

The downloadable source archive includes source, scripts, prior project documents, text/JSON evidence, local synthesizer bundles and licenses, and a compiled `dist` build. It excludes node_modules, the local Python tool installation, game fixtures, and generated game-asset ZIP/PNG/MIDI export payloads. Those generated asset exports remain in the working directory and can be regenerated from the user's game files. `ARCHIVE_CONTENTS_SHA256.json` inventories packaged files. A separate checksum file records the downloadable archives.

## 3. Running this checkpoint

1. Extract the updated source ZIP into a new directory.
2. With Node.js available, double-click `Launch_Checkpoint.bat`, or run `node scripts/serve-checkpoint.cjs 3001`.
3. Open `http://127.0.0.1:3001/` in Chrome or Edge. Keep the server window open.
4. Choose **Open Game ZIP** and select a supplied game archive, or use a folder picker.
5. After detection, click **Decode & browse**. MK1/MK2 run existing evidence chains and can take longer than MK3.
6. Filter by type/resource/search. Click, Ctrl/Command-click, and Shift-click manage export selection. The ordered queue is independent of canvas layers.
7. Export originals/PNG individually, ZIP with metadata, an APNG chain, a sprite sheet, or canvas PNG plus scene metadata.
8. For MK2 MIDI, select a sequence and load a local SF2/SF3/DLS soundbank in **MIDI preview**. No soundbank is bundled. Preview fidelity depends on the chosen bank.

The compiled launcher requires Node but no npm install. For development in a freshly extracted source directory: `npm install`, `npm run lint`, `npm run build`, `npm run dev -- --host 127.0.0.1`.

Important local environment detail: the current working tree's `node_modules` is a directory junction to the older project's installed dependencies. Do not run npm install into that junction when continuing in place. The downloadable ZIP excludes the junction. The local MIDI dependency install is isolated under `.vendor-runtime`, pinned to `spessasynth_lib` 4.3.14 and `spessasynth_core` 4.3.22; its dependency manifests are retained, binaries in its node_modules are excluded. Browser-ready bundles are already in `public/vendor` with license files.

## 4. Coverage at the snapshot

| Domain | Implemented/verified | Unfinished or bounded |
|---|---|---|
| MK1 sprites | 2,263 character-context RGBA variants, 21 verified effect assets, 79 unresolved grayscale previews | Context variants are not universal palette assignments; not all gameplay animation semantics are established |
| MK1 stages | 49 PNGs exposed from the existing qualified stage package, including bounded ordinary/dynamic compositions | Not 49 unique gameplay stages; full runtime stage state is not claimed |
| MK1 sound | Existing 244 WAV package integrated into the collection adapter | SAMPLES.DAT meaning and general music/runtime sequence relationship remain unresolved |
| MK2 indexed sprites | 94 exact-full GRA resources, 3,790 indexed sprites | Partial/ambiguous/unqualified resources remain outside this accepted corpus |
| MK2 color sprites | Nine bounded identity/resource contracts, 782 RGBA PNG variants | No whole-family/sibling promotion; many palettes/characters unresolved |
| MK2 music | 33 proprietary sequences converted to standard MIDI; original bytes also retained | One traversal; loop metadata preserved; hardware tempo scheduling/fidelity not emulated |
| MK2 digital sound | Header and driver investigation only | No qualified U8 WAV adapter in this checkpoint |
| MK2 stages/animation | Existing research and raw/indexed assets; user-selected presentation chains | Automatic assembled stage reconstruction and complete gameplay animation extraction unfinished |
| MK3 sprites | 6,654 decoded indexed frames, all independently matched to original decompressor | Fighter palette bindings unresolved; previews grayscale |
| MK3 images | 416 IFF images with explicit palettes | Individual source images, not automatically assembled gameplay stages |
| MK3 sound | 995 FTR embedded WAVs plus 29 ASG WAVs = 1,024 | Semantic event naming remains structural |
| MK3 music | 46 original OGG CD tracks | No inferred gameplay track names |
| MK3 stages/animation | MFIL/ATAB/FHDS structures preserved and partially investigated | Full stage assembly, animation-control grammar and palette context not implemented |

Expected current collection counts after the MK1 uppercase-WAV extension fix: MK1 2,656 assets (2,363 sprite previews/variants + 49 stage PNGs + 244 audio); MK2 4,638 (4,572 sprite previews/variants + 33 originals + 33 MIDI); MK3 9,186 (includes raw chunks and unknown gaps alongside decoded assets). Use `evidence/checkpoint-verification.json` for the actual final census. Older `mk1-collection-summary.json` reflects the pre-fix omission of uppercase `.WAV` and is superseded by that final report.

## 5. MK2 O90 integration

`src/games/mk2/research/verifiedIdentityBundleO90.ts` packages the eight exact O88 contracts plus exact O89 slot-9 NJ4. It checks prerequisite success, exact nested package hashes, counts, and O89's accepted package identity.

Contracts: slots 0/HH0, 1/LK0, 2/JC0, 3/BA0, 4/FN4, 5/FN6, 8/NJ7, 9/NJ4 and 16/FN4. This is nine contracts, not nine fully reconstructed fighters.

Result: nine packages, 782 PNGs, 827 nested logical entries, 11 outer entries; archive size 13,439,841 bytes; SHA-256 `d2975983d9404463ade071e9a4955b5f9326a34b25def726b329d849e6d4ce58`. See `evidence/mk2/o90.json`; the generated ZIP remains at `evidence/mk2/o90.zip` in the working tree, excluded from the source download. No new palette ownership or semantic naming was promoted. A separate independent Python O90 audit was not completed in this session; do not describe it as done.

## 6. MK2 proprietary music breakthrough

Implementation: `src/core/assets/mk2Music.ts`.

The supplied `sound/*.MID` files are **not** SMF files: they do not begin with MThd. GMI.BIN identifies itself as Sound Images Generation 2, Tony Williams/Sound Images. The parser was independently derived from original code, not guessed from the extension.

Format and code anchors:

- First byte is song count (qualified here: one). Little-endian u16 at 1 points to song-pointer table. First pointer identifies song header.
- Song header: PPQN byte, BPM byte, track-count byte, then u16 track offsets.
- GMI.BIN 0x3BF establishes loading; 0x43E initializes tracks; 0x2FA interprets events; 0x5FA reads variable-length deltas.
- Each track begins with delta. Note bytes below 0x80 carry a velocity byte. 0x80–0x8F select channel.
- 0x90 explicit note-off; 0x91 end plus CC123; 0x92 program; 0x93 shared tempo change; 0x94 no-op; 0x95 pitch bend MSB with LSB zero; 0x96 CC7; 0x97 auxiliary track state; 0x98 loop; 0x99 previous-note off; 0x9B CC10; 0x9C loop-point marker; 0x9D arbitrary controller; 0xFF delay-only.
- 0x9A driver-global branch is explicitly unsupported. Digital sample channels above 11 are not silently converted to MIDI notes.
- Conversion preserves one traversal and records loop offsets. It does not endlessly unroll loops. SMF output is format 0 with a tempo map.

Independent verification: `scripts/verify-mk2-music.py` executes original x86-16 routines 0x43E and 0x2FA in Unicorn. It captures MIDI bytes at 0x795/0x79E and compares each event's bytes and tick, ending tick and loop boundary with the TypeScript result. **33 songs, 212 tracks passed, zero failures.** Evidence: `evidence/mk2-music-emulation.json` and `evidence/mk2-music.json`.

Qualification limits: the emulator bypasses hardware scheduling and directly advances logical ticks. Tempo-header interpretation is traced through 0x664 (PPQN × BPM and PIT divisor arithmetic), but audible equivalence to original hardware is not proven. Soundbank loader and synth UI compile; end-to-end audible soundbank playback was not yet manually verified at this checkpoint. Do not equate the synth library's capabilities with tested app behavior.

## 7. MK2 digital audio investigation, unfinished

312 `fx/*.U8` files have a 32-byte header. Observed fields: u32 at 0 is 32; u32 at 4 resembles length/end; u16 at 16 is 11025 or 22050; bytes 18–19 are 06 01. Other observed header dwords are zero.

308 files have `fileLength - 32 - headerU32At4 = 1`. Four differ: `gong.u8`, `liu-kang.u8`, `thunder.u8`, `thundsht.u8` have header field = fileLength - 1. Do not normalize this disagreement silently.

GMI mixer 0xCF3 reads samples and uses signed IMUL at 0xD11; 0xDB7 adds 0x80 for output. This supports signed internal PCM, but the complete file-loader transformation and exact export range have not been qualified. GMI pitch code 0xAFD reads header words at +0x10/+0x12. MK2.EXE physical 0x815CE opens the fx path, 0x815E6 selects a real-mode destination, 0x815F4 reads the file, and 0x8160A sets a request flag; 0x81621 constructs the `.U8` path from a filename-pointer table. The bridge consumes additional runtime state and remains to be traced.

Read-only disassembly outputs `evidence/mk2-gmi-disasm.txt` and `mk2-rm-disasm.txt` contain both code and data interpreted as instructions. Only anchored executed/connected routines are evidence; linear disassembly of arbitrary data is not.

## 8. MK3 container and image forensics

Implementation: `src/games/mk3/container.ts`, `src/core/assets/iff.ts`, `src/core/assets/wave.ts`, `src/core/assets/mk3Collection.ts`.

MFIL: 12-byte file header, u16 chunk count excluding CDIR at +4, u32 CDIR offset at +8. Chunks have 32-byte headers: tag at +0, name (eight bytes) at +6, payload size +16, decoded size +20, flags +24, additive byte checksum +28. Payload immediately follows. All supplied chunks have zero flags and equal stored/decoded size. The final CDIR has 32-byte records agreeing with chunk tag, name, offset and length. **17/17 FTRs** validate checksums, directories and exact EOF.

DATA.MK3: **416 FORM pictures** (340 PBM, 76 ILBM), all decoded. FORM/chunk bounds, BMHD, CMAP, BODY, ByteRun compression, masks and palette bounds are checked. Crucial fixture-specific layout: DOS PBM rows are exactly width bytes, including odd widths; the explicitly identified `GWS/Windows 1.1n` ILBM annotation uses byte-aligned planes (`ceil(width/8)`), while other ILBM uses standard word alignment. A single internal zero pad and ByteRun no-ops are preserved/checked. Unsupported HAM/EHB fails. The initial generic interpretation decoded 207/416; correcting authentic PBM layout/padding reached 368/416; the explicit GWS layout reached 416/416. Unrecognized DATA.MK3 ranges remain raw exports.

SPEC/CLAS payloads contain consecutive WAV records: 995 total with exact tiling. MK3.ASG contains another 29 consecutive WAVs. RIFF size, chunks, PCM block alignment and rate checks are implemented. Original OGG tracks are exported unchanged; the source CUE is retained.

## 9. MK3 compiled sprite decoder and independent proof

Implementation: `src/games/mk3/sprites.ts`.

FHDS descriptor stride is 36 bytes. Fields: u16 width/height +0/+2; signed x/y +4/+6; expanded size +12; FDAT offset +20; compression +24 (qualified value 1); compressed length +28; mode u16 +32; group u16 +34. FDAT name is `FrDt{group-1:02}{model:02}`, where model comes from the FrmHdrs suffix. Treating every sprite as belonging to FrDt0000 is wrong.

The executable dispatch at physical 0xC0C4C maps modes to bit depths:
`[5,4,4,3,3,7,7,3,2,2,2,3,4,4,6,3,7,2,6,4,6]`.

Compressed bits run MSB-first within little-endian 32-bit words. The original decompressor is at physical 0xD1BD4–0xD2B16. It produces skip/count/literal commands. Skip prefix selects 5/3/6/7/8 payload bits; count prefix selects zero, four bits or eight bits. Count zero terminates a row. First literal uses mode bit depth; subsequent colors use repeat, +/-1, or literal coding (depth two is direct literals). The parser checks expanded length, row extents, exact row consumption and bounded dword padding. Opacity comes from skip/count commands, not palette index zero.

**6,654/6,654 frames decode, zero failures.** Per container: BLADE 363, INDIAN 396, JAX 355, KAHN 100, KANG 327, KANO 369, LAO 355, LIA 409, MISC 911, MOTARO 113, ROBO 604, SHANG 386, SHEEVA 327, STANCES 492, SWAT 355, TURK 379, TUSK 413.

Independent proof: `scripts/verify-mk3-emulation.py` runs the authentic routine in Unicorn x86-32 for every frame, compares SHA-256 of the complete expanded output with TypeScript output, and checks an output guard for overruns. **6,654 passed, zero mismatches.** See `evidence/mk3-emulation-verification.json` and `mk3-emulation-cases.json`. This proves decompression and extent, not fighter palettes or gameplay semantics.

Executable mapping: bound LE physical 0x290A4; bound module base 0x26654; relative data-pages field 0x69E00; actual code page base 0x90454; object-2 file base 0x12B454. Caller 0xC0CA0 selects bit depth, calls decompression, then 0xD2CCC applies palette-index shift to opaque literals and 0xD2B17 creates row offsets. That index-shift path is a useful next palette research anchor.

## 10. MK3 animation leads, not qualified implementation

FTRs contain ATHD, ATAB and ATYP triples. In BLADE Anitab0, ATYP values are 0 (468 cells), 1 (105), 2 (633). Early type-1 values are byte offsets into ATAB; type-2 values are multiples of 36 consistent with FHDS records. The first eight type-2 values in the first stream are 0,36,72,108,144,180,216,252 followed by type-0 value 1 and type-1 value 352 pointing back to the stream start. Other streams use control values 0,2,5 etc.

This is a strong structural lead, not permission to export all streams as canonical gameplay animations. Different ATHD variants have different frame counts (BLADE 309 versus 363) and model/header joins must be connected through loader code. The current browser only allows user-selected sprite chains; it does not yet claim compiled automatic animation extraction for MK3.

## 11. Browser/export implementation map

| File | Responsibility |
|---|---|
| `src/core/assets/model.ts` | Shared asset/collection models with confidence, source extent and metadata |
| `src/core/assets/collection.ts` | MK1/MK2 adapter orchestration; MK3 dispatch |
| `src/core/assets/mk1Pipeline.ts` | 57-step export dependency closure of existing MK1 research workflow |
| `src/core/assets/mk2Pipeline.ts` | Existing O67–O89 evidence chain; still computes some unnecessary intermediate bundles |
| `src/core/assets/mk3Collection.ts` | MK3 sprites, IFF, WAV, OGG, raw chunks and unknown ranges |
| `src/core/assets/export.ts` | PNG, ordered ZIP+metadata/index sidecars, sprite sheet, APNG, alpha composition |
| `src/components/AssetBrowser.tsx/.css` | Search, filters, paginated cards, inspector, selection queue, canvas |
| `src/components/MidiPreview.tsx` | Local soundbank upload and worklet MIDI preview |
| `src/core/filesystem/ZipDirectorySource.ts` | Read-only ZIP store/deflate source, CRC and bounds checking |
| `src/components/DirectoryPicker.tsx` | Folder and direct game-ZIP selection |
| `src/App.tsx` | Primary asset browser, old research panels inside Advanced disclosure |
| `scripts/local-runtime.cjs` | Portable TS research runner using TypeScript transpilation and read-only filesystem source |

Export selection is ordered, independent of canvas, with Ctrl/Command toggle and Shift range; reordering/removal buttons are present. APNG and sheets use top-left alignment and explicit user timing. ZIP includes a manifest and indexed/mask sidecars where available. Composition performs alpha blending, clipping and horizontal flip. Canvas supports dropping assets and numeric placement edits; direct dragging/reordering of already-placed canvas layers has not been implemented. No project save/reload or undo stack yet.

ZIP import verified every file's CRC and size in the supplied archives: MK1 326 files, MK2 614, MK3 87. It rejects encrypted, unsupported, split/ZIP64 archives, duplicate/unsafe paths and excessive expanded sizes. It uses DecompressionStream and targets modern browsers. It does not write archive paths to disk.

## 12. Tests and honest integration status

Completed:

- TypeScript `npm run lint` passed after ZIP/MIDI/browser additions.
- Production Vite build passed; only the existing large-chunk warning remains (about 3 MB main JS before gzip).
- Authentic MK1 export pipeline and MK2 O67–O89 chain ran successfully using the local runtime.
- MK3 collection census: 9,186 assets, 6,654 sprites, 416 images, 1,024 waves, 46 music tracks, no reported decoding failures.
- Original-code MK3 emulation: all 6,654 frames matched.
- Original-code MK2 music emulation: all 212 tracks across 33 songs matched event bytes/ticks/end/loop boundaries.
- `scripts/test-asset-exports.cjs`: alpha composition, horizontal flip, clipping, invalid sizes, selected ZIP ordering, indexed sidecars, corrupt MFIL, invalid IFF/MIDI checks passed.
- Independent Pillow APNG validation confirmed two-frame order, 125ms duration and exact RGBA pixels; sprite-sheet dimensions and pixels also matched.
- In-app browser loaded the MK3 folder, detected the game, decoded all 9,186 assets, and displayed cards. Ctrl-click selected two items; Shift range selected four. Adding to canvas did not change export selection. No browser console errors were observed at that point.
- ZIP loader authenticated all supplied archive member CRCs/sizes in Node.

Incomplete verification and known risks:

- Browser APNG download observation timed out in the automation tool; the downloaded file was not captured/verified through that UI path. Generator output itself passed independent decoding. Do not report full browser download end-to-end success.
- MIDI worklet/soundbank playback has not yet been manually heard or fully tested end-to-end. Only code compilation and original-event conversion are verified.
- Direct ZIP opening was added after the folder UI test; its decoder was verified in Node, but ZIP picker UI still needs an end-to-end browser pass.
- Full historical Vitest suite was not rerun in this continuation. Do not substitute the focused checks for it.
- MK1 `.WAV` case sensitivity bug found in collection census was fixed; final checkpoint census is the authority for the fix.
- MK1/MK2 adapters rely on evidence packages and do not populate exact original byte extents for every PNG entry; some source paths/lengths are package-oriented or zero, with evidence references. Improve per-asset original provenance rather than claiming it complete.
- MK1 unresolved grayscale assets currently lack indexed sidecars in the shared adapter, although evidence packages remain available. Preserve this distinction.
- Long research passes still run on the browser main thread; cancel is checked between steps, not within every loop. Memory can be substantial (thousands of RGBA frames and multiple packages). Move decoding to workers and bound cache/export memory before calling this robust for arbitrary inputs.
- Repeated rescan, source changes during asynchronous loading, empty/nonnumeric inputs, MIDI engine teardown while loading, bank replacement failure, and natural playback-end UI status deserve focused testing/hardening.
- Selection stores unique asset IDs, so repeated use of the same frame in a manually edited chain is not yet supported.
- PNG/APNG export metadata is not embedded in the image; use ZIP/evidence/scene metadata alongside standalone images.

## 13. Reproducing the checks

Node scripts require installed project dependencies. From source root:

```text
npm run lint
npm run build
node scripts/verify-checkpoint.cjs ../fixtures
node scripts/test-asset-exports.cjs
node scripts/probe-mk3.cjs ../fixtures/mk3
```

Python emulation uses project-local `.tools` with Unicorn. `scripts/disasm-mk3.py` uses Capstone; independent image validation uses Pillow. These third-party Python installations are excluded from the source download. Install into `.tools` if rerunning, e.g. `python -m pip install --target .tools unicorn capstone pillow`.

```text
python scripts/verify-mk3-emulation.py
python scripts/verify-mk2-music.py
```

Those two scripts expect sibling `../fixtures/mk3` and `../fixtures/mk2` plus their packaged JSON case/event evidence. They never execute the game natively; they run isolated routines in the emulator. Sandbox-specific note: installed Python packages and esbuild required escalated local execution in this session because the Windows sandbox could not read some installed tool files. This was a tooling restriction, not a game-data finding.

## 14. Recommended continuation order

1. Verify the downloadable archive manifest and fixture hashes; read this current section before historical appendix.
2. Finish browser integration QA: all three ZIPs, asset previews/audio, selected ZIP/APNG/sheet downloads, canvas exports, MIDI soundbank load/play/stop/change. Fix concrete failures and update evidence.
3. Improve per-asset original provenance and indexed sidecars; add progress/cancellation and worker execution; persist composition/selection projects; permit duplicate frames in chains.
4. Finish MK2 U8 loader/range/signedness proof, explicitly resolving the four exceptional headers; then expose qualified WAV exports and preserve originals.
5. Connect MK3 frame palette/index-shift and loader tables to exact records. Prove palette ownership with original-code/runtime evidence before exposing color fighter output.
6. Resolve MK3 ATAB/ATYP relocation, controls and multi-model FHDS joins. Build bounded structural animation IR, compose parts using proven coordinates, preserve loop/control evidence, and separate timing claims.
7. Complete MK2 remaining palette/animation/stage contracts and MK3 stage resource/placement graph. Recognizable source images alone do not establish assembled levels.
8. Revisit MK1 compiled animation assembly and remaining music/SAMPLES.DAT questions without weakening existing boundaries.
9. Run appropriate regression checks, make a new current handoff, and only call the broader goal complete when the requested asset types and usable workflows are actually covered or explicitly scoped with the user.

## 15. Sources and dependency provenance

Primary forensic authority is the user's original game bytes and the executable routines identified above. SDL_image's upstream `src/IMG_lbm.c` was consulted for standard IFF behavior; the DOS-specific reader here was independently implemented and its nonstandard fixture layouts derive from the supplied bytes. Official MIDI documentation was consulted for SMF framing. SpessaSynth official documentation was used for worklet/sequencer integration:

- https://github.com/libsdl-org/SDL_image/blob/main/src/IMG_lbm.c
- https://midi.org/standard-midi-files
- https://spessasus.github.io/spessasynth_lib/getting-started/simple-example/
- https://spessasus.github.io/spessasynth_lib/synthesizer/importing-the-worklet/

No external source supplied the MK3 decompressor or MK2 music format implementation. Local synthesizer bundles retain upstream license notices. No copyrighted game fixture files or soundbanks are included in the downloadable source archive.


## October 7 continuation supplement — O94D MK2 U8 PCM/WAV qualification

O94A-O94C authenticated the direct MK2 -> RM.DRV -> SCC/GMI sample path and bounded the canonical no-loop source interval. O94D now establishes the remaining source-domain PCM contract: the authenticated one-/two-/four-voice mixers consume signed 8-bit source bytes; direct U8 sample start calls the pitch routine with note 60; driver note 60 resolves to 262, exactly matching U8 `+0x12` in all 312 files; therefore `+0x10` is the source-rate term (190 files at 11025 Hz, 122 at 22050 Hz). A bounded mono 8-bit PCM WAVE export is authorized for `[+0,+4)` after XOR `0x80`. This is a source-domain reconstruction, not a bit-exact runtime mixer capture. The unread 33-byte/1-byte tail purpose remains UNKNOWN. See `CHECKPOINT_2026-10-07_O94D.md`.
