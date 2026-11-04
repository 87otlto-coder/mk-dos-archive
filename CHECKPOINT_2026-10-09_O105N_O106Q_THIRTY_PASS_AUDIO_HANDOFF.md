# MK DOS Archive — O105N–O106Q 30-Pass Audio Handoff Checkpoint

**2026-10-09 · Authentic original DOS MK2 · 30 / 30 verified bounded studies · MK2 REMAINS OPEN**

## Priority result

This batch extends O104J–O105M's hardware-extension filename selector with an **executable-backed bounded DOS file-to-buffer-to-service path**. At MK2.EXE file-backed physical `0x814D8` the routine calls music filename construction at `0x81528`, then follows:

- `0x814E4`: `mov ah,0x3D / int 21h` (open the constructed filename; `EDX=0x13758`).
- `0x814EC`: `ECX=0xFFFF` maximum requested byte count.
- `0x814F1–0x81503`: read a shared-structure pointer from global `0x3177C`, derive destination from `WORD [pointer+0x1A] << 4` plus `WORD [pointer+0x18]`.
- `0x81505`: `mov ah,0x3F / int 21h` (read into derived destination).
- `0x8150D`: `mov ah,0x3E / int 21h` (close).
- `0x81513–0x81517`: `mov ah,0x04 / mov al,0x01 / int 80h` after the successful DOS operations.

The five filename branches still use exact selector values **1=`.MID`**, **2=`.LAP`**, **4=`.GVS`**, **8=`.SBL`**, **16=`.AWE`**. Every one of the **165** native music resources is smaller than `0xFFFF`; the largest is **`livfor.mid`, 16,649 bytes**. This only proves the requested transfer cap does not itself truncate these on-disk files: actual completed reads, destination capacity, and service implementation remain unobserved. **The precise `INT 80h` service behavior is unqualified; it is not yet a music-event consumer proof.**

## Separate music-resource findings

All 165 original resources (33 songs × five variants) were independently read and recomputed. The already known `L+7+2N` file bound, indexed byte-marker consistency, strict offsets, 931 named offsets, and six extra interior `0x91`/`0x98` markers remain reproducible.

The physical **`0x60` marker is at `L+2`**, and the shared song-family metadata byte is at **`L+3`**, where `L` is the little-endian word stored at bytes 1–2. The metadata byte agrees across all five variants for **all 33 song families**. It must not be confused with the two-byte footer length echo at `L` and `L+1`. This precise positioning was corrected before final verification.

New pairwise *indexed-identifier-sequence* comparisons (same song family, compared as ordered byte arrays at the authenticated offsets) establish heterogeneity across hardware:

| Compared formats | Same indexed IDs out of 33 songs |
|---|---:|
| MID / GVS | 25 |
| MID / AWE | 27 |
| GVS / AWE | 31 |
| MID / LAP | 4 |
| MID / SBL | 0 |
| LAP / GVS | 3 |
| LAP / SBL | 4 |
| LAP / AWE | 4 |
| GVS / SBL | 0 |
| SBL / AWE | 0 |

Therefore, matching metadata does **not** imply identical section layouts, let alone identical musical event streams. Byte-distribution studies of `0x90`, `0x99`, `0x91`, and `0x98` remain raw-byte contexts and must not be mistaken for decoded notes or driver commands.

The native `SCC.BIN` image and `GMI.BIN` are byte-identical. The historical O94A evidence specifically authenticates SCC/GMI installation for the `.U8` PCM request path; this **does not** prove that SCC/GMI consumes the five music formats. The per-format native BIN pairing in O105N–O106Q remains a candidate **filename association**, not a runtime driver binding.

## Thirty bounded investigations

| Passes | Topic | Evidence qualification |
|---|---|---|
| O105N–O105R | DOS file-to-buffer-to-`INT 80h` transfer path for each format | Authenticated executable instruction bytes and exact 165-file identities; service semantics held |
| O105S–O105W | Indexed marker anchoring by hardware format | Independent source-byte offsets, identifiers, exceptional interior markers |
| O105X–O106B | Lossless sectional intervals and trailer hashes | Full original byte accounting; no musical section/channel semantics |
| O106C–O106G | Candidate raw `0x90/0x99/0x91/0x98` contexts | Exact byte counts and position hashes; no event tokenizer |
| O106H–O106L | Hardware-variant equality and marker-table ID sequences | Full 33×5 cross-format comparisons; no universal event map |
| O106M–O106Q | Native hardware driver binary identities and scope | Exact bytes; hardware/music binding not established |

Thirty independent pass records and one combined ledger: `evidence/mk2_o105n_o106q/`.

## Verification

- Source-native Python producer: **30 reports** / **165 audio resources**.
- Separately authored independent Node.js verifier: **8,494 checks / zero failures**. It reopens the original MK2 executable and all original audio files, checks the DOS instruction signatures, marker indices, section hashes, cross-hardware records, candidate driver bytes, and anti-overclaim flags.
- **30/30 deliberately falsified reports rejected**, **after updating the corresponding ledger hashes**. Originals stayed unchanged and passed independently.
- O104J–O105M regression: **6,802 passed**, no failures.
- O103F–O104I regression: **7,695 passed**, no failures.
- O102B–O103E regression: **27,504 passed**, no failures.
- New + regressions: **50,495 independent checks / zero failures** (excluding negative tests).

## Reproduction

```bash
python scripts/run-mk2-o105n-o106q-audio-handoff-thirty-pass.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o105n_o106q
node scripts/verify-mk2-o105n-o106q-audio-handoff-thirty-pass.mjs "$MK2/mk2.exe" "$MK2" evidence/mk2_o105n_o106q
python scripts/test-mk2-o105n-o106q-audio-handoff-negative-controls.py "$MK2/mk2.exe" "$MK2" evidence/mk2_o105n_o106q scripts/verify-mk2-o105n-o106q-audio-handoff-thirty-pass.mjs
```

## Open blockers and next useful target

1. The actual implementation and API contract of `INT 80h` request **AH=4, AL=1** after native DOS music read. Establish buffer consumption if supported by executable, real-mode bridge, or sound-driver code.
2. Driver-backed decoding of indexed `0x91`/`0x98` and candidate `0x90`/`0x99` events on held-out native music resources; no untested note, tempo, voice or channel claims.
3. If music post-load execution cannot be qualified statically, pivot back to unresolved packed graphics renderer/palette binding or the 14 held graphics resources rather than repeating catalog passes.

**Research order remains MK2 → MK1 → MK3 → UI/usability → extractor.** MK2 graphics remain **110/124 exact-full**, seven bounded fixed-identity animation witnesses; no new exact-full graphics or correctly timed music claims were promoted here. The 30 passes are independently checkable byte-level investigations, **not 30 new format breakthroughs**.
