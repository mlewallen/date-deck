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

`netlify.toml` holds the settings (build `pnpm run build`, publish `dist`, Node 22). Connect the repo in Netlify, or run `npx netlify deploy --prod` from this folder. No environment variables, functions, or database are needed.

## How data moves

- Decks, questions, and answers are saved in the browser's `localStorage` on the planner's device.
- **Send to partner** makes a link with the whole deck packed into the URL hash (`#/play/…`). The partner answers on their own phone, then sends back an answer link (`#/answers/…`). Opening it saves the answers to the matching deck.
- **Answer here** lets the partner answer on the planner's phone; the answers save straight to the deck.
- The URL hash is never sent to the server, so nothing about a deck is stored on Netlify.
- Back up from **Settings → Save backup**. On iPhone, add the site to the Home Screen so Safari doesn't clear its storage after a stretch of not using it.
