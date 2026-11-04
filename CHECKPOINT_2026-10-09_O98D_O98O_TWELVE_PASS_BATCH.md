# MK DOS Archive — Twelve-Pass Research Batch O98D–O98O

**2026-10-09 | authentic DOS MK2 | twelve independent bounded pass reports | MK2 remains OPEN**

## Purpose

User requested a larger multi-pass autonomous run following the ten-pass O97T–O98C stress test. This batch completed **twelve** bounded hypotheses, grouped around (a) the alternative dual-process transition, (b) shared control-list cursor installation and state restoration, and (c) Mountain-related initial offsets and descriptor producer. These twelve audits are not twelve new animations, complete stages, or independently observed gameplay events. All conclusions remain conditional on code-path execution.

**Fixture**: authentic `mk2/mk2.exe` SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

## Pass-by-pass evidence

| Pass | Tested executable relationship | Outcome / limitation |
|---|---|---|
| **O98D** | `0x84AE8..0x84B40`: actor-state switch tests `0x76522`, selects between globals `0x76146/0x7614E` and `0x75FC2/0x75FCA`, then copies a selected object's `+0x48` field to `[ESI+0x48]`. | **SUPPORTED conditional**: two source pathways, not two proven scenes. |
| **O98E** | `0x84BFA..0x84C6E`: starts with value **22**, stores it at `[ESI+0x40]`, optionally constructs third process callback Object-1 `0x23107`, increments global `0x75A80` while unsigned `<28`, then sets **30**. | **SUPPORTED conditional**: scalar script with bounded loop. No timing/event semantics assigned. |
| **O98F** | `0x84C90`: an alternative installation writes relocated Object-2 cursor `0x15D60` into `0x75CF6`, clears `0x75CE8`, and calls `0x84DBC`. | **SUPPORTED** for code path, **UNPROVEN** runtime coactivation with Mountain. |
| **O98G** | `0x84DBC..0x84DF5`: helper stores **13** to *different global* `0x75A78`, later adds **12** and enters consumer `0x63E79`; installs Object data field `+0x3C`. | **SUPPORTED conditional**: this 13 is **not** proof of scene selector 13 because it is a different global and call context. |
| **O98H** | `0x84D01..0x84D4B`: event `0xA4`, state flag/global `0x75CE8=0xFFFF`, transition calls `0x650CE/0x93ACE/0x64685`, yield, index routine `0x82321`. | **SUPPORTED** order, **UNPROVEN** runtime mapping or palette state. |
| **O98I** | `0x84D5B..0x84DB7`: typed relocated Object-1 `0x32835` passed with EBX **256** to process constructor `0x67222`; separate mutable state assignments. | **SUPPORTED** constructor availability, not observed callback execution. |
| **O98J** | `0x84DF6..0x84E5D`: state copied from `0x75CE8` to `0x75A78`, sentinel `0x7FFF` installed, scheduler yields, then global is restored from `0x75A78`. | **SUPPORTED conditional** preservation/restore; scheduler units unknown. |
| **O98K** | `0x84ED0..0x84F08`: saves `0x75A80` on stack, writes **30**, invokes `0x82321`, and restores old `0x75A80` via a POP-to-memory instruction. | **SUPPORTED**: selector **30** must not be assumed to persist after wrapper. |
| **O98L** | `0x85F9A..0x86015`: Mountain setup writes **13** to `0x75A80` and calls `0x82321`, then uses conditional actor sources and initializes list head `0x84358`. | **SUPPORTED conditional** caller path; cannot assign camera/scene time. |
| **O98M** | `0x860C1..0x860FC`: conditional base accumulator initializer reads `0x7652A`, indexes signed-word table at Object-2 `0x1C2A8`, sign-extends the selected word and shifts it left 16 before storing into `0x842E8`; three guard branches. | **SUPPORTED conditional** numeric initializer. First source words are `648,648,601,554,507,460,413,366`. Not pixels or frames by proof. |
| **O98N** | `0x86015..0x86085`: bounded portrait-token consumer exits on negative or token **13**, calls object constructor `0x8608C`; after this path two producer `0x81BB3` calls are separated by setup, then the typed relocated producer-loop callback `0x1FF44` enters constructor `0x67222`. | **SUPPORTED conditional** known producer relationship; no proof all conditions hold during gameplay. |
| **O98O** | Three independent executable sites (`0x84C90`, `0x9882D`, `0x98A4A`) install Object-2 `0x15D60` into `0x75CF6`, all with typed LE relocations. The `0x98828` routine also clears `0x75CE8` and `0x75CEE` and sets `0x762CA=1`; `0x98A4A` installs `0x75A7C=0x20`. | **SUPPORTED** shared cursor, **REJECTED** assumption that a common cursor implies one common scene. |

