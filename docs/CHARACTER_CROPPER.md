# Character Cropper

Open the current source application with `npm start` (browser) or `npm run desktop` (desktop). Choose **3D Sculpting → Character Cropper**.

1. Upload or drop one PNG, JPG or WebP character sheet.
2. Use **Auto detect views** to find separated views on a plain background, or choose a starting layout. **Reference sheet · top row** matches the supplied sheep example; **Four across** and **2 × 2 grid** divide the full image. **Custom grid** supports 1–24 rows and columns.
3. Click **Add box** for each extra angle, then move or resize the new box. There is no four-view limit. **Remove selected** removes a crop; **Undo layout** restores the last add, remove, automatic detection or preset change.
4. Select a view. Move its box, resize it using the edge/corner handles, or enter exact left, top, width and height in source pixels. Arrow keys move a focused crop one pixel; Shift moves ten pixels.
5. Rename views and enter a character name for the file prefix. Automatic detection uses neutral names such as View 1; it does not infer which direction the character faces.
6. Download a single image or export every current crop in one ZIP. PNG keeps transparency; JPG uses a white background. Exports retain the crop's original pixel dimensions.

Presets and automatic detection produce editable starting boxes. Detection uses background gaps rather than semantic image recognition; it may include detail views and can merge overlapping characters. Check results before export. If detection finds no views, existing boxes remain. Images are processed locally and kept in memory for the current session; reloading requires uploading again. Existing packaged executables need rebuilding to include source changes.

Verification:

```text
npm test
node_modules/electron/dist/electron.exe tests/character-cropper-ui.cjs
```

The Electron UI check runs invisibly and writes verification downloads/screenshots to `output/character-cropper-check`. An optional image path after the test script exercises a real reference sheet.
