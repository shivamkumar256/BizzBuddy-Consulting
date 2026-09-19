# BizzBuddy Consulting asset handoff

The public portfolio currently uses clearly labelled internal placeholders. Only authorized BizzBuddy Consulting team members should replace each record's `thumbnail` and `mediaUrl` in `src/data/portfolio.ts` with approved assets.

Suggested folders:

- `public/assets/posts/` for square campaign stills
- `public/assets/reels/` for vertical video files or approved streaming URLs
- `public/assets/websites/` for desktop website screenshots

Use `status: 'draft'` while work is being prepared. The public portfolio receives only records with `status: 'published'`. A private admin dashboard can later manage login, uploads, editing, previews, publishing, and featured status without exposing upload controls to public users.
