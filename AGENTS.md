# Date Deck

React 19 + Vite 8 + Tailwind CSS v4 single-page app, deployed to Netlify as static files.

## Development

- `pnpm dev` starts Vite on port 8443 (also reachable from other devices on the LAN).
- `pnpm build` type-checks (`tsc --noEmit`) and builds to `dist/`.
- Netlify settings live in `netlify.toml`; there are no server functions or environment variables.

## Project structure

- `src/App.tsx` - App shell and hash router (`#/deck/:id`, `#/play/:payload`, `#/answers/:payload`, `#/settings`)
- `src/lib/types.ts` - Deck, question, and answer types
- `src/lib/storage.ts` - localStorage persistence (`useAppData`) and partner-side progress
- `src/lib/share.ts` - Packs decks and answers into compressed URL-hash links
- `src/lib/content.ts` - Templates, preset photos, labels, and helpers
- `src/screens/` - Planner screens (`Planner.tsx`), question editor, answers view, and the partner flow (`Picker.tsx`)
- `src/components/ui.tsx` - Shared UI: icons, buttons, sheets, toasts, swipe card
- `src/index.css` - All styles (design tokens on `:root`, global element styles in `@layer base`)

## Conventions

- No backend: decks and answers travel inside the URL hash, which never reaches the server.
- Refer to people by name, never by gendered pronouns.
- The layout is a single column, full width on phones and centered (max 600px) on larger screens.
