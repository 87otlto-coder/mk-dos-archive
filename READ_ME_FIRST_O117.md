# MK DOS Archive O117

New original Tomb control screenshot confirms the O115 observed-color floor reconstruction with 12,222/12,222 exact RGB matches in held-out regions of an independently fitted screenshot. The O116 Portal match remains 4,420/4,420. O117 adds testable research records, reproducible code, and an updated master handoff. It is a targeted screenshot evidence checkpoint, not an additional 50-pass batch.

Reproduce from user-supplied original MK2 game ZIP:

```bash
python tools/mk2_stage_runtime_witness/fit_o117_tomb_control.py \
  --original-mk2 /path/to/mk2.zip \
  --control evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png \
  --ramp-report research_outputs/O115_TOMB_23_RAMP.json
python tools/mk2_stage_runtime_witness/verify_o117_tomb_independent.py \
  --original-mk2 /path/to/mk2.zip \
  --control evidence/mk2_o117/TOMB_ORIGINAL_CONTROL_20261011.png \
  --ramp-report research_outputs/O115_TOMB_23_RAMP.json \
  --report research_outputs/O117_TOMB_ORIGINAL_CONTROL_RECONSTRUCTION.json
```

The script requires Pillow; it never modifies the original game files. No original executable or game resource is included in this archive. A screenshot-relative source offset is not a recovered camera register or palette handle.
