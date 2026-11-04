# O209 — Stage Fatality Dispatcher Feasibility / Gate 1

**Decision:** **NO-GO for a direct F8 hotkey prototype at present.** Three bounded static passes completed. This does **not** assert that no shared fatality dispatcher exists. It means we have not established a safe, source-verified fatality dispatch address, state preconditions, or register/call conventions. **Do not patch the original executable using the candidates in this checkpoint.**

## Canonical source

- Original DOS `MK2.EXE`: 861,133 bytes.
- SHA-256: `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`.
- LE image physical bases: Object 1 `0x61C54`, Object 2 `0xA0C54`.
- Independent LE relocation parse: 27,004 original records / 26,994 distinct locations.
- All original inputs are read only. Game files and the user's DOSBox setup were not modified.

## Pass 1 — Original stage and root relationships

Three valid *arena families* are authenticated, using relocation-backed pointer chains in the original scene-selection tables:

| Stage | Source stage index | Resource | Stage initializer, physical EXE offset |
|---|---:|---|---:|
| Dead Pool | 0 | `DEDPOOL.GRA` | `0x82447` |
| Kombat Tomb | 1 | `TOMB.GRA` | `0x82CD7` |
| The Pit II | 6 | `PIT.GRA` | `0x831B2` |

Each mode (`==2`, `==1`, other) points to its corresponding original stage root and a source-identical initializer *for that stage*. The three initializer addresses are distinct. These are **background setup** entry points and are **not** identified finishing move routines. The scene mode dispatch at code offset `0x82321` chooses between source Object 2 tables `0x15BEC`, `0x15C68`, `0x15CE4`. This does not reveal the stage-fatality dispatcher.

## Pass 2 — Hidden cheat-menu evidence

Source text at physical offsets:

- `0xCE041`: `FATALITY 1`
- `0xCE04C`: `FATALITY 2`
- `0xCE057`: `BABALITY`
- `0xCE060`: `FRIENDSHIP`

The original keyboard-driven menu has navigation comparisons at `0x9B3E3`, `0x9B3EB`, `0x9B3F1`, `0x9B3F7`, `0x9B401`; the menu selection/toggle handler starts at `0x9B4F5`. The quoted text contains no visible `STAGE FATALITY` option. This is **not proof** that the game lacks an internal stage-fatality dispatcher. We have not demonstrated that the menu's existing fatality toggles select the same action IDs as stage fatalities.

Some original audio/media labels are promising search anchors: `PITFALL ` at physical `0xD1D02`, `PIT2EA` at `0xB50F5`, and `PIT2EB` at `0xB50FC`. Their *presence* is verified; they do not prove a control-flow path or a routine's semantics.

## Pass 3 — Dispatch feasibility/safety assessment

**Rejected as unsupported injection targets:** background initializer functions; cheat menu navigation/option toggles; audio filename entries; scene-selection dispatcher.

The shared scratch location `0x75A80` is reused. Earlier O125/O127 research warns that it can be a selector temporarily and a completely different intermediate elsewhere, so blanket scans of its read/write references **must not** be used as evidence of a global stage-fatality selector.

A viable next gate would require locating original finishing-state input recognition and common action dispatch, proving how game state and fighter structs must be prepared, and then testing an isolated reversible clone **without skipping unknown initialization**. That is **additional research**, outside the approved three-pass Gate 1. The earlier proposed 5–12-pass overall estimate cannot be treated as a guarantee.

**Practical next step:** Keep the DOS executable unchanged; use a one-key *input* macro during a valid `FINISH HIM` state to obtain direct DOSBox stage-fatality footage if it is needed sooner. A platform-wide direct hotkey should be reconsidered only if an authenticated finisher/dispatch path is found.

## Reproduce

From the source root, using your own canonical unmodified `MK2.EXE`:

```text
python tools/mk2_stage_fatality_gate1/trace_gate1.py --exe PATH_TO_ORIGINAL_MK2.EXE --out O209_GATE1_REPORT.json
python tools/mk2_stage_fatality_gate1/verify_gate1.py --exe PATH_TO_ORIGINAL_MK2.EXE --report O209_GATE1_REPORT.json
```

The producer refuses output overwrite. The independent verifier uses a *different established relocation parser* from the producer; both reject an incorrect executable fingerprint. These scripts do not generate patches, do not read/write game directories, and do not require npm.

## Preservation / limitations

O209 is a **research-only checkpoint**. It adds the bounded Gate 1 evidence tools and notes, without modifying any of O208's original files. No new UI runtime/build claims. The existence of specific stage fatalities is supported by period PC/DOS move guides and has not been independently demonstrated as a working automatic trigger here. The conditional config roots and sound labels are original-file findings; stage-fatality behavior remains unverified in the DOS executable's control flow.
