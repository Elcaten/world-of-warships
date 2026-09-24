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
