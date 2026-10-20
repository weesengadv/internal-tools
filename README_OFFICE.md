# Weeseng Production Tool v1.1.0

Portable Windows x64 office application. Node.js is not required.

## Start

1. Extract the complete zip to a writable folder, such as `C:\Weeseng Production Tool`.
2. Keep all files together.
3. Double-click `Weeseng Production Tool.exe`.
4. Open **Signage Quotation**, then use **Sync latest Google Sheet** before preparing a quote.

The app loads the last successful pricing cache first and then checks Google automatically. The sync status shows the Google Sheet owner and the time of the prices currently in use.

## Configuration

Edit `signage-config.json` in the same folder as the EXE, then restart the app. The main editable settings are:

- `googleSheetOwnerEmail`: keep as `weesengadv@gmail.com`.
- `googleSheetId` and `googleSheetTabs`: spreadsheet and worksheet identifiers.
- `googleSheetSyncOnStartup`: automatically refresh cached pricing when the app opens.
- `apiKey`, `baseUrl`, and `model`: AI recognition configuration.
- `currency`, `defaultUnit`, and `pricingUnit`: quotation defaults.
- `serverHost` and `serverPort`: local server settings.

The configured Google Sheet must permit public CSV export. The Gmail account remains the Sheet owner; office users do not sign in through this app.

## Privacy

`signage-config.json` contains a private OpenAI API key. Keep this folder and zip private. Do not email or upload them to a public drive.

## Mobile Access

The secure default is `"serverHost": "127.0.0.1"`, which allows only this PC to connect. To permit phones on the same network:

1. Change `serverHost` to `0.0.0.0` and restart the app.
2. Allow the application through Windows Firewall on private networks only.
3. Open `http://<office-PC-IP>:4173/` on the phone.

Anyone on that network may be able to reach the app while LAN access is enabled, so return the setting to `127.0.0.1` when mobile access is not needed.

## Data and Logs

- `data/pricing-cache.json`: last fully successful Google Sheet download.
- `logs/app.log`: desktop startup information and startup errors.

If Google cannot be reached, the app keeps the last successful cache and shows its timestamp. It does not silently replace office prices with sample rates.
