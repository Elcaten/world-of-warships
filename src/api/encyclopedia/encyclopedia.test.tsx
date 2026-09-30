import type { FleetSort } from "@/lib/useFleetQueryState";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import mediaFixture from "./__fixtures__/media_path.json";
import nationsFixture from "./__fixtures__/nations.json";
import typesFixture from "./__fixtures__/vehicle_types_common.json";
import vehiclesFixture from "./__fixtures__/vehicles.json";
import {
  EncyclopediaApiError,
  encyclopediaClient,
  encyclopediaKeys,
  HttpError,
  resolveMediaUrl,
  selectShips,
  useShipCountQuery,
  useShipsQuery,
  useVehiclesQuery,
  vehiclesResponseSchema,
} from "./index";

const baseUrl = "*/api/encyclopedia/en";

describe("encyclopedia client", () => {
  it.each([
    ["vehicles", encyclopediaClient.getVehicles, vehiclesFixture],
    ["nations", encyclopediaClient.getNations, nationsFixture],
    ["vehicle_types_common", encyclopediaClient.getVehicleTypes, typesFixture],
    ["media_path", encyclopediaClient.getMediaPath, mediaFixture],
  ] as const)(
    "validates and unwraps %s",
    async (endpoint, fetchData, fixture) => {
      server.use(
        http.get(`${baseUrl}/${endpoint}/`, () => HttpResponse.json(fixture)),
      );

      expect(await fetchData()).toEqual(fixture.data);
    },
  );

  it("reports HTTP errors before attempting JSON parsing", async () => {
    server.use(
      http.get(
        `${baseUrl}/vehicles/`,
        () => new HttpResponse("Unavailable", { status: 503 }),
      ),
    );

    const request = encyclopediaClient.getVehicles();
    await expect(request).rejects.toBeInstanceOf(HttpError);
    await expect(request).rejects.toMatchObject({ status: 503 });
  });

  it("rejects API errors returned with HTTP 200", async () => {
    server.use(
      http.get(`${baseUrl}/vehicles/`, () =>
        HttpResponse.json({
          status: "error",
          error: { message: "Unavailable" },
        }),
      ),
    );

    await expect(encyclopediaClient.getVehicles()).rejects.toBeInstanceOf(
      EncyclopediaApiError,
    );
  });

  it("rejects malformed vehicle fields instead of caching invalid data", async () => {
    const vehicle = Object.values(vehiclesFixture.data)[0];
    server.use(
      http.get(`${baseUrl}/vehicles/`, () =>
        HttpResponse.json({
          status: "ok",
          data: { "123": { ...vehicle, level: "5" } },
        }),
      ),
    );

    await expect(encyclopediaClient.getVehicles()).rejects.toBeInstanceOf(
      z.ZodError,
    );
  });

  it("rejects unexpected response envelopes", async () => {
    server.use(
      http.get(`${baseUrl}/nations/`, () =>
        HttpResponse.json({
          status: "unexpected",
          data: nationsFixture.data,
        }),
      ),
    );

    await expect(encyclopediaClient.getNations()).rejects.toBeInstanceOf(
      z.ZodError,
    );
  });

  it("propagates malformed JSON errors", async () => {
    server.use(
      http.get(`${baseUrl}/vehicles/`, () => new HttpResponse("not json")),
    );

    await expect(encyclopediaClient.getVehicles()).rejects.toBeInstanceOf(
      SyntaxError,
    );
  });

  it("propagates network failures", async () => {
    server.use(http.get(`${baseUrl}/vehicles/`, () => HttpResponse.error()));

    await expect(encyclopediaClient.getVehicles()).rejects.toBeInstanceOf(
      TypeError,
    );
  });

  it("passes cancellation through to fetch", async () => {
    let signalStarted!: () => void;
    let releaseResponse!: () => void;
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    const released = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get(`${baseUrl}/vehicles/`, async () => {
        signalStarted();
        await released;
        return HttpResponse.json(vehiclesFixture);
      }),
    );
    const controller = new AbortController();
    const request = encyclopediaClient.getVehicles(controller.signal);
    const assertion = expect(request).rejects.toMatchObject({
      name: "AbortError",
    });
    await started;
    controller.abort();
    releaseResponse();

    await assertion;
  });
});

