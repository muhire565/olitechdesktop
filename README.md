# OlitechHub Desktop

Electron desktop application for **Mama Prince Supermarket** / **OlitechHub**. Mirrors the web app's authentication API and provides a polished staff login experience.

## Prerequisites

- Node.js 18+
- Backend API running (default: `http://localhost:5000`)

## Setup

```bash
cd olitechdesktop
npm install
cp .env.example .env
```

Edit `.env` if your API runs on a different host:

```
VITE_API_BASE_URL=http://localhost:5000
```

> **Note:** If Electron fails to launch after install, approve its postinstall script:
> `npm approve-scripts electron` then re-run `npm install`.

## Development

Start the Electron app in dev mode (hot reload for renderer):

```bash
npm run dev
```

## Production build

```bash
npm run build
npm start
```

`npm start` launches the built app via `electron-vite preview`.

## Project structure

```
olitechdesktop/
├── electron/
│   ├── main/index.js       # Main process (window, security)
│   └── preload/index.js    # Preload script (contextBridge)
├── src/
│   ├── index.html          # Renderer HTML entry
│   ├── api/                # Axios + auth API (mirrors web)
│   ├── store/authStore.js  # Zustand persist (same key as web)
│   ├── components/auth/    # PinKeypad
│   ├── pages/              # SignIn, Dashboard
│   ├── App.jsx             # HashRouter + route guards
│   └── main.jsx            # React entry
├── out/                    # Build output (after npm run build)
├── electron.vite.config.mjs
├── .env.example
└── package.json
```

## API endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Username/password login (`{ email, password }`) |
| `POST` | `/api/auth/login-pin` | PIN login (`{ pin }`) |
| `POST` | `/api/auth/logout` | Sign out (Bearer token) |
| `POST` | `/api/auth/refresh` | Token refresh on 401 |

Auth tokens are stored via Zustand persist in `localStorage` under key `supermarket-auth` (same as web).

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- Preload script exposes only `platform` via `contextBridge`

## Login features

- **PIN mode** (default): numeric keypad, masked dots, clear/backspace, auto-submit at 6 digits
- **Password mode**: username + password with show/hide toggle, remember me checkbox
- Green OlitechHub brand styling, smooth tab animations
- Toast errors for failed auth (401, 429, etc.)
- Post-login placeholder dashboard with user name, role, and logout
