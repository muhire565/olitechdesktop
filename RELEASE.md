# OLITECHHUB Desktop — Release & Auto-Update

## Build the installer

```bash
cd olitechdesktop
npm install
npm run dist
```

Output appears in `release/`:

- `OLITECHHUB-Setup-1.0.0.exe` — Windows installer (shows EULA, choose folder, shortcuts)
- `latest.yml` — update manifest used by electron-updater
- `*.exe.blockmap` — enables differential (smaller) feature updates

## Ship a feature update

1. Bump `version` in `package.json` (e.g. `1.0.0` → `1.1.0`).
2. Run `npm run dist`.
3. Upload these files to your updates host (same folder):
   - `OLITECHHUB-Setup-<version>.exe`
   - `OLITECHHUB-Setup-<version>.exe.blockmap`
   - `latest.yml`
4. Installed apps check `https://releases.olitechhub.com/desktop/latest.yml` on launch (and every 4 hours), download in the background, then show **Restart & update**.

Change the publish URL in `electron-builder.yml` if your host differs.

## Notes

- Auto-update only works on **installed** builds, not `npm run dev`.
- Code signing (optional later) reduces Windows SmartScreen warnings.
- Keep the API backward-compatible for at least one prior desktop version.
