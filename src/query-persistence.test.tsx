import { StrictMode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  PersistQueryClientProvider,
  persistQueryClientSave,
} from "@tanstack/react-query-persist-client";
import type { PersistedClient } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { encyclopediaKeys, useVehicles } from "@/api/encyclopedia/queries";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import { createQueryClient } from "@/query-client";
import { persister, persistOptions } from "@/query-persistence";
import { server } from "@/test/mocks/server";

vi.mock("idb-keyval", () => ({ get: vi.fn(), set: vi.fn(), del: vi.fn() }));

const day = 24 * 60 * 60 * 1000;
let stored: PersistedClient | undefined;
const clients: ReturnType<typeof createQueryClient>[] = [];

function newClient() {
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { retry: false } });
  clients.push(client);
  return client;
}

function Catalogue() {
  const query = useVehicles();
  return (
    <>
      <p>
        {query.data ? `${Object.keys(query.data).length} ships` : "Loading"}
      </p>
      <p>{query.isFetching ? "Fetching" : "Idle"}</p>
      <p>{query.isError ? "Failed" : "OK"}</p>
    </>
  );
}

function mountCatalogue() {
  const client = newClient();
  const view = render(
    <StrictMode>
      <PersistQueryClientProvider
        client={client}
        persistOptions={persistOptions}
      >
        <Catalogue />
      </PersistQueryClientProvider>
    </StrictMode>,
  );
  return { ...view, client };
}

async function seed(age: number) {
  const client = newClient();
  client.setQueryData(encyclopediaKeys.vehicles(), vehicles.data, {
    updatedAt: Date.now() - age,
  });
  await persistQueryClientSave({ queryClient: client, ...persistOptions });
}

beforeEach(() => {
  stored = undefined;
  vi.mocked(get)
    .mockReset()
    .mockImplementation(async () => structuredClone(stored));
  vi.mocked(set)
    .mockReset()
    .mockImplementation(async (_key, value) => {
      stored = structuredClone(value);
    });
  vi.mocked(del)
    .mockReset()
    .mockImplementation(async () => {
      stored = undefined;
    });
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
});

it("waits for hydration in Strict Mode and reuses fresh data until explicitly invalidated", async () => {
  await seed(23 * 60 * 60 * 1000);
  const snapshot = structuredClone(stored);
  let release!: (value: PersistedClient | undefined) => void;
  vi.mocked(get).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  );
  let requests = 0;
  server.use(
    http.get("*/api/encyclopedia/en/vehicles/", () => {
      requests++;
      return HttpResponse.json(vehicles);
    }),
  );

  const { client } = mountCatalogue();
  expect(screen.getByText("Loading")).toBeInTheDocument();
  expect(screen.getByText("Idle")).toBeInTheDocument();
  expect(requests).toBe(0);
  await act(async () => release(snapshot));
  expect(await screen.findByText("2 ships")).toBeInTheDocument();
  expect(requests).toBe(0);
  expect(get).toHaveBeenCalledTimes(1);
  expect(
    client.getQueryCache().find({ queryKey: encyclopediaKeys.vehicles() })
      ?.gcTime,
  ).toBe(Infinity);

  await act(async () => {
    await client.invalidateQueries({ queryKey: encyclopediaKeys.all });
  });
  expect(requests).toBe(1);
});

it("shows old data while refreshing and saves the replacement", async () => {
  await seed(30 * day);
  let release!: () => void;
  const responseReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.get("*/api/encyclopedia/en/vehicles/", async () => {
      await responseReady;
      return HttpResponse.json({ status: "ok", data: {} });
    }),
  );

  mountCatalogue();
  expect(await screen.findByText("2 ships")).toBeInTheDocument();
  expect(await screen.findByText("Fetching")).toBeInTheDocument();
  release();
  expect(await screen.findByText("0 ships")).toBeInTheDocument();
  await waitFor(() =>
    expect(stored?.clientState.queries[0].state.data).toEqual({}),
  );
});

it("retains data after a failed refresh and restores it on the next visit", async () => {
  await seed(2 * day);
  server.use(
    http.get(
      "*/api/encyclopedia/en/vehicles/",
      () => new HttpResponse(null, { status: 503 }),
    ),
  );

  const first = mountCatalogue();
  expect(await screen.findByText("Failed")).toBeInTheDocument();
  expect(screen.getByText("2 ships")).toBeInTheDocument();
  await waitFor(() =>
    expect(stored?.clientState.queries[0].state.status).toBe("error"),
  );
  expect(stored?.clientState.queries[0].state.data).toEqual(vehicles.data);
  first.unmount();

  mountCatalogue();
  expect(await screen.findByText("2 ships")).toBeInTheDocument();
});

it("loads normally when storage reads, writes, and removal fail", async () => {
  const error = new Error("Storage unavailable");
  vi.mocked(get).mockRejectedValue(error);
  vi.mocked(set).mockRejectedValue(error);
  vi.mocked(del).mockRejectedValue(error);
  server.use(
    http.get("*/api/encyclopedia/en/vehicles/", () =>
      HttpResponse.json(vehicles),
    ),
  );

  mountCatalogue();
  expect(await screen.findByText("2 ships")).toBeInTheDocument();
  await waitFor(() => expect(set).toHaveBeenCalled());
  await expect(persister.removeClient()).resolves.toBeUndefined();
});

it("persists only cached encyclopedia data for the current API, without mutations", async () => {
  const client = newClient();
  client.setQueryData(["unrelated"], "not persisted");
  client.setQueryData(
    ["encyclopedia", "https://other.example/", "vehicles"],
    {},
  );
  client.getMutationCache().build(
    client,
    {},
    {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: true,
      status: "pending",
      variables: undefined,
      submittedAt: Date.now(),
    },
  );
  await persistQueryClientSave({ queryClient: client, ...persistOptions });
  expect(stored?.clientState).toEqual({ queries: [], mutations: [] });
});
