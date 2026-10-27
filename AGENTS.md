# Date Deck

React 19 + Vite 8 + Tailwind CSS v4 single-page app, deployed to Netlify (static files plus one function).

## Development

- `pnpm dev` starts Vite on port 8443 (also reachable from other devices on the LAN).
- `pnpm build` type-checks (`tsc --noEmit`) and builds to `dist/`.
- Netlify settings live in `netlify.toml`. One function, `netlify/functions/share.mts`, stores invites in Netlify Blobs for short links; its logic lives in `netlify/lib/share-handler.ts`, which `vite.config.ts` also serves during `pnpm dev`.

## Project structure

- `src/App.tsx` - App shell and hash router (`#/deck/:id`, `#/s/:id`, `#/play/:payload`, `#/answers/:payload`, `#/settings`)
- `src/lib/types.ts` - Deck, question, and answer types
- `src/lib/storage.ts` - localStorage persistence (`useAppData`) and partner-side progress
- `src/lib/share.ts` - Short invite links via `/api/share`, plus compressed URL-hash payloads for fallbacks and answers
- `src/lib/content.ts` - Templates, preset photos, labels, and helpers
- `src/screens/` - Planner screens (`Planner.tsx`), question editor, answers view, and the partner flow (`Picker.tsx`)
- `src/components/ui.tsx` - Shared UI: icons, buttons, sheets, toasts, swipe card
- `src/index.css` - All styles (design tokens on `:root`, global element styles in `@layer base`)

## Conventions

- Invites are shared as short `#/s/<id>` links backed by `/api/share`, with a self-contained `#/play/<payload>` fallback. Answer links stay self-contained in the URL hash.
- Refer to people by name, never by gendered pronouns.
- The layout is a single column, full width on phones and centered (max 600px) on larger screens.