## Highest-impact interpretation

1. **Positive-token cursor `0x15D60` is shared across at least three executable installer contexts**, and the code changes companion globals differently. The cursor is a reusable mechanism, not an unconditional identifier of the Mountain screen.
2. A new bounded **22→27 conditional scalar loop followed by 30** is verified, with a distinct typed process callback in that branch. This is a candidate script sequence, but cannot be labelled fatality, jump, or an animation without more control-flow/runtime evidence.
3. A separate wrapper **temporarily** passes scalar 30 to the common selector, then restores `0x75A80`. Static analyses which propagate 30 beyond this code are invalid.
4. The Mountain accumulator's initialization can be traced to a **signed Object-2 table** through a conditional, typed machine-code path. Values and arithmetic are real; scroll direction, frame timing, camera units, and the actual selected table index remain unproven.
5. This batch strengthens boundaries rather than providing new exact-full graphics coverage or an additional bounded animation. Preserve **95/124 exact-full graphics**, **seven fixed-identity bounded animation witnesses**, all prior qualified palette/consumer counts.

## Independent verification and falsification

- Python producer: `scripts/run-mk2-o98d-o98o-twelve-pass-batch.py` emits a distinct JSON evidence report for every pass, with exact code-window SHA-256, opcode bytes and decoded operands.
- Separate Node verifier: `scripts/verify-mk2-o98d-o98o-twelve-pass-batch.mjs` re-reads original EXE, independently parses **27,004 LE relocation records**, checks typed Object-1/Object-2 pointer operands, separately authenticates all pass instruction locations and semantics, and enforces *UNPROVEN* runtime/camera/timing boundaries.
- **27,630 independent checks, zero failures**, twelve independently addressable reports.
- Negative controls: `scripts/test-mk2-o98d-o98o-twelve-pass-negative-controls.py` — **12/12 falsifications rejected** (operand, source-window hash or false runtime activation), all pristine reports subsequently passed.
- Seven earlier verifier suites **109,585 checks, zero failures**: O97P 27,332; O97Q 151; O97S 27,144; O97F 27,463; O97G 27,185; O97L 44; O97T–O98C 266.

Reproduce from the archive root with fixture `mk2/mk2.exe`:

```bash
python scripts/run-mk2-o98d-o98o-twelve-pass-batch.py "$EXE" .
node scripts/verify-mk2-o98d-o98o-twelve-pass-batch.mjs "$EXE" .
python scripts/test-mk2-o98d-o98o-twelve-pass-negative-controls.py "$EXE" .
```

Pass a final pass name (`O98M`) to the first two commands to run a single bounded case.

## Rejected or unresolved interpretations

- Shared cursor `0x15D60` **does not prove** that all its installer contexts draw the same scene or execute together.
- A call with selector 30 **does not prove** selector 30 remains live after `0x84EF3` POP restore.
- `0x75A80`, `0x75A78`, `0x75CF6`, and `0x75CE8` have distinct local roles; numbers matching across them do **not** establish semantics.
- Signed source table values **do not prove** display pixels, camera location, cadence or duration.
- Call and constructor mechanisms **do not prove** process scheduling at a particular scene or complete in-game palette ownership.
- No new gameplay execution was dynamically observed, no new correct-color rendered game screenshot is claimed.

## Next warranted work

**O98P:** audit consumers/entry conditions of each of the three `0x15D60` cursor installers to discriminate reusable display/UI paths from exclusive Mountain activation. If the control-flow proof plateaus, pivot to the remaining **29/124** not-yet-exact-full MK2 `.GRA` resources, then palette/audio boundaries. Do not spend many more rounds re-auditing the same mutable selector globals without improving actual exportability. Preserve **MK2 → MK1 → MK3 → UI/usability → extractor** order.
