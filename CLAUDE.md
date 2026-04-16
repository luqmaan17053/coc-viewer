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

## Environment variables

Required in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PROXY_URL=...       # Base URL of the CoC API proxy (no trailing slash)
PROXY_SECRET=...    # Shared secret sent as x-proxy-secret header
```

`PROXY_URL`/`PROXY_SECRET` replaced the old user-supplied Bearer token model. The `/api/player` and `/api/clan` routes call `${PROXY_URL}/v1/...` with `x-proxy-secret` instead of forwarding a user token.

## Architecture

This is a **Clash of Clans API viewer + personal dashboard** built with Next.js (App Router), React 19, TypeScript, Tailwind CSS v4, and Supabase.

### Pages / routes

| Route | Type | Purpose |
|---|---|---|
| `/` | client component | Public player/clan tag lookup (no auth required) |
| `/login` | client component | OAuth sign-in (Google, Discord) via Supabase |
| `/auth/callback` | route handler | Exchanges the OAuth code for a Supabase session |
| `/auth/signout` | route handler | Signs out and redirects |
| `/profile` | server component | Links player tag + clans to the user's account |
| `/dashboard` | server component | Authenticated widget dashboard |

### Data flow

1. **Public lookup** (`/`): client component holds form state, POSTs to `/api/player` or `/api/clan`, renders `PlayerCard`/`ClanCard`. `ClanCard` supports clicking member rows to open a `PlayerModal` that lazily fetches via `/api/player`.

2. **Auth**: Supabase Auth with OAuth providers. Middleware (`lib/supabase/middleware.ts`) refreshes the session on every request. The callback route (`/auth/callback`) handles the code→session exchange and respects `x-forwarded-host` for reverse-proxy deployments.

3. **Profile** (`/profile`): server component fetches from Supabase `profiles` table, passes data to `ProfileEditor` (client). Profile stores `linked_player_tag`, `main_clan_tag`, `clans_of_interest[]`, `display_name`.

4. **Dashboard** (`/dashboard`): server component reads `profiles` and `dashboard_layouts` tables, passes initial data to `DashboardClient` (client). Widget state (list + grid positions) is stored as JSON in `dashboard_layouts.widgets` and `dashboard_layouts.layouts`. Server actions in `app/dashboard/actions.ts` handle add/remove/update/reorder.

### Widget system

Widgets live under `app/dashboard/widgets/<widget_type>/`. To add a new widget:

1. Create `Widget.tsx` (implements `WidgetProps<TConfig>`), `ConfigForm.tsx` (implements `WidgetConfigFormProps<TConfig>` — or `null` if no config), and `index.tsx` exporting a `WidgetDefinition<TConfig>`.
2. Register it in `app/dashboard/widgets/registry.ts`.

Key fields on `WidgetDefinition`:
- `requiresConfigOnAdd: true` — opens the config modal before adding the widget instead of adding with defaults.
- `defaultLayout.lg` / `defaultLayout.sm` — grid dimensions for desktop (12-column) and mobile (1-column).

Dashboard widgets use **React Query** (`@tanstack/react-query`) for data fetching. `DashboardProviders` wraps the dashboard in a `QueryClientProvider` (stale time 60 s, no refetch on focus, 1 retry). Shared hooks live in `app/dashboard/hooks/`:
- `useProfile()` — fetches the Supabase profile via the browser client.
- `useLinkedPlayer()` — fetches the linked player tag from the profile, then calls `/api/player`.
- `usePlayer(tag)` — fetches any player by tag via `/api/player`.
- `useClan(tag)` / `useClanRef()` — equivalent for clans.

### Key conventions

- **Tag encoding** — player/clan tags must have `#` encoded as `%23` in URLs. Both route handlers use `encodeURIComponent` and prepend `#` if the tag doesn't already start with one.
- `next/image` is used for all CoC asset images. Remote patterns for `api-assets.clashofclans.com` are whitelisted in `next.config.ts`. Pass `unoptimized` when the CDN already serves optimized images.
- `StatBox` and `TroopGrid` are file-local helper components — not shared between `PlayerCard` and `ClanCard`.
- Tailwind CSS v4 is configured via PostCSS (`postcss.config.mjs`); there is no `tailwind.config.*` file — v4 uses CSS-first configuration.
- Supabase is accessed via `lib/supabase/server.ts` (Server Components / route handlers / actions) and `lib/supabase/client.ts` (client components). Never mix them up — the server client reads cookies; the browser client uses the anon key directly.
- Dashboard layout saves are debounced (800 ms) client-side and call the `saveLayouts` server action. `revalidatePath("/dashboard")` is called after mutations (add/remove/update widget) but NOT after layout-only saves, to avoid interrupting the drag session.
