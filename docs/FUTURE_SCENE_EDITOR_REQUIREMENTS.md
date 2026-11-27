# Future MK2 scene editor — direct-manipulation requirements

**Status:** owner-requested future product specification, recorded 2026-11-27. **Implementation DEFERRED** until the MK2 creative toolkit UI milestone. This is a design contract, not a claim that an interactive UI exists.

**Why:** Living Forest v05, the accepted-enough Pit II fixed panorama, Portal v03 (preferred over experimental v04), and the source-backed Kombat Tomb v01 render demonstrate that individual visual objects do not all belong to one fixed image or movement model. The user must be able to **play with scene layout naturally and choose their own composition before exporting**, rather than rely on hardcoded artist placements, destructive background patches, or one presumed native camera state.

## Governing interaction model

**Select a stage → browse authentic extracted layers/objects → place and preview on canvas → schedule animation → choose framing/movement → export → save/reopen the editable scene.**

- **Canvas interaction first:** click any visible layer/object to select it, **drag** to reposition in X/Y, use handles/guides for precise alignment, and preview at 1× native pixels. Pan/zoom of the *editor viewport* must not accidentally move the *scene camera* or change export framing.
- **Inspector alongside canvas:** toggles for enable/disable; numeric X/Y with increment/decrement, sliders for continuous values (with companion editable numbers); dropdowns for modes and source sequences; timeline for event start, duration and order. Offer keyboard nudging, snap-to-pixel, reset-to-source/reference, undo/redo, and lock/solo/hide per layer.
- **Meaningful defaults, not mandatory complexity:** provide stage-specific ready-to-play presets. Advanced properties can be collapsed until needed. A user should be able to create a convincing still or loop without decoding game pointers, editing JSON or running PowerShell.
- **Non-destructive by construction:** preserve the original indexed pixels, source masks, dimensions and provenance. Save *composition settings* separately from source graphics. A visual reposition, masking/edit decision, backdrop extension, or new presentation alpha rule must never silently rewrite a verified source asset.

## Required editable controls

| Surface | Individual controls | Interaction |
| --- | --- | --- |
| Stage and output canvas | preset/native vs custom width/height; aspect ratio; preview zoom; origin; safe framing; crop vs full source bounds | preset + numbers + draggable frame |
| Camera and reference frame | 320×200 original-style viewport vs full-stage fixed panorama; explicit camera reference X/Y; camera enable, position, travel/easing, period | toggle + drag/numbers + motion sliders |
| Every layer | visible/hidden; lock/solo; source reference; XY; stack order; opacity; bounds; optional mask; independent placement origin | canvas drag + inspector + layer list reorder |
| Layer motion | fixed, drift, ping-pong, wrap; X/Y speed and direction; amplitude, phase, easing, axis; pause/reverse; independent of global camera | mode dropdown + sliders/numbers + preview |
| Repeating background textures | horizontal/vertical wrap on explicitly selected art; wrap seam preview; edge clamp/mirror/transparent choices; label synthetic extension | dropdown + seam check |
| Each animated object | enabled, source sequence and frame list, position, optional track path, depth/occlusion, scale only as a labelled creative transform | drag + dropdown + timeline |
| Animation timing | independent start, frame hold, playback speed, delay, once/repeat/ping-pong, stagger, cues, visibility windows, phase, optional deterministic random seed | timeline clips + exact time/frame numbers |
| Compositing/occlusion | source opacity mask, draw order, foreground cut-out, layer grouping, behind/in-front, anchor association | layer stack + visual overlays |
| Palette and presentation | selectable source-linked palette candidate where grounded; preview palette; original indexed preservation; pixel-locked nearest-neighbor vs optional subpixel filtering | palette/source selector + toggle |
| Export | still PNG, transparent layer/asset PNG where meaningful, numbered PNG sequence, MP4/GIF when supported; FPS; duration; loop length, output dimensions; named presets | export panel + saved settings |

**Precision:** positions should support integer pixel coordinates with optional explicitly enabled fractional X/Y. Sliders must not prevent exact typed values. Native nearest-neighbor previews must be available even when smooth fractional positioning is selected.

## Represent source, reference camera and creative scene separately

A source-local 320-pixel backdrop is not necessarily an 896-pixel static world plane. Likewise, source mosaic origins, sprite descriptor XY, camera scroll channels and the artist's panoramic placement are **different coordinate systems**. Keep these concepts separate in schema and UI.

