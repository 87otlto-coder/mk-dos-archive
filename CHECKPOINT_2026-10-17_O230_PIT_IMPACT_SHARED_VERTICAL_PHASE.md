# O230 — Independent wall/blood displacement correlation at settled Pit II impact

**Evidence:** original O225 96px source rock tile grid at phase `(48,16)`; independently video-matched O214 post-impact source55 rocky wall at phase `(48,12)`; independently original EXE-spawned original palette BLOOD.GRA sprite177 and native-video placement verified in O228–O229 at precisely `(0,-4)` from the original source-coded integer 3/4 transform.

At captured DOSBox frames **903 (30.1s)** and **930 (31.0s)**, 96px rocky wall source55 has original source phase `(48,16)` and observed phase `(48,12)`, while at least ten independently color-verified blood177 placements have original source-code-transformed points and observed positions with precisely the same screen-space displacement `(0,-4)`. Two unrelated original sprite/resource groups therefore exhibit the **same measured vertical scene displacement** in independently verified video matches. This argues against a fabricated blood-only 4px correction; the actual original runtime camera/viewport operation is still unknown.

**Transition boundary:** O214 has frames 894 `(48,16)`, 895 `(48,12)`, 896 and 897 `(48,16)` as its best video phase assignments. Thus do NOT claim a universal `-4` camera offset during the entire transition or a proven persistent hardware scroll. Treat the stable later-interval agreement as confirmed measurement, not source-executed camera arithmetic.

`scripts/verify-o230-pit-impact-shared-vertical-displacement.py` checks original EXE/FALL/BLOOD hashes; original O225 and O229 report byte SHA, inherited O214 video hash, independent visible graphic identities and their offsets, early phase exceptions, and three deliberately mutated source/evidence conditions. Independent reproductions are byte identical: `research_outputs/O230_PIT_SHARED_ROCK_BLOOD_VERTICAL_DISPLACEMENT.json` SHA-256 **`0f5c7890595f7c14b79388f7c173158968df7dd7bbea5d8f4db138bde3d3bda7`**.

Original binaries untouched, no full compositor or runtime DAC/camera trace claimed.

```
python scripts/verify-o230-pit-impact-shared-vertical-displacement.py --game-zip /path/to/owner-mk2.zip --project . --out /new/nonexistent/destination
```
