# Tube & Frame

The source application at http://127.0.0.1:4174/ includes **Production Tools → Tube & Frame**. This module follows the existing theme and EN/CN controls. No separate transfer into another Codex project is needed. Previously built desktop executables are not rebuilt by editing these sources.

## Use

1. Open Project to name/save/open a local `.tframe` project and detect FreeCAD. A new project is called **Untitled project**.
2. Design a single square, rectangular or round tube, or add a flat rectangular frame. Frame dimensions default to outside. Selecting a different reference converts the displayed measurement without resizing the physical frame.
3. Select an individual frame member to edit its openings. Choose A/B/C/D (round tube: circumferential angle), single-wall or through opposite walls, opening shape and placement mode. Single/Custom holes can be dragged; Magnet enables alignment/grid snapping. Numeric positions and edge readouts are available. Positions belong to the selected member's coordinate system, not the camera.
4. Frame corners support mitre/butt defaults and individual corner overrides. Internal supports can be vertical, horizontal, diagonal or an X brace. Supports can use smaller sections. Butt crossings use a continuous horizontal member and split vertical members. A pass-through support makes explicit receiving openings; finished sizes must fit the receiving wall and passing tube. Diagonal/X presets currently stand alone. Complex joint arrangements are reserved for the later Custom Assembly phase.
5. Generate geometry with locally installed FreeCAD. The optional 3D preview uses a mesh from the generated solids. Geometry changes require regeneration before producing a package.
6. Production → Prepare for TubesT downloads a ZIP of individual IGS parts, quantities in `part-list.csv`, the editable project and handoff notes. Import the IGS files into TubesT, check the recognized sections and quantities, nest there and use TubesT's **Save** for `.yxy`. This module does not write `.yxy` or machine programs.

## FreeCAD

### Selecting the correct wall

Hole controls include a rotatable 3D orientation guide before FreeCAD generation. Click a wall or use the named A/B/C/D buttons. The entry wall is mint; through mode also highlights the opposite exit wall in amber. Perimeter members use Front / Back / Inside / Outside names. Member guide shows a compact section for clarity; Frame guide shows the selected member in assembly context. Round members use a circumferential angle and a coloured radial strip, selectable by clicking the round wall. These are dimension-based orientation aids; generated 3D remains the exact geometry preview for holes and end cuts.

FreeCAD is an external prerequisite. Auto-detection searches standard installed FreeCAD folders. A custom installation can be entered as its folder or bundled `bin/python.exe`. The selection is validated by a real FreeCAD import before being saved in `data/tube-frame-settings.json`. Initial geometry checks use FreeCAD 1.1 on this PC. No customer project name is hard-coded in the module.

## Fold frames

The 2D tube/member-wall view updates angled end boundaries as dimensions change. Nonzero end cuts show enlarged Start/End profiles with signed degree labels measured from square. A side wall can have a straight projected end even when the tube is mitred; the accompanying profile detail explains the cut. Frame assembly outlines also display mitred perimeter corners. Drawing tests cover 45/60-degree ends, reversed angles and side-wall projections.

The V-notch/fold perimeter option produces one straight trial tube with three 90-degree fold reliefs and a retained wall. Stock corner radius, bend radius and K factor are separate settings. Its assembled rectangle is a target illustration, not a bend simulation. Verify a physical test fold before relying on finished dimensions. Internal supports are not included in this trial fold preset.

## Deferred

Custom Assembly (free planar tube placement and Convert Frame to Custom) is the next phase. Box frames follow later. Costs, stock optimisation and other suggested optional features remain on hold. Final nesting remains in TubesT.

## Verification

On 18 October 2026, a ZIP downloaded from the live browser tool was extracted and its five IGS parts were batch-imported into the installed TubesT 1.23.4. TubesT recognized 38.1 x 38.1 square tube, outside R1.2 and 1.20 mm wall. All five parts completed an offline nesting run on one 6000 mm stock length with 300 mm end allowance, 5 mm part spacing and 5 mm margin. The native project was saved using TubesT Save as `output/tube-frame-review/TubesT_compatibility_nest.yxy` (21233 bytes). The result is compatibility evidence, not a released machine cutting program. No TubesT Export was used.

Browser checks covered frame creation, reference conversion (600 outside to 523.8 inside), frame-member holes, independent groups on A and B, Custom placement, actual IGS ZIP download, project save/reopen, Chinese labels and theme changes without losing geometry. A generated 600 mm frame with an internal upright was inspected in the live 3D viewer. Targeted automated checks: 19 passed, including real FreeCAD solids; existing main and word-tools suites also passed. Evidence is in `output/tube-frame-review`.

Run `node --test tests/tube-frame-model.test.mjs tests/tube-frame-service.test.cjs tests/tube-frame-api.test.cjs` for the resolver, real FreeCAD geometry and local API checks. Real-geometry tests require installed FreeCAD. Run `npm test` for the existing application checks. The current source changes do not imply a rebuilt portable executable or a verified machine cutting program.
