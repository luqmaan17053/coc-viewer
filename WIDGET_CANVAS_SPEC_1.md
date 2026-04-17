# Widget Canvas Spec

Single source of truth for building the CoC dashboard's widget system. Read this before writing any widget code. Written to be sufficient context for a separate Claude Code session to build widgets 2+ without returning to the architect chat for clarifications.

---

## 1. Goals & scope

**What we're building.** A personalized, per-user dashboard at `/dashboard` made of draggable, resizable widgets. Users configure their profile once (player tag, main clan, up to 10 "clans of interest"), then build a layout from a library of widget types, each showing a slice of CoC data. Layout persists per-user in Supabase and syncs across devices. Desktop has a full editor with drag-drop, resize, add/remove widgets. Mobile is view-only for v1 (editable layout comes later).

**What we're deferring.**
- Mobile-side drag-drop editing (touch conflicts with scroll; solving this is a full design problem, not a session-4 problem)
- War-based metrics like 3-star rate (require multi-call aggregation we're avoiding in v1)
- Cross-user features (public clan dashboards, follow other users' layouts, etc.)
- Widget marketplace / user-contributed widgets
- Real-time data (60s proxy cache is fine for all v1 widgets)

**Non-goals.**
- Generalized analytics. This is a *CoC* dashboard, not a dashboard framework. Widgets can and should assume CoC-specific data shapes.
- Shared data stores across widgets. Each widget is self-contained; shared hooks handle fetch/cache but widgets don't read each other's state.

---

## 2. Architecture overview

Four layers, bottom up:

```
┌──────────────────────────────────────────────────┐
│ Canvas layer (react-grid-layout)                 │
│   - Places widgets on a grid                     │
│   - Owns edit mode, mobile preview toggle        │
│   - Saves layout changes via debounced action    │
└──────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────┐
│ Widget layer (the widgets themselves)            │
│   - Each widget is a self-contained component    │
│   - Widgets read from hooks, don't touch proxy   │
│   - Widgets declare their own config UI          │
└──────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────┐
│ Hooks layer (shared data fetching)               │
│   - useLinkedPlayer, useMainClan,                │
│     useClansOfInterest, useClanData, etc.        │
│   - Deduplicates fetches across widgets          │
│   - Client-side 60s cache via TanStack Query     │
│   - Server-side 60s cache already lives in proxy │
└──────────────────────────────────────────────────┘
                       ▲
┌──────────────────────────────────────────────────┐
│ Profile layer (Supabase)                         │
│   - Stores TAGS only, never CoC data             │
│   - linked_player_tag, main_clan_tag,            │
│     clans_of_interest (jsonb), dashboard_layouts │
└──────────────────────────────────────────────────┘
```

Rule: data flows upward, config flows downward. Widgets never write to the profile directly; they either use values the profile layer exposes, or accept config props from the canvas (which persists them).

---

## 3. Schema

### 3.1 Extend the `profiles` table

Run in Supabase SQL editor:

```sql
alter table public.profiles
  add column if not exists main_clan_tag text,
  add column if not exists clans_of_interest jsonb not null default '[]'::jsonb;

-- Cap the length of clans_of_interest to 10 via check constraint
alter table public.profiles
  add constraint clans_of_interest_max_10
  check (jsonb_array_length(clans_of_interest) <= 10);
```

Schema after:

```
profiles
├── id                  uuid primary key → auth.users(id)
├── linked_player_tag   text
├── main_clan_tag       text                 -- can be null, user's most-monitored clan
├── clans_of_interest   jsonb not null       -- ["#TAG1", "#TAG2", ...] max 10
├── display_name        text
├── created_at          timestamptz
└── updated_at          timestamptz
```

All tags stored in canonical form: leading `#`, uppercase, characters in `[0-9A-Z]`. Validation happens server-side in the server action that writes them.

### 3.2 Create the `dashboard_layouts` table

```sql
create table public.dashboard_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  widgets jsonb not null default '[]'::jsonb,
  layouts jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.dashboard_layouts enable row level security;

create policy "Users manage their own layout"
  on public.dashboard_layouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Two jsonb columns on purpose (not one combined blob):

- `widgets` is an array of widget instances — what widgets exist and their config
- `layouts` is an object keyed by breakpoint (`lg`, `sm`) — where each widget sits per device

They change independently. Dragging a widget updates `layouts` only. Changing a widget's config updates `widgets` only. Adding a widget updates both.

### 3.3 `widgets` jsonb shape

```json
[
  {
    "id": "w_ab12cd",
    "type": "player_stats",
    "config": {}
  },
  {
    "id": "w_ef34gh",
    "type": "clan_summary",
    "config": { "clanSource": "main" }
  },
  {
    "id": "w_ij56kl",
    "type": "clan_family_leaderboard",
    "config": {
      "clanSources": [
        { "kind": "main" },
        { "kind": "interest", "tag": "#2RC8G8P9R" },
        { "kind": "local",    "tag": "#ABC123XYZ" }
      ],
      "metrics": ["trophies", "donations", "townHallLevel"],
      "sortBy": "trophies",
      "sortDir": "desc"
    }
  }
]
```

**Critical detail: `clanSource` / `clanSources` use a discriminated union.**

- `{ "kind": "main" }` — references the user's main clan; resolves at render time
- `{ "kind": "interest", "tag": "#X" }` — references a specific clan-of-interest by tag. On render, check that `#X` still exists in the user's `clans_of_interest`. If not, treat as removed (drop from rendered data). This is the "cascade on remove" behavior.
- `{ "kind": "local", "tag": "#X" }` — widget-local tag typed directly by the user. Always shown regardless of profile clans.

Never store a raw tag string alone — always with its `kind`. Otherwise you can't tell a local tag from a stale global reference after the user removes it from their profile.

### 3.4 `layouts` jsonb shape

```json
{
  "lg": [
    { "i": "w_ab12cd", "x": 0, "y": 0, "w": 6, "h": 4 },
    { "i": "w_ef34gh", "x": 6, "y": 0, "w": 6, "h": 4 },
    { "i": "w_ij56kl", "x": 0, "y": 4, "w": 12, "h": 6 }
  ],
  "sm": [
    { "i": "w_ab12cd", "x": 0, "y": 0, "w": 1, "h": 4 },
    { "i": "w_ef34gh", "x": 0, "y": 4, "w": 1, "h": 4 },
    { "i": "w_ij56kl", "x": 0, "y": 8, "w": 1, "h": 6 }
  ]
}
```

Breakpoints: `lg` = desktop (≥1024px, 12-column grid), `sm` = mobile (<1024px, 1-column grid). No tablet breakpoint in v1 — tablets get the desktop layout. Keep it simple until someone asks.

The `i` field in each layout item matches the `id` in the widget array. `react-grid-layout` requires this exact field name.

---

## 4. The widget contract

Every widget lives at `app/dashboard/widgets/<type>/`. It exports three things:

```ts
// app/dashboard/widgets/<type>/index.tsx
import type { WidgetDefinition } from "../types";

export const definition: WidgetDefinition<ThisWidgetConfig> = {
  type: "player_stats",                    // must match the "type" in widgets jsonb
  displayName: "Player Stats",             // shown in widget picker modal
  description: "Your player profile card", // shown in widget picker modal
  icon: "👤",                              // emoji or lucide icon name
  defaultConfig: {},                       // what config to use when newly added
  defaultLayout: {
    lg: { w: 4, h: 5, minW: 3, minH: 5 },  // default size on desktop
    sm: { w: 1, h: 5, minH: 5 },           // default size on mobile
  },
  requiresConfigOnAdd: true,               // if true, picker opens config modal BEFORE adding
  Widget: PlayerStatsWidget,               // the component itself
  ConfigForm: PlayerStatsConfigForm,       // the component for the settings modal (or null)
};
```

The `WidgetDefinition<T>` type lives in `app/dashboard/widgets/types.ts`:

```ts
export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  type: string;
  displayName: string;
  description: string;
  icon: string;
  defaultConfig: TConfig;
  defaultLayout: {
    lg: { w: number; h: number; minW?: number; minH?: number; maxW?: number; maxH?: number };
    sm: { w: number; h: number; minW?: number; minH?: number };
  };
  /**
   * If true, clicking this widget in the picker opens the config modal in
   * "create" mode instead of adding immediately. The widget is only added
   * when the user clicks Save in the modal. Use when the widget needs
   * user-supplied config to be useful (e.g., a player tag, a clan selection).
   */
  requiresConfigOnAdd?: boolean;
  Widget: ComponentType<WidgetProps<TConfig>>;
  ConfigForm: ComponentType<WidgetConfigFormProps<TConfig>> | null;
}

export interface WidgetProps<TConfig = Record<string, unknown>> {
  id: string;
  config: TConfig;
  editMode: boolean;
  onRemove: () => void;
  onOpenConfig: () => void;
}

export interface WidgetConfigFormProps<TConfig = Record<string, unknown>> {
  initialConfig: TConfig;
  onSave: (newConfig: TConfig) => void;
  onCancel: () => void;
}
```

### 4.1 The widget registry

All widgets are registered in `app/dashboard/widgets/registry.ts`:

```ts
import { definition as playerStats } from "./player_stats";
import { definition as clanSummary } from "./clan_summary";
import { definition as clanFamilyLeaderboard } from "./clan_family_leaderboard";

export const WIDGET_REGISTRY = {
  [playerStats.type]: playerStats,
  [clanSummary.type]: clanSummary,
  [clanFamilyLeaderboard.type]: clanFamilyLeaderboard,
} as const;

export type WidgetType = keyof typeof WIDGET_REGISTRY;
```

Adding a new widget = create its folder, add one line to this registry. Nothing else in the app needs to know about it.

### 4.2 Rules every widget must follow

1. **Widgets are client components** (`"use client"` at the top). The canvas is a client component and so are its children.
2. **Widgets never call the proxy directly.** They use the shared hooks (section 5). This guarantees dedup + caching.
3. **Widgets must handle 4 states:** loading, error, empty (no relevant data), and success. Never render a blank widget.
4. **Widgets must render correctly at their `minW` x `minH` size.** Test at the smallest config before committing. A widget that looks broken when a user shrinks it is broken.
5. **Widgets must be responsive.** Don't assume desktop width inside a widget — the widget may be 2 columns wide on desktop (~200px) or full-width on mobile (~375px).
6. **Widgets must not cause layout thrash.** If the widget's size changes based on data, that's a layout bug. Fix heights via scrollable inner containers, not by growing the outer component.
7. **Widgets must not store data in `localStorage` or `sessionStorage`.** All persistence goes through Supabase via the canvas.

### 4.3 Edit mode vs. view mode

The `editMode: boolean` prop tells each widget whether the canvas is in edit or view mode. Widgets should:

- **In view mode:** render normally, no chrome, no controls
- **In edit mode:** render a header strip with a drag handle (left), the widget title (center), and control buttons (right): ⚙ (open config) and ✕ (remove)

The chrome should overlay the widget content, not displace it. Use absolute positioning so the widget's useful area is the same in both modes.

### 4.4 Config flow — two modes

**Create mode** (via the picker, triggered by `requiresConfigOnAdd: true`):
- User clicks a widget in the picker
- Config modal opens with `initialConfig = definition.defaultConfig`
- User fills required fields → clicks Save → widget is created with chosen config
- User clicks Cancel → no widget is added

**Edit mode** (via the ⚙ icon on an existing widget in edit mode):
- User clicks ⚙ on a widget
- Config modal opens with `initialConfig = widget.config` (current)
- User tweaks → Save → updates the widget
- User clicks Cancel → no change

Both modes use the same ConfigForm component. The form doesn't know which mode it's in — it just gets an `initialConfig`, emits `onSave(newConfig)` or `onCancel()`. The canvas handles the difference.

The config form MUST:
- Initialize all state with `?? defaultValue` (React warns if state starts `undefined` then becomes defined)
- Disable the Save button until the form is in a valid state (typically: tag validated by preview hook)
- Call `onSave(newConfig)` on submit — the modal closes and persists automatically
- Call `onCancel()` on cancel/close

### 4.5 Shared preview hooks for tag inputs

`app/profile/useTagPreview.ts` exports two hooks that every config form involving a CoC tag should use:

- **`usePlayerPreview(raw: string)`** — debounced (500ms) player tag lookup. Returns `{ status: "idle" | "loading" | "success" | "error"; data?; message? }`.
- **`useClanPreview(raw: string)`** — same for clan tags.

Do NOT reimplement debounced tag lookup. These hooks validate format, debounce, cancel stale requests via AbortController, and return a clean status type. Your config form just reads `preview.status` to drive UI.

Example use in a widget config form (see `app/dashboard/widgets/player_stats/ConfigForm.tsx` for the canonical pattern):

```tsx
const preview = usePlayerPreview(tagInput);
const canSave = preview.status === "success";

{preview.status === "loading" && <p>Looking up player...</p>}
{preview.status === "error" && <p className="text-red-400">{preview.message}</p>}
{preview.status === "success" && <PlayerPreviewCard player={preview.data} />}
```

---

## 5. Shared hooks

All hooks live in `app/dashboard/hooks/`. All use TanStack Query (`@tanstack/react-query`) for client-side caching and dedup. Install:

```bash
npm install @tanstack/react-query
```

Wrap the dashboard route with `<QueryClientProvider>`. Default options:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,              // 60s — match proxy cache
      refetchOnWindowFocus: false,    // don't refetch on tab focus
      retry: 1,
    },
  },
});
```

### 5.1 `useProfile()` — the user's tags

```ts
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("linked_player_tag, main_clan_tag, clans_of_interest, display_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,  // profile changes less often; 5min stale
  });
}
```

Widgets use this to know the user's tags.

### 5.2 `usePlayer(tag: string | null | undefined)` — one player's CoC data

```ts
export function usePlayer(tag: string | null | undefined) {
  return useQuery({
    queryKey: ["player", tag],
    queryFn: async () => {
      if (!tag) throw new Error("No tag provided");
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerTag: tag }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch player ${tag}`);
      }
      return res.json();
    },
    enabled: !!tag,
  });
}
```

### 5.3 `useClan(tag: string | null | undefined)` — one clan's CoC data

Identical shape to `usePlayer`, hits `/api/clan`.

### 5.4 `useLinkedPlayer()` — convenience: the user's own player

```ts
export function useLinkedPlayer() {
  const profile = useProfile();
  return usePlayer(profile.data?.linked_player_tag);
}
```

### 5.5 `useMainClan()` — the user's main clan

```ts
export function useMainClan() {
  const profile = useProfile();
  return useClan(profile.data?.main_clan_tag);
}
```

### 5.6 `useClanRef(ref: ClanRef)` — resolves a discriminated union to clan data

```ts
export type ClanRef =
  | { kind: "main" }
  | { kind: "interest"; tag: string }
  | { kind: "local"; tag: string };

export function useClanRef(ref: ClanRef) {
  const profile = useProfile();

  // Resolve the tag
  let tag: string | null = null;
  let resolved = false;
  if (ref.kind === "main") {
    tag = profile.data?.main_clan_tag ?? null;
    resolved = !!profile.data;
  } else if (ref.kind === "interest") {
    // Silently drop if the user has removed this tag from their interests
    const interests = (profile.data?.clans_of_interest as string[] | undefined) ?? [];
    tag = interests.includes(ref.tag) ? ref.tag : null;
    resolved = !!profile.data;
  } else {
    tag = ref.tag;
    resolved = true;
  }

  const clan = useClan(tag);

  return {
    ...clan,
    resolved,     // profile has loaded and the ref has been checked
    isOrphaned: ref.kind === "interest" && resolved && tag === null,
  };
}
```

Widgets that accept `ClanRef[]` arrays (like the leaderboard) map over them with `useClanRef` to get the actual data. Orphaned refs are silently skipped — the widget shows the other clans' data.

---

## 6. The canvas

Install:

```bash
npm install react-grid-layout
npm install -D @types/react-grid-layout
```

### 6.1 Route structure

```
app/dashboard/
├── page.tsx                      # server component: auth, fetch layout, pass to client
├── DashboardClient.tsx           # the editor shell; client component
├── DashboardGrid.tsx             # react-grid-layout wrapper
├── WidgetPicker.tsx              # modal to add a widget
├── MobilePreview.tsx             # toggles viewport width for mobile testing
├── actions.ts                    # server actions: saveLayout, saveProfile, etc.
├── widgets/
│   ├── types.ts                  # WidgetDefinition, WidgetProps, ClanRef, etc.
│   ├── registry.ts               # central registry of all widgets
│   ├── player_stats/
│   │   ├── index.tsx             # definition + re-exports
│   │   ├── Widget.tsx            # the widget itself
│   │   └── ConfigForm.tsx        # settings form (or null)
│   ├── clan_summary/...
│   └── clan_family_leaderboard/...
├── hooks/
│   ├── useProfile.ts
│   ├── usePlayer.ts
│   ├── useClan.ts
│   ├── useClanRef.ts
│   └── index.ts                  # re-exports
└── providers.tsx                 # QueryClientProvider wrapper
```

### 6.2 Edit mode

Desktop view shows an "Edit dashboard" button in the top-right. Clicking it flips the canvas into edit mode, which:

- Enables `isDraggable` and `isResizable` on the grid
- Shows a widget chrome overlay (title, ⚙, ✕) on each widget
- Shows a "+ Add widget" FAB in the bottom-right
- Shows a "Save & exit" button in place of "Edit dashboard"
- Shows the mobile preview toggle at top-right (phone icon)

Layout changes during edit mode auto-save via a **debounced server action** (1000ms debounce). User doesn't need to click save to persist position changes — it's background-saved. "Save & exit" just flips back to view mode.

### 6.3 Debounced layout save

```ts
// In DashboardGrid.tsx
const [pendingSave, setPendingSave] = useState<Layouts | null>(null);

useEffect(() => {
  if (!pendingSave) return;
  const timer = setTimeout(() => {
    saveLayoutAction(pendingSave);
    setPendingSave(null);
  }, 1000);
  return () => clearTimeout(timer);
}, [pendingSave]);

function handleLayoutChange(_: Layout[], allLayouts: Layouts) {
  setPendingSave(allLayouts);
}
```

Important: don't save on every `onLayoutChange` call — `react-grid-layout` fires that event ~60 times per second while dragging. Debounce or you'll hammer Supabase.

### 6.4 Mobile preview toggle

In edit mode on desktop, a button labeled "Mobile" (or a phone icon) constrains the canvas width to 375px and switches the breakpoint to `sm`. Users see what their layout looks like on a phone and can drag widgets around *in that view* — changes save to the `sm` layout, not `lg`. Clicking "Desktop" flips back.

Implementation: the mobile preview wraps the grid in a `<div style={{ maxWidth: isMobilePreview ? 375 : "100%" }}>` and forces the breakpoint via `breakpoints={{ lg: 1024, sm: 0 }}` + a controlled `currentBreakpoint` prop on `ResponsiveGridLayout`.

### 6.5 Mobile (real mobile) behavior

For v1, mobile splits cleanly between **config (supported)** and **layout (not supported)**:

**Supported on mobile:**
- Profile setup flow (section 7) — full mobile-first design, stacked forms, full-screen where appropriate
- Opening a widget's ⚙ config form and editing it — modal renders full-screen on mobile, regular modal on desktop

**Not supported on mobile (defer to a future session):**
- Dragging widgets to rearrange
- Resizing widgets
- Adding new widgets
- Removing widgets

Mobile users see their `sm` layout rendered in view mode, with widgets displaying their real data. A small banner at the top reads "Edit your layout on desktop" with a link to dismiss. The ⚙ icon appears on each widget in a mobile-specific tap-target size (48px) so config editing still works.

The "Edit dashboard" button from section 6.2 is desktop-only; hide it below the `lg` breakpoint.

---

## 7. Profile setup UX

This is the shared `ProfileConfigForm` component at `/dashboard/profile` (or inline on the dashboard if profile is empty). The flow:

### 7.1 Step 1 — Player tag

Input + Save button. On submit, hit `/api/player` with the tag. On success:
- Save `linked_player_tag` to profile
- If the returned player data has a `clan` field, move to step 2 with suggestion
- Otherwise, move to step 2 with no suggestion

### 7.2 Step 2 — Main clan

If the player lookup returned a clan:
- Render a suggestion card: clan badge + name + level + member count
- Buttons: "Use this clan" (saves to `main_clan_tag`) or "Choose another" (reveals a manual input)

If no suggestion (or user chose "Choose another"):
- Manual clan tag input with debounced validation (500ms after typing stops)
- On valid tag, show the clan card inline as a preview
- "Save main clan" button

Main clan is optional during initial setup — user can skip and come back later. If skipped, widgets needing it show an empty state with a "Set a main clan" CTA linking to profile.

**Main clan lifecycle (after setup):**

- The main clan card in the profile UI has two controls: ⭐ (implicit — it's already main) and a ✕ (remove).
- Each clan-of-interest card has a ☆ ("Set as main") button and a ✕ (remove) button.
- Clicking ☆ on an interest clan: swaps it into the main slot, demotes the current main into the interests list (front of the array). Single atomic server action.
- Clicking ✕ on the main clan: demotes it to an interest (moves to interests array) if interests is below cap, OR warns "You're at 10 clans of interest. Pick one to drop, or cancel" if the interests array is full. If the user had no interests, removing the main leaves `main_clan_tag = null` and widgets needing it show the empty state.
- Clicking ✕ on an interest clan: removes entirely (with cascade warning if referenced by widgets).
- No auto-promotion. All promotions are explicit via the ☆ button.

### 7.3 Step 3 — Clans of interest

A list of clan cards (badge + name) with a delete ✕ on each. Below, a "+ Add another" button reveals a debounced tag input. Max 10.

Removing a clan opens a confirmation modal if any widget references it:

> **Remove "Sister Clan Name"?**
>
> This clan is used by 2 widgets:
> - Clan Family Leaderboard
> - Member Donations Table
>
> Those widgets will stop showing this clan's data.
>
> [Cancel] [Remove]

The check scans `widgets[]` in the user's dashboard layout for any `clanSource.kind === "interest" && clanSource.tag === removedTag`.

### 7.4 Saving

One server action per step (`savePlayerTag`, `saveMainClan`, `addClanOfInterest`, `removeClanOfInterest`). All validate tags server-side — strip `#`, uppercase, check `/^[0-9A-Z]{4,12}$/`, then verify the tag resolves via the proxy before saving. Invalid tags never make it into the profile.

---

## 8. Mobile-first rules

1. **Every widget must be tested at 375px width** (iPhone SE). Not DevTools responsive mode — a real phone.
2. **Touch targets ≥ 44px square** for anything interactive inside a widget (buttons, rows, icons).
3. **Horizontal scroll is OK** for data-dense widgets (leaderboards). Vertical scroll inside a widget is also OK.
4. **Use Tailwind responsive prefixes** (`sm:`, `md:`, `lg:`) for widget content, not just the outer layout.
5. **Prefer compact card layouts over tables on mobile.** A 10-column table is unreadable; a card with labeled rows works.
6. **The leaderboard widget has a specific frozen-columns pattern** (see its reference implementation when built). Freeze: clan badge + player league icon + player name. Scroll: metric columns.
7. **Never rely on hover.** Use tap/click for any state change.

---

## 9. Testing checklist

Every widget, before it's considered done:

- [ ] Desktop look at default size (`lg` defaults)
- [ ] Desktop look at minimum size (`minW` x `minH`)
- [ ] Desktop look at a large size (stretched)
- [ ] Mobile look at 1-column mobile width
- [ ] Real phone test (open the prod ACA URL on an actual phone)
- [ ] Loading state (simulate with React DevTools or slow network throttling)
- [ ] Error state (simulate by passing a bad tag)
- [ ] Empty state (user has no `linked_player_tag` yet, or widget-specific equivalents)
- [ ] Config form works and persists (click ⚙, change something, save, reopen, verify persisted)
- [ ] Removing the widget clears it from the layout and doesn't leave orphan data
- [ ] Adding the widget in edit mode puts it in a sensible location (default layout kicks in)
- [ ] Cascade behavior: if the widget references a clan of interest and the user removes that clan, the widget drops its data gracefully

---

## 10. Known gotchas

### 10.1 From prior sessions (still apply)
- **VS Code unsaved buffers look saved but aren't.** Always verify on disk with `Select-String` before committing.
- **`az containerapp update --set-env-vars` is a full replace.** Always pass all env vars.
- **`NEXT_PUBLIC_*` must be passed as build args** to the Docker build, not just as runtime env vars.
- **Server-side redirects** must use `x-forwarded-host` header, not `request.url`.
- **Always bump image tags** (`:v7`, `:v8`, ...) on redeploy.

### 10.2 New to the widget canvas

- **SSR + react-grid-layout hydration mismatch.** The grid's initial render on the server doesn't know the viewport width, so it picks the wrong breakpoint and then hydrates into the right one, causing layout flash. Fix: wrap the grid in a component that only renders client-side via `dynamic(() => import("./DashboardGrid"), { ssr: false })`. The reference implementation is `app/dashboard/DashboardGrid.tsx`.

- **`react-grid-layout` v2 removed `WidthProvider`.** v2 is a breaking rewrite; `WidthProvider` and the class-based Responsive don't exist there. **Pin to v1**: `npm install react-grid-layout@^1.5.1`. Claude Code and most tutorials target v1 — stay with it.

- **`useLayoutEffect` warning on server.** If you import `react-grid-layout` in a server component, Next will warn. Ensure the grid is only ever imported in client components.

- **Widget IDs must be stable across renders.** Generating `w_${Math.random()}` inside a render function breaks react-grid-layout. Generate the ID once in the server action when adding the widget. Optimistic creates use a `temp_${Date.now()}` ID locally, then reconcile to the server-assigned ID when the action returns.

- **TanStack Query + React 19.** Make sure you're on `@tanstack/react-query@5.x` — earlier versions have known issues with React 19's new hooks.

- **Debounced save races.** If a user makes rapid changes, an earlier save's server action might resolve *after* a later one (network reordering). Use refs to always save the latest pending state. Last-write-wins on the server is fine for layouts.

- **`ResizeObserver` errors in console.** `react-grid-layout` uses ResizeObserver internally and Chromium logs a harmless "ResizeObserver loop completed with undelivered notifications" error. It's a known browser bug, not ours. Suppress or ignore.

- **Mobile preview breakpoint gotcha.** When the user toggles mobile preview on desktop, `ResponsiveGridLayout` needs both the wrapper `max-width` AND the `breakpoint` prop forced explicitly — just setting CSS on a parent div doesn't change the internal breakpoint detection.

- **Controlled/uncontrolled input warning on legacy configs.** If a widget's config shape changes between versions, old saved configs may be missing new fields. `useState(initialConfig.newField)` starts as `undefined` then becomes defined when the user interacts, triggering React's warning. **Always default in `useState`:** `useState(initialConfig.newField ?? defaultValue)`.

- **PowerShell `--set-env-vars` quoting.** Double quotes sometimes let `=` and `:` confuse PowerShell's tokenizer on long commands. Use single quotes around each `KEY=secretref:name` argument instead.

- **VS Code CSS linter warns about `@theme inline`.** Tailwind v4's CSS-first syntax. Not a real error — it's processed before the browser sees it. Install the Tailwind CSS VS Code extension (`bradlc.vscode-tailwindcss`) to silence it, or ignore.

---

## 11. Session 4 implementation order

Do these in this exact order. Each step is independently testable.

1. **Schema migration** (run the `alter table` + `create table` SQL in Supabase)
2. **Profile setup UX** (`ProfileConfigForm`, its server actions, player tag → clan suggestion flow, clans-of-interest add/remove with warn-on-cascade)
3. **Dashboard shell** (`app/dashboard/page.tsx` loads profile + layout, passes to `DashboardClient`; QueryClient provider)
4. **Shared hooks** (`useProfile`, `usePlayer`, `useClan`, `useLinkedPlayer`, `useMainClan`, `useClanRef`)
5. **Widget contract + registry** (types, empty registry, example stub)
6. **Widget #1: Player Stats** (wraps existing `PlayerCard`, shows for linked player; reference implementation for the handoff)
7. **Canvas: basic grid rendering** (no edit mode yet; just read layouts, render widgets in place)
8. **Canvas: edit mode** (drag, resize, debounced save, add/remove)
9. **Canvas: mobile preview toggle**
10. **Real-phone test** of Player Stats widget on the prod ACA URL
11. **Hand off to Claude Code** with this doc + widget #1 as reference

Widgets 2-10 (clan summary, member list, clan family leaderboard, donations, war log, etc.) all follow the reference pattern.

---

## 12. Glossary

- **Main clan** — the clan the user wants to monitor most. May or may not be their current in-game clan.
- **Clan of interest** — a clan the user wants quick access to in widgets. Global, reusable. Max 10 per user.
- **Global clan** — main clan + clans of interest. Saved on profile.
- **Local clan** — a clan tag typed directly into a widget's config. Not reusable.
- **ClanRef** — discriminated union in widget config: `main` | `interest` | `local`.
- **Orphaned ref** — an `interest` ref whose tag has been removed from the user's profile. Widgets silently skip these.
- **Cascade on remove** — removing a clan from profile drops it from all widgets that reference it (with warn-before-remove UX).

---

*Treat this doc as living. When we learn something new during implementation (especially in session 4's build of widget #1), come back and update the relevant section. Doc is only useful if it stays current.*
