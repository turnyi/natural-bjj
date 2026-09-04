# Natural BJJ

Competition tracker for the Natural BJJ team: athletes with belts, championships, every match with result, method, submission and points, plus podium finishes.

Live: https://402martin.github.io/natural-bjj/

## How it works

- Static React app hosted on GitHub Pages.
- All data lives in [`data/db.json`](data/db.json) in this repo. Everyone can read it, no login needed.
- The **Admin** tab writes to that file through the GitHub API. To unlock it, paste a GitHub token once on your device.

## Getting an admin token

1. Go to https://github.com/settings/personal-access-tokens/new
2. Token name: `natural-bjj`. Expiration: pick the longest you're comfortable with.
3. Repository access: **Only select repositories** → `natural-bjj`.
4. Permissions → Repository permissions → **Contents: Read and write**. Nothing else.
5. Generate, copy the token, open the app → Admin → paste → Unlock.

Share the token only with the people who should be allowed to edit results. It is stored in the browser of the device where it was pasted and never leaves it except to talk to GitHub.

## Development

```sh
pnpm install
pnpm dev
```

Pushes to `main` deploy automatically via GitHub Actions. Edits made from the Admin tab commit straight to `data/db.json` and do not trigger a rebuild; the app fetches the file live.
