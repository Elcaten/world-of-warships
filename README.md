# Elcaten World of Warships

A World of Warships ship encyclopedia built with React, TypeScript, and Vite for
the frontend home task. A complete, responsive page with styling inspired by the
game and live data from the Vortex API.

[Live demo](https://world-of-warships.elcaten.net)

## Implemented

- Virtualized grid and table views, with ship artwork and detail dialogs.
- Search, nation/class/tier filters, and sorting by name or tier.
- Search, filters, sort order, and view preserved in the URL.
- Loading and empty states, API response validation, and retryable errors.
- Tests covering API handling, filtering, UI interactions, and cache persistence.

## Run with Docker Compose

Requires Docker with Compose. From the repository root:

```sh
docker compose up --build
```

Open [localhost:8080](http://localhost:8080). The container serves the production
build through Nginx and proxies requests to Vortex.

## Local development

Requires Node.js 24+.

```sh
npm ci
npm run dev
```

Checks:

```sh
npm run test:run
npm run build
```

Browser tests (install Chromium once after `npm ci`):

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright covers desktop/mobile flows and scrolling with mocked data, locally
and in CI. Use `npm run test:e2e:ui` for interactive debugging.

## Assumptions and tradeoffs

I interpreted the brief as a single-page catalogue, prioritizing browsing,
filtering, sorting, and reliable loading.

- SSR and application routing are unnecessary for this scope.
- Responsive layouts prioritize usable screen space and comfortable spacing.
- Within the time budget, scroll restoration and a compact sticky filter panel
  that appears when the main controls scroll out of view were deferred beyond
  the MVP.

## Technology choices

The API layer validates responses, query hooks manage data, and UI components
handle presentation.

- **Tailwind CSS + Headless UI:** make the UI easy to style and extend,
  with accessible interaction primitives provided by Headless UI.
- **TanStack Query:** simplifies query cache management.
- **React Virtuoso:** virtualizes both grid and table views with straightforward
  configuration, making it a good fit for this catalogue.

## Data and caching

Filtering and sorting run in the browser. API responses are persisted in IndexedDB
and considered fresh for 24 hours, improving subsequent visits under the assumption
that encyclopedia updates are infrequent. After that, cached data remains visible
during background refresh and if the refresh fails.

The first visit still downloads the full catalogue. A possible extension is a
backend that caches upstream data and handles filtering, sorting, and pagination,
reducing the initial download. The existing Nginx proxy only forwards API requests.
