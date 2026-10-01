import { test as base, type BrowserContext } from "@playwright/test";
import media from "../src/api/encyclopedia/__fixtures__/media_path.json" with { type: "json" };
import nations from "../src/api/encyclopedia/__fixtures__/nations.json" with { type: "json" };
import types from "../src/api/encyclopedia/__fixtures__/vehicle_types_common.json" with { type: "json" };
import vehicles from "../src/api/encyclopedia/__fixtures__/vehicles.json" with { type: "json" };
import type { Vehicles } from "../src/api/encyclopedia/schemas";

export { expect } from "@playwright/test";

type FleetMock = {
  vehicles: Vehicles;
  vehiclesUnavailable: boolean;
};

// Serve a valid image so image load handlers and layout still run normally.
const image = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#18303d"/><path d="M80 210h480l-60 60H140zM260 160h120v50H260z" fill="#78a6b7"/></svg>`;

export async function mockEncyclopedia(
  context: BrowserContext,
  baseURL: string,
): Promise<FleetMock> {
  const fleet: FleetMock = {
    vehicles: vehicles.data,
    vehiclesUnavailable: false,
  };
  const appOrigin = new URL(baseURL).origin;
  const mediaOrigin = new URL(media.data).origin;
  const catalogues: Record<string, unknown> = {
    nations,
    vehicle_types_common: types,
    media_path: media,
  };

  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    const apiPrefix = "/api/encyclopedia/en/";

    if (url.origin === appOrigin && url.pathname.startsWith(apiPrefix)) {
      const endpoint = url.pathname.slice(apiPrefix.length).replace(/\/$/, "");
      if (endpoint === "vehicles") {
        await route.fulfill(
          fleet.vehiclesUnavailable
            ? { status: 503, body: "Encyclopedia temporarily unavailable" }
            : { json: { status: "ok", data: fleet.vehicles } },
        );
      } else if (Object.hasOwn(catalogues, endpoint)) {
        await route.fulfill({ json: catalogues[endpoint] });
      } else {
        throw new Error(`Unmocked encyclopedia endpoint: ${url.pathname}`);
      }
    } else if (url.origin === mediaOrigin) {
      await route.fulfill({ contentType: "image/svg+xml", body: image });
    } else if (url.hostname === "fonts.googleapis.com") {
      await route.fulfill({ contentType: "text/css", body: "" });
    } else if (url.origin === appOrigin) {
      await route.continue();
    } else {
      // No test should depend on an external service, including font files.
      await route.abort("blockedbyclient");
    }
  });

  return fleet;
}

export const test = base.extend<{ fleet: FleetMock }>({
  fleet: [
    async ({ context, baseURL }, use) => {
      if (!baseURL)
        throw new Error("The E2E server baseURL must be configured");
      await use(await mockEncyclopedia(context, baseURL));
    },
    { auto: true },
  ],
});

export function generateFleet(count: number): Vehicles {
  const samples = Object.values(vehicles.data);
  const classes = Object.keys(types.data);

  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => {
      const sample = samples[index % samples.length];
      const name = `Ship ${String(index).padStart(4, "0")}`;
      return [
        String(9_000_000_000 + index),
        {
          ...sample,
          name: `TEST_${String(index).padStart(4, "0")}`,
          level: (index % 10) + 1,
          nation: nations.data[index % nations.data.length].name,
          tags: [
            classes[Math.floor(index / 2) % classes.length],
            index % 3 === 0 ? "uiPremium" : "upgradeable",
          ],
          localization: {
            mark: { en: name },
            shortmark: { en: name },
            description: { en: `Test profile for ${name}.` },
          },
        },
      ];
    }),
  );
}
