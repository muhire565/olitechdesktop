OLITECHHUB — Branding assets
============================

Paste your images here using these exact filenames:

1) login-hero.png   (login page left panel background)
   - Best format: PNG (full color, sharp at large sizes)
   - Recommended size: 1200 x 1600 px or larger (portrait)
   - Also accepted: login-hero.jpg / login-hero.webp (same base name)

2) logo.png         (optional — replaces the cart icon on login)
   - Square logo, min 256 x 256 px
   - Transparent PNG works best

3) app-icon.png     (optional — copy to project root as icon.png for the installer)
   - 512 x 512 px PNG for Windows app/taskbar icon
   - electron-builder converts it automatically

PNG vs ICO — which to use?
--------------------------
- Login hero / large visuals  →  PNG  (use this for the left panel)
- Windows app icon only       →  ICO or 512x512 PNG at project root

ICO files are tiny multi-size icons for the taskbar and desktop shortcut.
They are NOT suitable for the login background — use PNG there.

After adding login-hero.png, rebuild or refresh dev server to see changes.
