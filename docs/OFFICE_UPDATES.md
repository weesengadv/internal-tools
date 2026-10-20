# Send updates to the office PC

The office host is Windows 11 at 192.168.0.234. Staff open http://192.168.0.234:4174/. Their computers do not need individual updates.

## One-time setup

1. On the development PC, keep Production Tools running and open http://127.0.0.1:4174/office-updates.html (or OPEN_OFFICE_UPDATER.bat).
2. Click **Build update**. The resulting ZIP is in `dist`. Extract it on the office host and run **SETUP_OFFICE.bat** as administrator. This installs the application and a separate receiver which starts with Windows.
3. On the office host, copy `C:\WeesengProductionTools\updater\publisher-pairing.json` back to the development PC. Administrator access is needed to read it. Select it in **Pair once**.
4. Click **Check office PC**. The receiver should report online.

Do not share the pairing file with staff or put it in a shared folder. Keep a private backup of this workspace's `.office-publisher` directory: it contains the publisher key and pairing. Losing it requires pairing/setup again; a new publisher key cannot update the existing receiver.

## Every update

1. Make changes and test locally.
2. Open the updater page and click **Build update**.
3. Ask staff to save their work. Check the confirmation box, then **Send update to office PC**.
4. Wait for success. Staff refresh the same office URL to load the latest version.

Build and send are separate actions. Saving source files does not deploy automatically. The office PC must be powered on and connected to the office network. Publishing uses HTTPS port 4175 with certificate pinning, a private pairing token and signed package metadata. Only the office subnet can reach that receiver. The staff web server has no publishing controls.

Uploaded archives contain a manifest and hashes. The receiver verifies the signed ZIP, extracts only application payload, and invokes a fixed installed updater. Uploaded PowerShell installer files are never executed. Settings remain outside releases. The existing installer checks web/geometry health and restores the prior release if activation fails. A failure message requires checking setup logs before retrying; it does not guarantee rollback completed.

Receiver/bootstrap changes require running a newer SETUP_OFFICE.bat manually on the office host. Ordinary application fixes can be sent from the publishing page. First installation, real office connection, firewall behavior and end-to-end deployment must be checked on the actual office PC; local tests cannot verify those.
