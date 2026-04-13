# ritvikjs (static + Node API)

This repo serves a static site (HTML/CSS/JS) and an Express API from **one server**.

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/`.

## Run on a live server (production)

Most hosts (Render/Railway/Fly/Heroku-style) do:

- Build command: `npm install`
- Start command: `npm start`

### Required environment variables

- **PORT**: provided by the host (don’t hardcode)
- **JWT_SECRET**: set a strong secret in production

### Optional environment variables

- **NODE_ENV**: set to `production`
- **CORS_ORIGIN**: comma-separated allowlist of origins (example: `https://yourdomain.com,https://www.yourdomain.com`)
  - If unset, CORS is enabled only in development.

