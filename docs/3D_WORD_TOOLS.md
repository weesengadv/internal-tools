# 3D word tools

The Production Tools sidebar contains **3D word tools** between **Quotation** and **3D Sculpting**. Select it to open the existing LetterForm workbench inside the application. Import DXF, generate body/holes/acrylic outlines, preview 3D, save/open projects and export DXF/STL using the workbench controls. Switching tools retains the open workbench and its edits until Production Tools closes.

The working application lives in `tools/word-tools`. The original transfer folder and v0.1.0 archives remain unchanged. The working copy includes the pending explicit DXF closing-vertex compatibility fix; the target cutting software still needs to verify compatibility. The three proposed layout alternatives have not been implemented.

The Node server starts a local Python geometry service on demand using a free loopback port. It reuses that service and stops it on normal server/desktop shutdown. The workbench keeps its own local HTTP origin so its existing API calls and downloads work unchanged.

Reconnect checks the service again and keeps a healthy workbench intact. If the service has exited, it starts a replacement and reopens the workbench. Save an editable project before reconnecting after a failure if you need to retain unsaved work.

Development setup: create `tools/word-tools/.venv`, install `tools/word-tools/backend/requirements.txt` in that environment, and start Production Tools normally. This machine has that environment installed. Python 3.11 or later is required. The launch order is `WEESENG_WORD_TOOLS_PYTHON`, the application `.venv`, `word-tools-env` beside the external configuration, then Python on PATH. Missing dependencies appear in the panel with a Retry button.

Desktop builds copy the Python application and compiled frontend outside the Electron archive. They still require an installed Python environment with the listed dependencies; this change does not bundle a portable Python runtime. A previously built EXE must be rebuilt to include the new sidebar and service manager.

Checks: `npm run test:word-tools`, `npm test`, and the Python backend suite in `tools/word-tools/backend/tests`. The LetterForm frontend can be rebuilt with `npm ci --prefix tools/word-tools` followed by `npm run build --prefix tools/word-tools`.

Startup diagnostics: the panel handles a plain-text 404 from an older server with an update instruction rather than displaying a JSON parser error. Other non-JSON responses include their HTTP status. The startup HTTP route is covered by success/error regression tests. Eight integration tests and the existing Production Tools suite passed.

Resolved on 2026-10-17: the user's actual Chrome tab was at `http://127.0.0.1:55530/`, separate from the Codex preview at 4174 and old desktop server at 4173. Its Node process had loaded `server.js` before the integration was added: static frontend updates appeared immediately, but the startup route remained absent from the running backend. Restarted that specific Node server with the current code on the same port. Verified HTTP 200 JSON, embedded workbench loading, and a successful Generate 2D action in the original Chrome tab. The server is running hidden with logs in `output/word-tools-server.log` and `output/word-tools-server.err.log`. Screenshot: `output/3d-word-tools-chrome-fixed.png`.
