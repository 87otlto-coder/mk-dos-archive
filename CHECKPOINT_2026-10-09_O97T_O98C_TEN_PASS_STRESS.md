# MK DOS Archive — Ten-Pass Stress Test — O97T through O98C

**2026-10-09 | authentic DOS MK2 | ten separately tested bounded passes | MK2 OPEN**

## Scope and outcome

User explicitly requested ten passes in one uninterrupted execution batch. This was a **stress test of bounded machine-code hypotheses**, not ten separate complete animations or full stage reconstructions. Each pass writes its own JSON evidence report; a separately implemented Node verifier independently reads `mk2.exe` and verifies the witnesses, including LE relocation records where applicable.

### Ten tests

| Pass | Focus | Verified outcome |
|---|---|---|
| **O97T** | Early constructor setup | Two mode calls (4 and 259), a base-accumulator zero and one profile callback registration; no additional callback registered in this bounded routine. |
| **O97U** | Later dual process setup | Separate setup path invokes actor-state helper and registers two callback entrypoints, one with EBX 4 and another with EBX 256. |
| **O97V** | Second callback literal phases | Three consecutive literal global pairs (0x30050,0x30), (0x50050,0x40), (0x70050,0xF40), each calling the same helper. |
| **O97W** | Shared helper and yield | The common helper performs two direct calls and tail-jumps into scheduler yield with a value from 0x75A7C. |
| **O97X** | Four subsequent event/yield pairs | Event values 0xA3,0x3B,0x3C,0x3D interleave with scheduler arguments 0x30,0x28,0x28,0x78; scheduler arguments are not wall-clock times. |
| **O97Y** | Mutable global multiplexing | Another continuation writes numeric 22 into 0x75A80 and copies it to an object +0x40 field; other callback uses packed non-slot literals in that global. |
| **O97Z** | Typed callback entrypoints | Both distinct Object-1 callback pointers have authentic typed LE relocations; both use process field +0x1C from constructor to scheduler dispatch. |
| **O98A** | Renderer visibility gates | Object processing conditionally adds two offset fields when 0x75A88 is zero, then gates a separate path on bit 1 of 0x562D4; it does not guarantee visible pixels. |
| **O98B** | Ten-field accumulator update | Ten source-to-destination DWORD additions occur in order at 0x93433..0x934A8; this is control arithmetic, not a measured frame interval. |
| **O98C** | Distinct selector contexts | One path writes literal 13 before the previously qualified Mountain table selector; another writes literal 22 to same mutable global before object field copying. No shared scene activation proven. |

## Notable advancement

The later process setup at `0x84B40` conditionally registers **two** different callbacks in order: Object-1 `0x2038A` (physical `0x81FDE`, prior 18-profile directional selector) and Object-1 `0x23209` (physical `0x84E5D`, newly qualified three-phase callback). Both are typed LE relocations and use the previously verified process constructor/scheduler entry field `+0x1C`.

The secondary callback runs three consecutive global-pair assignments, passes each through shared helper `0x84EB7` and finally transfers control to the scheduler exit. A separate later routine writes literal `22` to the same mutable `0x75A80` global, while the authenticated Mountain path writes literal `13` immediately before the selector call. These distinct uses demonstrate why this global must not be interpreted as a stable stage identity outside its specific code path.

## Hypothesis classification

| Hypothesis | Classification |
|---|---|
| Two callback entries are constructible in later setup | **SUPPORTED conditionally**: machine code, typed relocations and constructor contracts |
| Second callback has exactly three literal helper phases | **SUPPORTED** for authenticated executable path |
| Renderer offsets and accumulator arithmetic are conditional | **SUPPORTED** in bounded static paths |
| Scheduler numeric arguments are measured milliseconds/frames | **UNPROVEN** |
| The two registered callbacks execute together at a particular gameplay point | **UNPROVEN** |
| Literal 22 is another name for Mountain selector 13 | **NOT SUPPORTED** by site-local provenance; shared global is mutable |
| This closes battle-plan visual coactivation, palette handles or scrolling speed | **UNPROVEN** |
| 10 new complete sequences or stages have been discovered | **REJECTED as an interpretation**: these are ten limited verification passes |

## Validation

- Ten separately generated source-byte evidence files with fixed physical slices, numeric operands and control-flow transfers.
- Independent Node verifier: **266 checks, zero failures** across all ten; O97Z independently parses all **27,004** LE relocation records to confirm both callback pointer types.
- **10/10 deliberate factual or semantic falsifications rejected**, with pristine report restored and independently rerun after each mutation.
- Prior independent regressions: O97P **27,332**, O97Q **151**, O97R **48**, O97S **27,144**, O97N **247**, O97O **317**, O97F **27,463**, O97G **27,185**, O97J **27,191** = **137,078 additional checks, zero failures**.
- Fixture SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.

## Reproduction

From source root, with authenticated `$EXE` and source `$PWD`:

```bash
python scripts/run-mk2-o97t-o98c-ten-pass-stress.py "$EXE" .
node scripts/verify-mk2-o97t-o98c-ten-pass-stress.mjs "$EXE" .
python scripts/test-mk2-o97t-o98c-ten-pass-negative-controls.py "$EXE" .
```

To replay one pass, append its ID (for example `O97V`) to producer or verifier invocation. Each of the ten JSON reports is frozen in the source archive.

## Unchanged research boundaries / next priority

- **MK2 OPEN**: visual coactivation of Mountain battle-plan tower/portraits/landscape remains unobserved; camera, actual palette assignment, scheduler cadence and scene entry remain unqualified.
- **95/124** resource exact-full scope (including `MOUNTAIN.GRA`) remains unchanged; seven bounded fixed-identity animation witnesses remain unchanged; correct-color identity-slot and consumer-route counts remain unchanged.
- The ten-pass stress effort is a **process improvement and conditional scheduler-state qualification**; avoid interpreting the count of bounded audits as corpus coverage.
- Next: investigate entry reachability for the later dual-process setup and relation to Mountain configuration; if no sound chain, pivot to other unresolved MK2 resource/palette/audio gaps rather than repeating adjacent pointer scans.
- Enforce planned order: MK2 → MK1 → MK3 research, then UI/usability, then extractor implementation.
