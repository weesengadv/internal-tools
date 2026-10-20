# Weeseng Production Tool v1.0

Portable Windows handoff package for the Weeseng production tools.

## Start on the next PC

1. Install Node.js LTS from https://nodejs.org/ if it is not already installed.
2. Unzip this package to a normal folder, for example `C:\Weeseng Production Tool`.
3. Double-click `START_WEESENG_TOOLS.bat`.
4. The app opens at `http://localhost:4173/`.

## Private configuration

This office package includes `signage-config.json` so AI signage recognition can work on the next PC using the configured OpenAI API account.

Keep the zip private. Anyone with the package can read the API key and use the configured API billing account.

If the API key is rotated later:

1. Open `signage-config.json`.
2. Replace `apiKey`.
3. Save the file.
4. Restart the tool.

## Included tools

- Resume Print G-code editor
- SIMP3D resume tools
- STL size/area checker
- Signage quotation workflow

## Version

Version: 1.0
