# BizzBuddy Consulting portfolio

Official BizzBuddy Consulting portfolio and private local admin system.

## Setup

1. Copy `.env.example` to `.env`.
2. Set a strong `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and long random `SESSION_SECRET`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the public site at `http://localhost:5173` or the private admin at `http://localhost:5173/admin/login`.

The Vite process serves the React site and proxies `/api` to the Express server on port 8787. The database is created at `data/portfolio.db`. Uploaded media is stored in `private/storage/uploads` and is only returned through authenticated upload responses; it is not publicly served.

Place the official approved logo at `public/assets/branding/bizzbuddy-logo.png`. Do not recreate or substitute the logo. The interface displays a tasteful text fallback while that file is absent.

The admin uses a local SQLite database, bcrypt password hashing, and a signed httpOnly session cookie. The initial admin account is bootstrapped from environment variables; the server refuses to start when required values are missing. This local setup is not a complete production deployment: use HTTPS, secure cookie settings, a reverse proxy, backups, rotation, and a production-grade session store before launch.

There is no public upload UI. Only authenticated admin users can upload validated images and videos.

## Deploying to Railway

This project deploys to Railway as a single service that builds the React app and serves it
together with the API from one Express process (`npm run build` then `npm start`). The
`railway.json` in this repository already sets the build command, start command, and the
`/api/health` health check.

Because the app uses a local **SQLite** database and stores uploaded media on disk, you **must
attach a persistent Railway volume**, or the database and uploads are wiped on every redeploy.

1. Create the service from this GitHub repository in the new Railway account.
2. Add **one** volume and mount it at `/data`.
3. Set these service Variables (secrets marked *secret*):
   - `ADMIN_EMAIL` — admin sign-in email (*secret*; you supply it)
   - `ADMIN_PASSWORD` — admin password, at least 10 characters (*secret*; you supply it)
   - `SESSION_SECRET` — long random string used to sign session cookies (*secret*; you supply it)
   - `NODE_ENV=production` — enables `SameSite=None; Secure` cookies over HTTPS
   - `FRONTEND_URL` — the exact public origin(s) allowed by CORS (comma-separated if more
     than one), e.g. `https://bizzbuddy.consulting` and/or the Netlify preview domain
   - `DATA_DIR=/data` — SQLite database path (persisted on the volume)
   - `UPLOAD_DIR=/data/uploads` — uploaded media path (persisted on the volume)
   - `VITE_API_BASE_URL=` — leave **empty** so the built frontend calls the API same-origin
4. Generate a public domain for the service and copy the URL.
5. Point the main website's `VITE_API_BASE_URL` at that URL and set the API's `FRONTEND_URL`
   to the website's origin so cross-origin cookie logins are allowed.

Do not commit `.env`; it is git-ignored. Never place secrets in `VITE_*` variables.
