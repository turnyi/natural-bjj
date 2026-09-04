# Natural BJJ

Competition tracker for the Natural BJJ team: athletes with belts, championships, every match with result, method, submission and points, plus podium finishes.

Live: https://turnyi.github.io/natural-bjj/

## How it works

- React app hosted on GitHub Pages, data in Supabase (free tier).
- Everyone can read without logging in. Updates appear live on every open device.
- The **Admin** tab is unlocked with a shared team PIN, checked server-side. Only the PIN can write; the database rejects direct writes.
- The PIN can be changed from Admin → PIN.

## Development

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Fill `.env` with the Supabase project URL and publishable key. Pushes to `main` deploy via GitHub Actions, which reads the same two values from repository secrets.
