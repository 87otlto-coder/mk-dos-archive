> **Superseded as of 2026-10-13:** The user explicitly removed all numerical research-pass limits. Continue autonomously while evidence supports concrete verification, and pause only for genuinely required runtime input. Historical cadence rules below must not be imposed. Preserve source-audit discipline, fail-closed tests, and source/game binaries separation.

# Coding agent research cadence — effective 2026-10-10

The user superseded the previous two-major-pass pause/handoff rule: use a **30-substantive-pass consolidation checkpoint**. The last consolidated source before this rule is **O110G**. Start counted passes at **O110H**. A substantive pass must supply new source-based qualification, a repeatable producer and independent verifier, explicit limits/confidence, and where appropriate adversarial negative controls. Re-running a regression, writing documentation, renaming files, or slicing one finding into trivial subparts does not count as a research pass. Internal correctness checks must run **per pass**; never defer safety verification until the 30th pass.

Counted progress in the present in-chat execution (not an ongoing background job):

| Sequence | Pass | Qualified outcome | Verification |
|---:|---|---|---|
| 1 | O110H | Palette handle table lifecycle and 60-slot exact state mechanism | 96 checks, 8 hostile reports rejected |
| 2 | O110I | Nine dynamic allocator-input source classes and handle return uses | 81 checks, 8 hostile reports rejected |
| 3 | O110J | Source-local stage literal 5/6 is independent of returned allocator handle | 35 checks, 8 hostile reports rejected |

**Progress: 3/30. Next research pass: O110K.** The anticipated 30th pass (if no other scope changes) would be O110AK. Naming does not itself qualify a pass. Full checkpoint/handoff is due only after 30 verified substantive passes; interim preservation of working source is permitted and must be called a development snapshot, not a completed checkpoint.

Do not alter the canonical original game files or weaken fail-closed interpretation just to hit a numerical target. Existing fixed roadmap: **MK2 → MK1 → MK3 → user-led UI/usability → extractor**. A runtime observation must be distinguished from a static machine-code witness. This document changes checkpoint frequency, **not** evidentiary quality or the obligation to disclose unresolved state.
