# STL Viewer, Measurement, Resize, and Export

## Summary
Add a new shortcut-menu tool called **STL Viewer**. It will load `.stl` files, display the model in a Three.js 3D viewer, show model dimensions, mesh volume, and mesh surface area, let the user resize the model in preview, and export a resized `.stl`.

## Key Changes
- Add a new **STL Viewer** shortcut beside Resume Print and SIMP3D Resume Print.
- Use **Three.js CDN** for 3D rendering, STL loading, orbit controls, and STL export.
- Treat imported STL coordinates as **millimeters by default**.
- Show measurements in selectable units: `mm`, `cm`, `inch`, `meter`.
- Display X/Y/Z dimensions, estimated mesh volume, estimated surface area, current scale, and resized output dimensions.
- Add resize controls:
  - uniform scale percentage
  - target X/Y/Z size fields
  - lock-proportion toggle
  - free X/Y/Z scaling mode
  - reset scale button
  - export resized STL button

## Implementation Details
- Keep the existing G-code tools intact.
- Add an STL-only view that hides the G-code textareas and G-code run/copy/download controls.
- Add a 3D canvas area with orbit controls, grid, lighting, and auto-fit camera.
- Add STL parsing from file input using `ArrayBuffer`.
- Compute bounding-box dimensions from the loaded geometry.
- Compute mesh volume from triangle geometry using signed tetrahedron volume, then display absolute volume.
- Compute mesh surface area by summing the area of every STL triangle.
- Apply resize as mesh scale in preview.
- Recalculate displayed measurements after resize.
- For uniform scaling, volume scales by `scale^3` and surface area scales by `scale^2`.
- For free X/Y/Z scaling, recompute transformed triangle volume and surface area for accuracy.
- Export resized STL using the current transformed mesh.
- Download filename format:
  `original.resized.X-20.00_Y-30.00_Z-10.00.stl`

## Unit Display
- Dimensions:
  - `mm`
  - `cm`
  - `inch`
  - `meter`
- Volume:
  - `mm^3`
  - `cm^3`
  - `in^3`
  - `m^3`
- Surface area:
  - `mm^2`
  - `cm^2`
  - `in^2`
  - `m^2`

## Test Plan
- Load binary STL and verify it renders.
- Load ASCII STL and verify it renders.
- Use Sample to load a generated test cube.
- Confirm dimensions display correctly in `mm`, `cm`, `inch`, and `meter`.
- Confirm volume conversion changes with selected unit.
- Confirm surface-area conversion changes with selected unit.
- Load a known cube STL and verify:
  - dimensions are correct
  - volume is `X * Y * Z`
  - surface area is `2 * (XY + XZ + YZ)`
- Test uniform scale and confirm:
  - dimensions scale by `scale`
  - volume scales by `scale^3`
  - surface area scales by `scale^2`
- Test free X/Y/Z scaling and confirm surface area is recalculated from transformed triangles.
- Export resized STL, reload it, and confirm new dimensions match.
- Confirm Resume Print and SIMP3D tools still work after switching tools.
- Verify browser UI at `http://127.0.0.1:4173/`.

## Assumptions
- STL source unit is assumed to be **mm**.
- Three.js will be loaded from CDN for v1.
- Resize export is required in v1, not only preview.
- The first version does not need slicing, repair, supports, or G-code generation.
