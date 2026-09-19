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
