# MK2 O110W–O110Z — DOSBox runtime witness closeout, 2026-10-11

## What changed since the latest integrated source (O110V)

The O110V integrated source (13/30 independently verified research passes) was followed by separate external runtime experiments:

- **O110W (palette/renderer probes):** seven same-game installations with canonical EXE baseline and separate 48-colour palette edit, 64-colour palette edit, stage palette-bank force values 1/49/65, and skip-gate experiment. Original `run-logs.zip` includes per-variant DOSBox captures. User-run images show conspicuous interface recolouring on the 48-colour and 64-colour experiments. No unequivocal arena recolour on the three bank variants, and the skip-gate variant retained an apparent arena image. **Do not infer that the relevant code path is unused; gate/call coverage and render layering have not been instrumented.** The original O110W static probe was verified by its independent script before testing.
- **O110X→X4 (Windows DOSBox scripted test bot):** PowerShell bot corrected to handle sibling `DOSBOX/` and `MK2/` directories and Q/A punches, W/S kicks, SPACE block, arrow movement. Initial automation versions failed; O110X4 finally produced seven gameplay variant folders and screenshots. The O110X4 tool remains a convenience, not a canonical game simulator. See `tools/mk2_dosbox_test_bot/` and the original user `run-logs.zip` kept under `evidence/mk2_o110w/`.
- **O110Y (stage packed-resource probes):** the original MK2.EXE is **unchanged**; independent test directories alter only a defined packed suffix of `TOMB.GRA` or `PORTAL.GRA`, retaining exact file sizes, all prefix bytes, and no other game files. The suffix has authentic 896-byte scanline stride. Tomb: byte `63776` for 48 rows. Portal: byte `56916` for 40 rows. Alternating stripes/checker and constant-value probes are deterministic and source-reversible. The independent O110Y verifier reported **4,958 assertions**, with adversarial tests performed in previous session.
- **O110Z (native hidden background menu):** four test installs all use the same canonical-exe **11-byte** unlock edit at physical file offset `0xCCF0E`: original `1e 17 2e 16 26 12 20 1f 1f 16 26`; replacement `43 00 00 00 00 00 00 00 00 00 00` (F9 scancode, NUL termination). Exact patched EXE SHA-256 `95f925bcf343701cd92d2fc631df4df6c8c98d51b1553c62ae4918349b074928`; original SHA-256 `fa93afdc74160ef7bccf1454cd951bdf6008fb418d9c97f9e8c44a36f29f2c65`. Static verification: **2,514** checks, **5/5** hostile changes rejected. The original DOS menu's Background setting is used to select Tomb/Portal before the first fight; **it is not an EXE-only hardcoded first-stage override**.

## Runtime evidence received from user on October 11

| Test | Supplied image | Visible arena | Visible outcome |
|---|---|---|---|
| 10 (`10_CHEAT_CONTROL`) | `10.png` | Portal | Original textured floor |
| 11 (`11_CHEAT_TOMB_CHECKER`) | `11.png` | Kombat Tomb | Alternating checker floor |
| 12 (`12_CHEAT_TOMB_FLAT`) | `12.png` | Kombat Tomb | Broad nearly uniform brown floor |
| 13 (`13_CHEAT_PORTAL_CHECKER`) | `13.png` | Portal | Coarse checker floor |

The screenshots corroborate the earlier binary-diff attribution: the edited packed `.GRA` suffixes contribute to **visible gameplay floor pixels** independently of unchanged fighters and substantial unchanged upper-stage elements. This is **RUNTIME OBSERVED**, not merely an offline synthetic renderer. The screenshot images are scaled, captures are not frame-aligned, and the user did not supply cheat-menu navigation traces. A stronger future same-stage baseline for Tomb is worth capturing, but the two distinct Tomb resource-probe outcomes already strongly support the runtime mechanism.

**Do not infer from this:** the final palette selected at every stage pixel; palette-handle-1 identity; complete stage construction/ownership; all-stage applicability; GPU-independent deterministic rebuild; sound semantics; animation schedule; existence of a general safe writer for unqualified GRA spans.

## Source inclusion and canonical files

- Latest application source inherited, unmodified except for explicitly added tools/docs: `MK_DOS_Archive_Development_Through_O110V_13_of_30_2026-10-10.zip`.
- O110W builder/verifier included in `scripts/`; original probe manifest under `evidence/mk2_o110w/`.
- O110Y builder/verifier/adversarial tests included in `scripts/`. O110Z builder/verifier/tamper test included in `scripts/`.
- Runtime screenshots, exact SHA evidence and manifest under `evidence/mk2_o110z/`.
- The O110X4 corrected DOSBox bot scripts under `tools/mk2_dosbox_test_bot/`.
- **No edited commercial game EXEs or full 614-file copies are added to the application source.** The test directories remain separately distributed in `MK2_O110Z_Tomb_Portal_Stage_Selector_Complete_Test_Kit_2026-10-11.zip`.

## Recommended next steps

1. Promote O110Y's authentic in-place packed suffix into a **bounded resource writer model**, with exact no-edit byte round trip, changed-range verification, and reversal. Start with Tomb/Portal, not general `.GRA` rewriting.
2. Investigate **viewport-to-gameplay floor placement** across the original 896-wide source and renderer output. Verify which rows are actually in view and how the bank-start/offset conversion is applied.
3. Capture frame-controlled baseline + edited same-stage Tomb/Portal screenshots if precise overlap calculations are required; use the unlocked cheat menu for selection, optionally Soak Test as a separate behavioral experiment.
4. Work back from the visible floor's palette indices to runtime bank/handle writes; an actual guest-state trace or source-backed controlled instrumentation is required to establish handle one at render time.
5. Continue MK2 animation and held-resource ownership work (`VFRAME`, `PLAYSTA`, `CAVE`, `MONKS`) without asserting unsupported layouts.

## Pass-count discipline

**Research ledger remains 13/30**, last independently closed O110V. O110W–O110Z now have **source/static and user-reported runtime observations**, but are preserved as separate experiment qualifications until explicit independent milestone accounting (no retroactive pass inflation). The 30-pass checkpoint requested by the user remains the active policy. MK2 remains OPEN. Research order: MK2 → MK1 → MK3 → UI/usability → extractor/compiler.
