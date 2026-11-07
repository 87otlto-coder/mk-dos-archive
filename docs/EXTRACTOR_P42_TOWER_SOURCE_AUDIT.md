# P42 TOWER existing-effect source audit
2026-11-07; first interim after P41, develop only.

Independent original EXE/GRA decoding verifies seven existing tower_original_effect frames: writer 0x82E6C, Object-2 list 0x16490, marker 1 and back-reference, resource slot 30. Exact geometry/anchors, descriptors, indices, paint masks and encoded hashes are recorded in the evidence.

**PASS: 34,716 decoder checks; 17,325 indexed pixels.** Seven contiguous streams partition **[40776,56268), 15,492 bytes**. This fills the P40 report gap using already-exported images; no new artwork, runtime source changes, representation counts or native palette/timing claims.

Reproduce: python scripts/verify-mk2-p42-tower-source-audit.py <original-dir> --report <private-json>.

P41 remains the latest fresh full three-game verification. Existing source-linked TOWER candidate palette does not establish live DAC ownership. Native alpha, activation, timing and world placement remain unknown; original-data browser validation pending. Next P43 integrates only these qualified intervals with negative/preservation controls. Main unchanged; original data remains outside Git.
