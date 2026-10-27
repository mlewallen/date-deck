# Date Deck

Ask your partner questions as a playful deck: swipe cards, This-or-That, and open questions. Their answers come back tied to the deck you asked them in.

## Run it locally

```bash
corepack enable   # once, provides pnpm
pnpm install
pnpm dev          # http://localhost:8443
```

`pnpm build` type-checks and writes the static site to `dist/`.

## Deploy to Netlify

`netlify.toml` holds the settings (build `pnpm run build`, publish `dist`, Node 22, functions in `netlify/functions`). Connect the repo in Netlify, or run `npx netlify deploy --prod` from this folder. No environment variables are needed: the short-link function uses Netlify Blobs, which Netlify provisions automatically.

## How data moves

- Decks, questions, and answers are saved in the browser's `localStorage` on the planner's device.
- **Send to partner** stores the deck with the app's share API (`/api/share`, a Netlify Function backed by Netlify Blobs) and gives a short link (`#/s/<12-char id>`). Opening it loads the deck. If the API can't be reached, the app falls back to a self-contained `#/play/…` link with the whole deck in the URL hash.
- The partner answers on their own phone, then sends back an answer link (`#/answers/…`), which stays self-contained and short (uploaded photos are left out). Opening it saves the answers to the matching deck.
- **Answer here** lets the partner answer on the planner's phone; the answers save straight to the deck.
- Shared decks (including uploaded photos) are stored in Netlify Blobs under an unguessable id; answers and everything else stay on the devices.
- `pnpm dev` serves the same share API from memory, so short links work locally until the dev server restarts.
- Back up from **Settings → Save backup**. On iPhone, add the site to the Home Screen so Safari doesn't clear its storage after a stretch of not using it.
