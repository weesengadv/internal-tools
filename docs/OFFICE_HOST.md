# Office host package — Windows 11 x64

Target: a separate PC at **192.168.0.234**. Staff URL after installation: **http://192.168.0.234:4174/**. This development computer remains local-only.

## Installation

Copy the generated `Weeseng-Office-*.zip` to the target PC, extract everything, and run `SETUP_OFFICE.bat`. Accept the administrator prompt. Setup checks the target address and file hashes, installs into `C:\WeesengProductionTools`, registers a Windows startup task, creates an inbound rule restricted to `192.168.0.0/24`, and checks web/geometry startup. A different host address causes refusal before network changes.

Node and Python runtimes are bundled. No internet download or separate runtime installer is needed for the core tools. Keep the host awake and reserve its address in the router. Setup does not change sleep settings, router configuration or port forwarding.

The first release has blank API/Google Sheet credentials. Copy existing private quotation settings separately to `C:\WeesengProductionTools\settings\signage-config.json` on the host using an administrator account. Do not put that file in a staff-accessible update share. Later updates preserve the settings folder and cache. Existing saved projects/drawings are not migrated automatically.

FreeCAD is an optional separate installation on the host for Tube & Frame generation. Cowart remains a separate local service/plugin and is not turned into an office-hosted canvas by this package.

## Updates

Run `npm run package:office-host` on the development PC. This rebuilds the workbench and produces a new ZIP and SHA-256 file in `dist`. Copy/extract the ZIP on the host and run `UPDATE_OFFICE.bat` after staff save their work. Updates verify and copy a versioned release before stopping the current one. Settings stay outside releases. The prior pointer, controller and task are restored on activation failure; the existing office firewall rule is retained. `ROLLBACK_OFFICE.bat` switches back manually.

Staff refresh browsers after a successful update. This is a controlled manual deployment, not unattended automatic pushing. A NAS share can transport the ZIP; no write to a NAS has been performed.

## Validation on the development PC

The relocated package's own Node/Python runtimes passed a loopback-only smoke test: protected-file checks, relative workbench assets, multipart import of the production DXF (85 parts), two independent project requests, watertight 3D generation and binary STL ZIP export. Root regression tests, office access/proxy tests, word-tools service/panel tests, Tube API/FreeCAD tests, 53 geometry tests, 20 frontend tests and React interaction checks passed.

Installer transaction tests replace all task/firewall/network/process commands with in-process fakes. They verify task-registration failure restores the previous release/controller and preserves settings/firewall, first-install failure can be retried, and normal update/manual rollback work. Those simulations do not install a real Windows task or firewall rule here.

Actual target installation, startup after reboot and access from a second office PC still require validation on **192.168.0.234**.
