# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

There are no tests in this project.

## Architecture

This is a **Clash of Clans API viewer** built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4.

### Data flow

1. The single-page UI ([app/page.tsx](app/page.tsx)) is a client component (`"use client"`) that holds all form state and dispatches `POST` requests to the internal API routes.
2. The API routes ([app/api/player/route.ts](app/api/player/route.ts), [app/api/clan/route.ts](app/api/clan/route.ts)) act as a server-side proxy to the Clash of Clans REST API (`https://api.clashofclans.com/v1`). They exist so the user's Bearer token is never exposed in client-side fetch calls — the token travels from the browser to the Next.js server, which forwards it to the CoC API.
3. The result is rendered by [app/components/PlayerCard.tsx](app/components/PlayerCard.tsx) or [app/components/ClanCard.tsx](app/components/ClanCard.tsx). `ClanCard` supports clicking any member row to open a `PlayerModal`, which lazily fetches that member's full profile via `/api/player`.

### Key conventions

- **No environment variables** — the CoC API token is supplied by the user at runtime via a password input and passed with each request body. It is never stored.
- **Tag encoding** — player/clan tags must have `#` encoded as `%23` before use in a URL. Both route handlers use `encodeURIComponent` and prepend `#` if the tag doesn't already start with one.
- `next/image` is used for all CoC asset images (league icons, clan badges, labels). Remote patterns for `api-assets.clashofclans.com` are whitelisted in [next.config.ts](next.config.ts). Pass `unoptimized` prop when the CDN already serves optimized images to avoid double-processing.
- `StatBox` and `TroopGrid` are file-local helper components — they are not shared between `PlayerCard` and `ClanCard` (each file has its own `StatBox`).
- Tailwind CSS v4 is configured via PostCSS ([postcss.config.mjs](postcss.config.mjs)); there is no `tailwind.config.*` file — v4 uses CSS-first configuration.
