# Natural BJJ

Competition tracker for the Natural BJJ team: athletes with belts, championships, every match with result, method, submission and points, plus podium finishes.

Live: https://turnyi.github.io/natural-bjj/

## How it works

- React app hosted on GitHub Pages, data in Supabase (free tier).
- Everyone can read without logging in. Updates appear live on every open device.
- Athletes register themselves from **Join** with a name, belt and personal PIN, then log their own matches, podiums and profile edits from their page ("This is me" on another device).
- The **Admin** tab is unlocked with the team admin PIN and can edit everything, including resetting an athlete's PIN.
- PINs are checked server-side and exchanged for a session token kept on the device, so people stay signed in. Direct database writes are rejected.

## Development

```sh
cp .env.example .env
pnpm install
pnpm dev
```

Fill `.env` with the Supabase project URL and publishable key. Pushes to `main` deploy via GitHub Actions, which reads the same two values from repository secrets.
