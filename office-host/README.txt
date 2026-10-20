WEESENG PRODUCTION TOOLS - WINDOWS 11 OFFICE HOST (64-BIT)

HOST PC: 192.168.0.234
STAFF LINK: http://192.168.0.234:4174/

FIRST INSTALL
1. Copy this ZIP to the office PC and extract ALL files into a normal folder.
2. Ask staff to save any open work. Double-click SETUP_OFFICE.bat.
3. Accept the Windows administrator prompt. Setup verifies the release, installs
   it in C:\WeesengProductionTools, enables office-subnet access and registers
   automatic startup. It refuses to enable access on a different PC/address.
4. Wait for the browser to open. Test the tools locally and from a staff PC.
5. Reserve 192.168.0.234 for this PC in your router and keep the PC awake during
   working hours. Setup does not change router, power or internet settings.

No separate Node.js or Python installation is needed. Runtimes are bundled.
Office access is restricted to 192.168.0.0/24. No internet port forwarding is needed.
Do not use this package as a public internet website.

SETTINGS
Your private host settings are in:
  C:\WeesengProductionTools\settings\signage-config.json
The first installation uses blank API/Google Sheet credentials. To keep your
quotation connection, copy your current signage-config.json into that location
on the host PC using an administrator account, then restart the office task.
Do not put private credentials in a staff-accessible release/share folder.
Updates preserve existing settings, pricing cache and tube settings.
Saved DXF/project files are not migrated automatically. Staff save/open files
using their own browser; this release does not add shared project storage.

UPDATES FROM THE DEVELOPMENT PC
1. Build a new release with: npm run package:office-host
2. Copy the new ZIP from dist to the office PC (a shared folder is fine).
3. Extract it. Ask staff to save work and double-click UPDATE_OFFICE.bat there.
4. It verifies/copies files before stopping the old version, preserves settings,
   restarts and checks both web and geometry services. Staff then refresh.
5. If startup fails, the previous release is restored automatically. To restore
   it manually, use ROLLBACK_OFFICE.bat. Keep at least the two newest packages.
Updates are deliberate, not unattended pushes. Open browser work must be saved
before refreshing; there is no unsaved-session migration between releases.

OPTIONAL TOOLS
Tube & Frame 3D generation requires FreeCAD installed on the HOST PC. Its status
screen shows whether FreeCAD is available. Configure its path from the host PC.
Cowart/AI canvas is a separate local service/plugin, not bundled by this package;
its existing localhost launcher is not an office-hosted canvas for staff.
Quotation AI/Google Sheet features require host credentials and internet access.

TROUBLESHOOTING
DIRECT UPDATES FROM THE DEVELOPMENT PC
This package also installs an authenticated update receiver on port 4175.
After setup, copy the private file:
  C:\WeesengProductionTools\updater\publisher-pairing.json
back to the development PC (administrator access required).
Open http://127.0.0.1:4174/office-updates.html on the development PC and select
that file under Pair once. Build, then Send update after staff save their work.
Staff keep using http://192.168.0.234:4174/ and refresh after update success.
Do not share the pairing file with staff or put it in a public/shared folder.

TROUBLESHOOTING
Logs: C:\WeesengProductionTools\logs
Startup task: Weeseng Production Tools Office (Windows Task Scheduler)
The bundled runtimes and scripts were tested on the development PC. Network
connectivity, the Windows startup task and firewall must be checked on the actual
office PC. If staff cannot connect, verify the host IP and matching office subnet.

This package contains current application code and third-party runtimes. It does
not include production drawings, archives, Git history, saved projects or API keys.