- Show original asset extents and any unknown/uncovered stage regions. No automated stretching, duplicating a moon/portal/face, cropping away source content, or fabricated scenery without a visible creative label.
- Offer **native viewport/reference camera** and **creative full-stage panorama** as different composition/export modes. A panorama is a new authored scene, not automatically an authentic game framebuffer.
- Permit independent transformations for sky, moon, distant props, flying figures, monklike characters, foreground pillars, floor and effects. Avoid hiding a misplaced source object with destructive patchwork. When the source artwork is inseparable, disclose that limitation and offer a nondestructive alternate asset layer or mask.
- Preserve original masks plus *presentation-only* masks separately. Example: Portal lightning's original dark matte can be made transparent in an editable creative presentation setting without overwriting original indices.
- When a placement or animation is not native-verified, display **CREATIVE** or **INFERRED** provenance. Respect VERIFIED STATIC / VERIFIED RUNTIME / HYPOTHESIS / UNKNOWN / VALIDATION PENDING classifications.

## Concrete acceptance examples

1. **Living Forest:** switch from a 320×200 moving camera to full width with foreground and floor frozen; choose slow independent drift for layers 3–5; turn Jade/Smoke cameos on/off or move them; schedule the three tree-face roars at **3, 9 and 14.5 seconds** independently without modifying source art.
2. **The Pit II:** show the entire stage with **all non-cloud scenery fixed**; enable only verified source cloud imagery for slow seamless wrapping if present; independently toggle and time the source-backed distant fighters. No invented clouds just to satisfy a movement feature.
3. **Portal:** start from the **v03** clean composition, retain lightning presentation-alpha fix and monk arrangement; make the moon, monklike characters, backdrop and pillars separately movable *when separable from source assets*. Prevent a repeat of experimental v04's smudged sky/background cleanup. A stage need not have one uniquely “correct” full panorama across multiple parallax origins.
4. **Kombat Tomb:** load all six separately exported source setup canvases plus original 896×48 floor and two original eight-frame flying sequences. Toggle alternate architecture/ceiling/rails without rebuilding extraction; adjust source-animated object positions/cadences independently. Preserve an editable fixed full-width preset as one creative choice.

## Scene recipe is the single source of truth

The UI must *read and write a versioned scene-recipe format consumed by the same headless renderer*. It must not implement independent visual behavior that cannot be reproduced in batch exports. Define stable layer/track IDs, source asset IDs and checksums, source-space dimensions/masks, scene-space placements, visibility, z-order, motion/timeline settings, output settings, uncertainty labels and preset version.

- Save, duplicate, import/export and reopen a user's named scene preset. Maintain backwards-compatible migration of older Forest/Pit/Portal/Tomb recipes, rather than pretending their current shapes are identical.
- Undo/redo should preserve object identity and original assets; editing does not require writing to copyrighted game files.
- Preview and exported video should share frame sampling, order, alpha behavior, camera mapping and palette selection; export checks include frame count, dimensions, loop boundary and determinism where meaningful.
- Keep source-safe configuration and renderer code in GitHub. Keep original MK2 binaries, extracted original sprites/layers/audio and private rendered media under **F:\Dev\MKEXT\FIXTURES**; code and app under **F:\Dev\MKEXT\SOURCE**, external utilities under **F:\Dev\MKEXT\TOOLS**.

## Deferred UI acceptance gate

**Do not build the UI during the ongoing wallpaper/audio headless milestones.** At the scheduled consolidation/UI milestone, demonstrate that a user can:

1. Open a source-backed MK2 stage preset, **drag a monk or flying actor**, fine-tune X/Y numerically, reorder behind a pillar and immediately preview the result.
2. Toggle a static layer, change a background to fixed/drift/wrap, and stagger at least two independent animation cues on a visible timeline.
3. Switch between 320×200 reference framing and a native-width panorama without silently changing source pixels or cropping the original extracted package.
4. Save the edited preset, close and reopen it, export a looping video, and reproduce that video with the headless renderer using the same recipe.
5. Inspect original-vs-creative provenance and restore source defaults; no private commercial files enter a public repository.

This specification is informed by real creative iterations; it should guide future UI work, **not justify a new framework, renderer rewrite, or more P90/P91 investigation today**.

See [MK2 Creative Toolkit SOP](MK2_CREATIVE_TOOLKIT_SOP.md) and [chat-first workflow](CHAT_FIRST_CREATIVE_SCENES.md).