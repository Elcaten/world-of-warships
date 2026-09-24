# Elcaten World of Warships

An empty React 19 + TypeScript starter powered by Vite.

## Getting started

Use Node.js 24 or newer (`nvm use` selects Node 24), then run:

```sh
npm ci
npm run dev
```

The app starts with a blank page. Add your UI in `src/App.tsx`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Check application, tests, and configuration types |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run tests once |

## Included

- React 19 with strict TypeScript and React Strict Mode.
- Tailwind CSS via `@tailwindcss/vite`; global styles live in `src/index.css`.
- TanStack Query with a root provider and a client in `src/query-client.ts`.
- TanStack Virtual installed and ready to import when adding virtualized lists.
- Vitest with jsdom, React Testing Library, and jest-dom matchers.
- MSW configured for tests, with unhandled requests treated as errors. Add shared
  handlers in `src/test/mocks/handlers.ts` or per-test handlers with `server.use()`.
- `renderWithProviders` in `src/test/render.tsx` creates an isolated query client
  for each render and disables retries in tests.

The setup test exercises React Query, Testing Library, and MSW together. MSW is
only enabled in tests; the development app makes normal network requests.

Configuration references: [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite),
[Vitest](https://vitest.dev/guide/), and [MSW for Node.js](https://mswjs.io/docs/integrations/node/).

## Encyclopedia API

The API layer lives in `src/api/encyclopedia`. Zod schemas validate every
response and provide the TypeScript types through `z.infer`. The native-fetch
client unwraps `data`, rejects HTTP/API/schema errors, and accepts an
`AbortSignal`. Query options pass React Query's cancellation signal to fetch.

All four live responses were inspected and validated on September 24, 2026:

| Endpoint beneath `https://vortex.worldofwarships.eu/api/encyclopedia/en/` | `data` shape |
| --- | --- |
| `vehicles/` | Record keyed by ship ID strings; 1,049 ships |
| `nations/` | Array of 13 nations, each with `id` and `name` |
| `vehicle_types_common/` | Record keyed by five class names, such as `Destroyer` |
| `media_path/` | Absolute CDN base URL: `https://wows-gloss-icons.wgcdn.co/icons/` |

Every response uses `{ status: 'ok', data: ... }`. Ships contain `level`,
technical `name`, `nation`, `tags`, relative `icons`, and `localization`
dictionaries. Display names are in `localization.mark.en`; descriptions are in
`localization.description.en`. Class names occur in `tags`, not a `type` field.
Join a ship's `nation` to a nation's `name`. Type `shortmark` dictionaries can
be empty. Tier 11 exists. The schemas allow new dictionary keys, languages,
tags, and extra object fields without hard-coding today's catalogue values.

These URLs return full catalogues. `useShips` searches and filters the cached
vehicle record locally, returning an array with each ship's `id` preserved.
Search matches English display names, technical names, and IDs. Nation, class,
and tier filters are ANDed; values within each filter are ORed. Omitted filters
include all ships; empty nation or type arrays match none. Empty tier arrays
include all tiers. No hidden, premium, or event ships are implicitly excluded.
The catalogue stays fresh and remains cached while inactive for one hour;
changing filters does not trigger a new request. The full vehicle response is
about 20 MB uncompressed, so the first load still requires that download.

```tsx
import {
  resolveMediaUrl,
  useMediaPath,
  useShips,
} from './api/encyclopedia'

function ShipCards({ search }: { search: string }) {
  const ships = useShips({ search })
  const media = useMediaPath()

  if (ships.isPending || media.isPending) return <p>Loading ships…</p>
  if (ships.isError || media.isError) return <p>Could not load ships.</p>

  return ships.data.map((ship) => (
    <article key={ship.id}>
      <img src={resolveMediaUrl(media.data, ship.icons.medium)} alt="" />
      <h2>{ship.localization.mark.en ?? ship.name}</h2>
      <p>Tier {ship.level}</p>
    </article>
  ))
}
```

For filters, use `useNations()` and `useVehicleTypes()`. For example,
`useShips({ nations: ['japan'], types: ['Battleship'], levels: [10] })`.
`useVehicles()` exposes the validated ID-keyed record. All four endpoints also
export `*QueryOptions()` factories for `useQuery`, `useQueries`, prefetching,
and imperative fetching. Invalidate the catalogue with
`queryClient.invalidateQueries({ queryKey: encyclopediaKeys.all })`.
Use `small`, `medium`, `large`, or other CDN icon paths with `resolveMediaUrl`;
the `local_*` icon paths refer to game assets.

### Browser access and deployment

The upstream API did not return `Access-Control-Allow-Origin` when tested with
a localhost Origin header. Requests therefore default to the same-origin path
`/api/encyclopedia/en/`, which Vite proxies to the upstream host for development
and local preview. **Production hosting must proxy `/api/encyclopedia/` to
`https://vortex.worldofwarships.eu/api/encyclopedia/`, preserving the path.**
Alternatively, set `VITE_ENCYCLOPEDIA_BASE_URL` at build time to a CORS-enabled
backend base URL including `/en/`. Pointing a browser directly at the upstream
host does not bypass CORS. This variable is public client configuration.

Tests use small, English-only excerpts of the inspected responses in
`src/api/encyclopedia/__fixtures__`, covering response validation, failure paths,
cancellation, local filters, media URLs, and shared React Query caching.
