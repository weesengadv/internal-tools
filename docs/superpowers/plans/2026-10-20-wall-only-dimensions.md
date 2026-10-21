# Wall-only letters and dimensions implementation plan

Approved by the user: fourth body mode, outer and counter walls without a base; base/screw/wire controls disabled. Width × height on every letter; mm/inch/hidden display, default mm. Units do not resize geometry.

Architecture: add `wall-only` to shared geometry validation and model heights, extrude wall rings directly from Z=0. Preserve stored hole layouts but ignore them in wall-only previews, validation and exports. Add a pure dimension formatting helper and SVG annotations, with view-only preference independent of project dirty state.

- [x] Add failing tests for open-bottom, positive-volume watertight wall meshes; ignored holes; height modes; DXF/STL manifest; switching back restores holes.
- [x] Implement backend mode and export behavior.
- [x] Add dimensions helpers/tests and every-letter SVG labels with mm/inch/hidden selector. Update body mode UI, fitting explanation and EN/CN text.
- [x] Run backend/frontend/component tests, build and inspect local preview. No office deployment automatically follows this feature change.

Verification: backend 56 tests; frontend 22 tests; React component interactions cover four body modes, disabled no-base controls, hole restoration and all dimension toggles. Production build passes. Live local API and browser generated a watertight wall-only model from Z=0 to 30 mm. Office deployment is unchanged.
