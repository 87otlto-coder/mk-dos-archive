# Pit II — read-only runtime trace field guide (research design; not an executable tracer)

## Goal

Differentiate the source-backed **zero-external-holder palette-cache model** from **persistent external palette-holder model**, and correlate DAC queue activity to frame presentation. One real fatality is sufficient if the trace captures the full lower-wall selector window.

## Events to log (all from unmodified MK2.EXE)

| Event | Original EXE physical *file* offset | Object-1 file-relative offset | Capture |
|---|---:|---:|---|
| Wall selector | `0x80721` | `0x1EACD` | Selector index (`0x1376B`), chosen source sprite, monotonic event counter |
| Tagged wall removal | `0x86C7D` | `0x25029` | Object palette slot (+0x30), before and after cache reference count |
| Palette release | `0x7B505` | `0x198B1` | Slot, source pointer, count before/after |
| Palette acquire | `0x7B439` | `0x197E5` | Source pointer, return slot, hit/miss, count after |
| DAC queue append | `0x7B2D0` | `0x1967C` | Source ptr, dest index, count, ring cursors |
| Palette flush | `0x7B30B` | `0x196B7` | Queue read/write cursors, flag `0x563E0` before/after |
| Frame controller | `0x67050` | `0x053FC` | Mode `0x3014C`, enabled `0x75CF2`, pending `0x563E0`, toggle `0x562D4` |
| Video transfer entry | `0x65420` | `0x037CC` | monotonic event counter; current selector / palette status |

**Important mapping caveat:** these values are file-physical offsets and source-object offsets, NOT confirmed in-process linear addresses. The debugger must first recover the actual loaded Object-1 code base. Do not set `BPLM` directly to the physical file addresses. Read memory by live mapped addresses, not file offsets.

## Capture fields

A machine-readable trace should provide at least:

`{event_seq, host_monotonic_ns_or_emulated_ticks, frame_controller_seq, transfer_seq, task_seq, selector_step, sprite_id, palette_slot, source_ptr, refcount_before, refcount_after, queued_commands, queue_read, queue_write, pending_before, pending_after, toggle_before, toggle_after, branch}`

Not every event needs every field, but per-event order must be preserved. Use the active values observed in memory rather than inferred from adjacent instructions.

## Non-negotiable controls

1. Run the original owner-supplied game resources with only the already runtime-verified 11-byte F9 cheat-menu unlock, if required for stage selection. Preserve and hash original unmodified MK2 separately.
2. Correlate at least one traced selection with the observed original graphic-58 and graphic-59 presentations from O246/O247.
3. Validate the observed cache source pointer against `0x27958`; verify that the *runtime* address is translated through the process's LE loader mapping.
4. Log cache-hit and miss branches by observed instructions, not by visual color changes. Log relocation-triggered *additional* queue inserts separately.
5. Record actual DAC queue drains; a queued palette update is not automatically a hardware write.
6. Record transfer calls, not just composition calls. Transfer calls alone do not guarantee the host recorded an independent frame.
7. Keep the original video baseline and 50 fps observation distinct from the roughly 60 Hz task-timer source.

## Debugger choice

DOSBox-X has documented `BPM`, `BPLM`, `MEMDUMPBIN`, `SELINFO` and `LOG`/`LOGC` functionality in its debugger build. This is a feasible foundation for a read-only trace, but **no ready-to-run script or automated capture tool has been validated here**. The user's ordinary DOSBox executable is not assumed to have these debugger features. Do not use untested in-game binary hooks to manufacture traces.

Documentation: https://github.com/joncampbell123/dosbox-x/blob/master/README.debugger
