# AI Signage Quotation System

## Summary
Revise the signage quotation feature so **AI recognition is mandatory in v1**. The user first provides a real-world backing or guideline size, then AI detects emboss words and each alphabet dimension, the app calculates pricing from Google Sheet data, and the user corrects only uncertain or wrong detections before printing or exporting the quotation as an image.

## Key Changes
- Add **Quotation > Signage Quotation** to Weeseng Advertising.
- Required workflow:
  1. User uploads photo and marks backing/guideline size.
  2. AI recognizes emboss words, word groups, each alphabet box, and dimensions.
  3. User selects emboss material/model and lighting type: front lit, back lit, no lit.
  4. App fetches Google Sheet pricing and calculates quote deterministically.
  5. AI creates a quotation draft and notes uncertain detections.
  6. User edits boxes/dimensions or prompts corrections, then repeats until correct.
- Manual rectangle/pen marking remains as fallback when AI cannot recognize an item.

## Implementation Changes
- Add local server config file support:
  - `signage-config.example.json` committed.
  - `signage-config.json` local/private, ignored by git.
  - Config fields: OpenAI-compatible `baseUrl`, `model`, API key source, Google Sheet CSV URL, default unit `inch`, pricing unit `sqft`, optional recognition prompt/library notes.
- Extend `server.js` from static-only server to include:
  - `GET /api/signage/pricing` to fetch/parse published Google Sheet CSV.
  - `POST /api/signage/recognize` to send photo + calibration/backing/guideline data to the configured AI model.
  - `POST /api/signage/draft` to generate a customer-facing quote draft from calculated line items.
- AI recognition response must include:
  - backing box/guideline reference
  - grouped words
  - per-alphabet boxes, text, width, height, confidence
  - items needing user review
- App calculation remains deterministic:
  - backing area in sqft
  - emboss letter/word pricing from Google Sheet rates
  - LED added for front lit/back lit
  - PSU quantity auto-calculated from sheet watt rules
  - no lit excludes LED and PSU
- Quote output includes editable line items, print/PDF view, and PNG image export.

## UI Flow
- Step panel:
  - Upload photo
  - Mark backing/guideline size
  - Run AI recognition
  - Review alphabet detections
  - Select material/model/lighting
  - Generate quote
  - Print or save as image
- Canvas tools:
  - calibration/guideline
  - backing box
  - detected alphabet boxes
  - detected word group boxes
  - rectangle fallback
  - pen/polygon fallback
- Correction tools:
  - edit detected dimension
  - redraw box
  - add missing alphabet/shape
  - prompt AI correction, for example: `Letter W height is 18 inch`

## Test Plan
- Load config and confirm model/API/sheet URL are read server-side.
- Upload photo, mark known backing/guideline, and verify inch scale.
- Run AI recognition and verify grouped words plus per-alphabet boxes render.
- Edit one detected alphabet dimension and confirm quote recalculates.
- Add missing manual rectangle/polygon and include it in quote.
- Test front lit/back lit: LED and PSU lines are added.
- Test no lit: LED and PSU lines are not added.
- Test Google Sheet pricing updates line item totals.
- Test AI draft generation from calculated quote.
- Export print/PDF and PNG image quote.
- Confirm existing G-code Editor and 3D Viewer tools still work.

## Assumptions
- AI provider is **OpenAI-compatible API**.
- API key stays server-side in local config or environment variable.
- Google Sheet is published as CSV.
- User measures in **inch**, pricing area is **sqft**.
- App calculates prices; AI recognizes and drafts wording, but does not become the only source of pricing truth.
- Current uncommitted branding/menu changes and exported signage plan/UI files should be preserved or updated during implementation.
