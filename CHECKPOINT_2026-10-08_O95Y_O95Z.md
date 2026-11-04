# MK DOS Archive — O95Y + O95Z Exact Packed EOF-Reference and Fingerprint Checkpoint

**Date:** 2026-10-08 (SAST)  
**Game:** Mortal Kombat II DOS  
**Status:** VERIFIED BOUNDED RESEARCH; STAGE/BACKGROUND SEMANTICS AND MK2 CLOSURE REMAIN OPEN

## Authority and fixture

- Derived from the O95X source archive SHA-256 `b9bea3f4aa1c23f5b715632109e73b80bc78ba34d195779342ac9b99a2c3ef91`.
- Read-only original `MK2.EXE` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- O95W exact partial-GRA interval map and O95X six aligned suffix census are checked inputs; their historic outputs are unmodified.

## O95Y — authentic contiguous packed resource references

New evidence file: `mk2_overlay_packed_suffix_reference_table_o95y_2026-10-08.json`.

At original **EXE physical `0xCFBAC`**, eight consecutive DWORD entries contain seven nonzero packed resource references and one zero word. The high byte is a resource ID resolved through the authentic executable filename pool; the low 24 bits give a bounded offset in that resource. Each of the seven **exact four-byte packed values occurs once in the entire authentic EXE** (bytewise scan, not alignment-limited).

| Slot | Resource | Packed reference | Offset | Bytes to EOF | 7,168-byte units |
|---|---|---|---:|---:|---:|
| 0 | TOMB.GRA | `0x1C00F920` | 63,776 | 43,008 | 6 |
| 1 | BATTLE.GRA | `0x2200E82C` | 59,436 | 35,840 | 5 |
| 2 | TOWER.GRA | `0x1E00DBCC` | 56,268 | 57,344 | 8 |
| 3 | FOREST.GRA | `0x1B0305E4` | 198,116 | 28,672 | 4 |
| 4 | ARMORY.GRA | `0x1A01ED80` | 126,336 | 50,176 | 7 |
| 5 | ZERO | `0x00000000` | — | — | — |
| 6 | PORTAL.GRA | `0x1900DE54` | 56,916 | 35,840 | 5 |
| 7 | ARENA.GRA | `0x1F016178` | 90,488 | 35,840 | 5 |

The immediately following DWORD at `0xCFBCC` is also zero; that is a structural observation, not proven stream termination. All six O95X previously observed uncovered suffix starts are **exactly** matched by distinct O95Y entries, with identical EOF boundaries and suffix SHA-256 hashes.

**New:** `BATTLE.GRA`, one of the 14 O69 **zero-candidate** pooled resources, has a precise executable packed reference to an otherwise not-O69-qualified 35,840-byte EOF region. This does not mean it is graphics-decodable under the O69 descriptor grammar, or that `BATTLE` names a stage.

**Qualification boundary:** the contiguous physical table is an *authenticated candidate* data grouping, but **no code consumer, table iteration count, stage ordering, framebuffer width, palette binding, or display geometry has been established**. Seven pointed-to byte regions do not establish seven reconstructed stage layers. No `.GRA` file or sprite descriptor is newly exact-full-qualified.

- Original TypeScript/Node producer: PASS.
- Independently implemented Python fixture/pool/byte verifier: **83 checks / 0 failures**.
- Deliberately changing the BATTLE offset was rejected.

## O95Z — exact EOF-tail fingerprint population

New evidence file: `mk2_packed_eof_tail_fingerprint_census_o95z_2026-10-08.json`.

The seven uniquely referenced EOF regions total **286,720 bytes**. Every size is an exact multiple of **7,168 bytes** (= 7 × 1,024), yielding the following arithmetic partitions across authentic bytes:

- 40 candidate 7,168-byte blocks: **40 unique SHA-256 values**.
- 280 candidate 1,024-byte blocks: **280 unique SHA-256 values**.
- 1,120 candidate 256-byte blocks: **1,118 unique SHA-256 values** (one 3-way matching block group, confined to the first three 256-byte chunks in the ARMORY suffix).

All individual candidates are hashed in the evidence JSON. This is a lossless byte-level fingerprint inventory suitable for future exact consumer testing and deduplication controls. The arbitrary proposed partition sizes are *not* an authenticated record grammar, pixel tile dimension, camera width, palette index interpretation, or runtime rendering procedure.

- Original TypeScript/Node producer: PASS.
- Independent Python per-block rehashing verifier: **1,526 checks / 0 failures**.
- Deliberately altering a single 7,168-byte fingerprint was rejected.

## Regression and integrity

O95X independent verifier was rerun on the same untouched MK2 fixture: **62 checks / 0 failures**. Both new Node entrypoints pass syntax checking; both Python verifiers compile. Two intentional negative controls rejected as expected.

Historical totals remain deliberately unchanged:

- 7 bounded fixed-identity animation examples.
- Selected-pointer paths: 210/253 terminal; 239/253 strong; 14 held.
- 9/17 correct-color slot contracts; 17/17 exact palette-record pointers.
- 94/124 `.GRA` exact-full resources.

## Required continuation

**O96A should seek the executable or loader consumer of the exact `0xCFBAC` table and its seven bounded EOF pointers.** Follow the real binary address spaces (LE objects versus post-LE overlay/loader) and only promote a renderer/data grammar if code establishes it. If the lookup remains unsupported, switch to an independently bounded MK2 closure blocker (palette-handle ownership, stage placement or hardware audio) rather than imposing a guessed 256-width or seven-layer model.

The user-authorized order remains: **finish MK2 → finish MK1 → finish MK3 → discuss UI/usability → implement extractor**. No retroactive changes to original game binaries or frozen research evidence.