describe("ship selectors", () => {
  const vehicles = vehiclesResponseSchema.parse(vehiclesFixture).data;

  it("keeps record IDs and searches display names case-insensitively", () => {
    const ships = selectShips(vehicles, { search: "  hILL  " });
    expect(ships).toHaveLength(1);
    expect(ships[0].localization.mark.en).toBe("Hill");
    expect(vehicles[ships[0].id]).toEqual(
      Object.values(vehicles).find((ship) => ship.name === ships[0].name),
    );
  });

  it("combines nation, tier, and class filters using class tags", () => {
    expect(
      selectShips(vehicles, {
        nations: ["japan"],
        levels: [10],
        types: ["Battleship"],
      }),
    ).toHaveLength(1);
    expect(
      selectShips(vehicles, { nations: ["japan"], types: ["Destroyer"] }),
    ).toHaveLength(0);
    expect(selectShips(vehicles, { levels: [] })).toHaveLength(2);
    expect(selectShips(vehicles, { nations: [] })).toHaveLength(0);
    expect(selectShips(vehicles, { types: [] })).toHaveLength(0);
  });

  it("supports IDs and technical names without mutating the catalogue", () => {
    const original = structuredClone(vehicles);
    const [id, vehicle] = Object.entries(vehicles)[0];
    expect(selectShips(vehicles, { search: id })[0].id).toBe(id);
    expect(selectShips(vehicles, { search: vehicle.name })[0].id).toBe(id);
    expect(vehicles).toEqual(original);
    expect(selectShips({})).toEqual([]);
  });

  it("resolves CDN icons beneath the media path, with or without its trailing slash", () => {
    expect(resolveMediaUrl(mediaFixture.data, "vehicle/small/ship.png")).toBe(
      "https://wows-gloss-icons.wgcdn.co/icons/vehicle/small/ship.png",
    );
    expect(
      resolveMediaUrl(mediaFixture.data.slice(0, -1), "vehicle/small/ship.png"),
    ).toBe("https://wows-gloss-icons.wgcdn.co/icons/vehicle/small/ship.png");
  });
});

it("shares the vehicle cache across consumers, filters, and sorting without refetching", async () => {
  let requests = 0;
  server.use(
    http.get(`${baseUrl}/vehicles/`, () => {
      requests += 1;
      return HttpResponse.json(vehiclesFixture);
    }),
  );

  function ShipList({ search, sort }: { search: string; sort?: FleetSort }) {
    const ships = useShipsQuery({ search }, sort);
    const vehicles = useVehiclesQuery();
    const shipCount = useShipCountQuery();
    return (
      <>
        <p>Catalogue: {Object.keys(vehicles.data ?? {}).length}</p>
        <p>Total ships: {shipCount.data}</p>
        <ul>
          {ships.data?.map((ship) => (
            <li key={ship.id}>{ship.localization.mark.en}</li>
          ))}
        </ul>
      </>
    );
  }

  const { rerender, queryClient } = renderWithProviders(
    <ShipList search="Hill" />,
  );
  expect(await screen.findByText("Hill")).toBeInTheDocument();
  expect(screen.getByText("Catalogue: 2")).toBeInTheDocument();
  expect(screen.getByText("Total ships: 2")).toBeInTheDocument();
  rerender(<ShipList search="Yamato" />);
  expect(await screen.findByText("Yamato")).toBeInTheDocument();
  expect(screen.queryByText("Hill")).not.toBeInTheDocument();
  expect(screen.getByText("Total ships: 2")).toBeInTheDocument();
  for (const [sort, expected] of [
    ["tier-desc", ["Yamato", "Hill"]],
    ["tier-asc", ["Hill", "Yamato"]],
    ["name", ["Hill", "Yamato"]],
  ] as const) {
    rerender(<ShipList search="" sort={sort} />);
    await waitFor(() => {
      expect(
        screen.getAllByRole("listitem").map((ship) => ship.textContent),
      ).toEqual(expected);
    });
  }
  expect(requests).toBe(1);
  expect(queryClient.getQueryData(encyclopediaKeys.vehicles())).toEqual(
    vehiclesFixture.data,
  );
  queryClient.clear();
});
