import media from "@/api/encyclopedia/__fixtures__/media_path.json";
import nations from "@/api/encyclopedia/__fixtures__/nations.json";
import types from "@/api/encyclopedia/__fixtures__/vehicle_types_common.json";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import { encyclopediaKeys } from "@/api/encyclopedia/queries";
import App from "@/components/features/App/App";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/render";
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { VirtuosoGridMockContext, VirtuosoMockContext } from "react-virtuoso";
import { beforeEach, expect, it, vi } from "vitest";

const base = "*/api/encyclopedia/en";
const cards = () =>
  screen.getAllByRole("button", { name: /^View details for/ });

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  window.history.replaceState(null, "", "/");
  server.use(
    http.get(`${base}/vehicles/`, () => HttpResponse.json(vehicles)),
    http.get(`${base}/nations/`, () => HttpResponse.json(nations)),
    http.get(`${base}/vehicle_types_common/`, () => HttpResponse.json(types)),
    http.get(`${base}/media_path/`, () => HttpResponse.json(media)),
  );
});

it("keeps filters noninteractive until the ship catalogue supplies the tiers", async () => {
  let releaseCatalogue!: () => void;
  const catalogueReady = new Promise<void>((resolve) => {
    releaseCatalogue = resolve;
  });
  server.use(
    http.get(`${base}/vehicles/`, async () => {
      await catalogueReady;
      return HttpResponse.json(vehicles);
    }),
  );
  const { queryClient } = renderWithProviders(<App />);

  try {
    const filters = screen.getByRole("region", { name: "Ship filters" });
    expect(filters).toHaveAttribute("aria-busy", "true");
    expect(within(filters).queryByRole("button")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(
        queryClient.getQueryState(encyclopediaKeys.nations())?.status,
      ).toBe("success");
      expect(
        queryClient.getQueryState(encyclopediaKeys.vehicleTypes())?.status,
      ).toBe("success");
    });

    expect(
      screen.getByRole("region", { name: "Ship filters" }),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      within(screen.getByRole("group", { name: "Ship tier" })).queryByRole(
        "button",
      ),
    ).not.toBeInTheDocument();
  } finally {
    releaseCatalogue();
  }

  await screen.findByRole("button", { name: "X" });
  expect(
    screen.getByRole("region", { name: "Ship filters" }),
  ).not.toHaveAttribute("aria-busy", "true");
  expect(screen.getByRole("button", { name: "All hulls" })).toBeEnabled();
});

it("restores table filters from the query string", async () => {
  mockFleet(25);
  window.history.replaceState(
    null,
    "",
    "/?q=Ship&type=Battleship&nation=japan&tier=10&sort=name&view=table",
  );

  renderWithProviders(<App />);

  await screen.findByRole("button", { name: "View details for Ship 00" });
  expect(screen.getByRole("searchbox")).toHaveValue("Ship");
  expect(screen.getByRole("combobox", { name: "Sort ships" })).toHaveValue(
    "name",
  );
  expect(screen.getByRole("button", { name: "Table view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(
    within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
      name: /Battleship/,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    within(screen.getByRole("group", { name: "Nation" })).getByRole("button", {
      name: /Japan/,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    within(screen.getByRole("group", { name: "Ship tier" })).getByRole(
      "button",
      { name: "X" },
    ),
  ).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.queryByRole("navigation", { name: "Fleet pages" }),
  ).not.toBeInTheDocument();
});

it("syncs controls to the URL and reset removes only managed parameters", async () => {
  window.history.replaceState(null, "", "/catalogue?campaign=fall#fleet");
  const historyLength = window.history.length;
  renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Yamato" });

  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "fleet query" },
  });
  fireEvent.click(
    within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
      name: /Destroyer/,
    }),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
      name: /Battleship/,
    }),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Nation" })).getByRole("button", {
      name: /U\.S\.A\./,
    }),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Nation" })).getByRole("button", {
      name: /Japan/,
    }),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Ship tier" })).getByRole(
      "button",
      { name: "V" },
    ),
  );
  fireEvent.click(
    within(screen.getByRole("group", { name: "Ship tier" })).getByRole(
      "button",
      { name: "X" },
    ),
  );
  fireEvent.change(screen.getByRole("combobox", { name: "Sort ships" }), {
    target: { value: "name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Table view" }));

  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get("campaign")).toBe("fall");
    expect(params.get("q")).toBe("fleet query");
    expect(params.getAll("type")).toEqual(["Battleship", "Destroyer"]);
    expect(params.getAll("nation")).toEqual(["japan", "usa"]);
    expect(params.getAll("tier")).toEqual(["5", "10"]);
    expect(params.get("sort")).toBe("name");
    expect(params.get("view")).toBe("table");
  });
  expect(window.location.pathname).toBe("/catalogue");
  expect(window.location.hash).toBe("#fleet");

  fireEvent.click(screen.getByRole("button", { name: "Reset" }));
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect([...params.entries()]).toEqual([["campaign", "fall"]]);
  });
  expect(screen.getByRole("searchbox")).toHaveValue("");
  expect(screen.getByRole("combobox", { name: "Sort ships" })).toHaveValue(
    "tier-desc",
  );
  expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(window.history.length).toBe(historyLength);
});

it("normalizes invalid query values on mount", async () => {
  window.history.replaceState(
    null,
    "",
    "/?campaign=fall&type=Unknown&type=Battleship&nation=atlantis&nation=japan&tier=no&tier=10&tier=99&sort=wrong&view=wrong",
  );
  renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Yamato" });

  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.getAll("type")).toEqual(["Battleship"]);
    expect(params.getAll("nation")).toEqual(["japan"]);
    expect(params.getAll("tier")).toEqual(["10"]);
    expect(params.has("sort")).toBe(false);
    expect(params.has("view")).toBe(false);
    expect(params.get("campaign")).toBe("fall");
  });
  expect(window.scrollTo).not.toHaveBeenCalled();

  expect(screen.getByRole("combobox", { name: "Sort ships" })).toHaveValue(
    "tier-desc",
  );
  expect(screen.getByRole("button", { name: "Grid view" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(cards()).toHaveLength(1);
  expect(cards()[0]).toHaveAccessibleName("View details for Yamato");
});

it.each(["grid", "table"])(
  "combines filters and clears an empty result in %s view",
  async (view) => {
    window.history.replaceState(null, "", `/?view=${view}`);
    renderWithProviders(<App />);
    await screen.findByRole("button", { name: "View details for Yamato" });
    fireEvent.click(
      within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
        name: /Battleship/,
      }),
    );
    fireEvent.click(
      within(screen.getByRole("group", { name: "Nation" })).getByRole(
        "button",
        {
          name: /Japan/,
        },
      ),
    );
    fireEvent.click(
      within(screen.getByRole("group", { name: "Ship tier" })).getByRole(
        "button",
        { name: "X" },
      ),
    );
    expect(cards()).toHaveLength(1);
    expect(cards()[0]).toHaveAccessibleName("View details for Yamato");
    expect(screen.getByText("2 ships in the encyclopedia")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Hill" },
    });
    expect(await screen.findByText("No ships found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(screen.getByRole("searchbox")).toHaveValue("");
  },
);

it("sorts both views and opens a real ship profile with a working close control", async () => {
  renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Yamato" });
  expect(cards()[0]).toHaveAccessibleName("View details for Yamato");
  fireEvent.change(screen.getByRole("combobox", { name: "Sort ships" }), {
    target: { value: "name" },
  });
  expect(cards()[0]).toHaveAccessibleName("View details for Hill");
  fireEvent.click(screen.getByRole("button", { name: "Table view" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(cards()[0]).toHaveAccessibleName("View details for Hill");
  fireEvent.click(
    screen.getByRole("button", { name: "View details for Yamato" }),
  );
  const dialog = await screen.findByRole("dialog", { name: "Yamato" });
  expect(
    within(dialog).getByText(/The preliminary draft design/).textContent,
  ).toBe(vehicles.data["4276041424"].localization.description.en);
  expect(within(dialog).queryByText("Premium")).not.toBeInTheDocument();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Close ship details" }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getAllByText("Premium")).toHaveLength(1);
});

it("shows a ship's medium image behind its large profile image", async () => {
  renderWithProviders(<App />);
  const card = await screen.findByRole("button", {
    name: "View details for Yamato",
  });
  fireEvent.click(card);

  const dialog = await screen.findByRole("dialog", { name: "Yamato" });
  const mediumImageUrl = new URL(
    vehicles.data["4276041424"].icons.medium,
    media.data,
  ).href;
  const largeImageUrl = new URL(
    vehicles.data["4276041424"].icons.large,
    media.data,
  ).href;

  expect(dialog.querySelector(`img[src="${mediumImageUrl}"]`)).toHaveAttribute(
    "alt",
    "",
  );
  expect(within(dialog).getByRole("img", { name: "Yamato" })).toHaveAttribute(
    "src",
    largeImageUrl,
  );
});

it.each([
  ["vehicles", vehicles],
  ["nations", nations],
  ["vehicle_types_common", types],
] as const)(
  "clears filter skeletons and retries a failed %s request",
  async (endpoint, fixture) => {
    let attempts = 0;
    server.use(
      http.get(`${base}/${endpoint}/`, () =>
        ++attempts === 1
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json(fixture),
      ),
    );
    renderWithProviders(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load the fleet",
    );
    expect(
      screen.queryByRole("region", { name: "Ship filters" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("button", { name: "View details for Yamato" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "X" })).toBeEnabled();
    expect(attempts).toBe(2);
  },
);

it.each(["grid", "table"])(
  "keeps the fleet visible when a background refresh fails in %s view",
  async (view) => {
    window.history.replaceState(null, "", `/?view=${view}`);
    const { queryClient } = renderWithProviders(<App />);
    await screen.findByRole("button", { name: "View details for Yamato" });
    expect(window.scrollTo).not.toHaveBeenCalled();
    server.use(
      http.get(
        `${base}/vehicles/`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );

    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: encyclopediaKeys.vehicles(),
      });
    });

    expect(queryClient.getQueryState(encyclopediaKeys.vehicles())?.status).toBe(
      "error",
    );
    expect(
      screen.getByRole("button", { name: "View details for Yamato" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Unable to load the fleet"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Ship filters" }),
    ).not.toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "X" })).toBeEnabled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  },
);

function mockFleet(count: number) {
  const sample = vehicles.data["4276041424"];
  server.use(
    http.get(`${base}/vehicles/`, () =>
      HttpResponse.json({
        status: "ok",
        data: Object.fromEntries(
          Array.from({ length: count }, (_, index) => [
            String(index),
            {
              ...sample,
              name: `Ship ${index}`,
              localization: {
                ...sample.localization,
                shortmark: { en: `Ship ${String(index).padStart(2, "0")}` },
              },
            },
          ]),
        ),
      }),
    ),
  );
}

it("renders the complete table beyond the old page size with semantic headings and cells", async () => {
  mockFleet(25);
  window.history.replaceState(null, "", "/?view=table");
  const { queryClient } = renderWithProviders(
    <VirtuosoMockContext.Provider
      value={{ viewportHeight: 2000, itemHeight: 64 }}
    >
      <App />
    </VirtuosoMockContext.Provider>,
  );
  await screen.findByRole("button", { name: "View details for Ship 24" });
  const table = within(screen.getByRole("table"));
  expect(
    table.getAllByRole("columnheader").map((header) => header.textContent),
  ).toEqual(["Ship", "Nation", "Type", "Tier"]);
  expect(
    table
      .getAllByRole("columnheader")
      .every((header) => header.getAttribute("scope") === "col"),
  ).toBe(true);
  expect(cards()).toHaveLength(25);
  expect(cards()[0]).toHaveAccessibleName("View details for Ship 00");
  expect(cards()[24]).toHaveAccessibleName("View details for Ship 24");
  expect(table.getAllByRole("row")).toHaveLength(26);
  expect(table.getAllByRole("cell")).toHaveLength(100);
  const firstRowCells = within(table.getAllByRole("row")[1]).getAllByRole(
    "cell",
  );
  const contourImages = firstRowCells[0].querySelectorAll("img");
  expect(contourImages).toHaveLength(1);
  expect(contourImages[0]).toHaveAttribute(
    "src",
    new URL(
      vehicles.data["4276041424"].icons.contour_alive,
      media.data,
    ).href,
  );
  expect(firstRowCells[1]).toHaveTextContent("Japan");
  expect(firstRowCells[1].querySelector("img")).toHaveAttribute(
    "src",
    new URL(nations.data[0].icons.small, media.data).href,
  );
  expect(firstRowCells[2]).toHaveTextContent("Battleship");
  expect(firstRowCells[2].querySelector("img")).toHaveAttribute(
    "src",
    new URL(types.data.Battleship.icons.default, media.data).href,
  );
  // App, the details dialog, and filter icons subscribe; table rows add none.
  expect(
    queryClient
      .getQueryCache()
      .find({ queryKey: encyclopediaKeys.nations() })
      ?.getObserversCount(),
  ).toBe(nations.data.length + 2);
  expect(
    queryClient
      .getQueryCache()
      .find({ queryKey: encyclopediaKeys.vehicleTypes() })
      ?.getObserversCount(),
  ).toBe(Object.keys(types.data).length + 2);
  expect(
    queryClient
      .getQueryCache()
      .find({ queryKey: encyclopediaKeys.mediaPath() })
      ?.getObserversCount(),
  ).toBe(nations.data.length + Object.keys(types.data).length + 1);
  expect(screen.getByRole("status")).toHaveTextContent(/^25 ships found$/);
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Ship 00" },
  });
  await waitFor(() => expect(cards()).toHaveLength(1));
  expect(cards()[0]).toHaveAccessibleName("View details for Ship 00");
  expect(
    screen.queryByRole("navigation", { name: "Fleet pages" }),
  ).not.toBeInTheDocument();
});

it("shows grid results beyond the old page size and preserves unrelated URL settings", async () => {
  mockFleet(25);
  window.history.replaceState(null, "", "/?campaign=fall#fleet");
  renderWithProviders(
    <VirtuosoGridMockContext.Provider
      value={{
        viewportHeight: 2000,
        viewportWidth: 1200,
        itemHeight: 224,
        itemWidth: 300,
      }}
    >
      <App />
    </VirtuosoGridMockContext.Provider>,
  );

  await screen.findByRole("button", { name: "View details for Ship 24" });
  expect(cards()).toHaveLength(25);
  expect(screen.getByRole("status")).toHaveTextContent("25 ships found");
  expect(screen.getByRole("status")).not.toHaveTextContent("of 25");
  expect(
    screen.queryByRole("navigation", { name: "Fleet pages" }),
  ).not.toBeInTheDocument();
  expect(window.location.search).toBe("?campaign=fall");
  expect(window.location.hash).toBe("#fleet");

  fireEvent.click(screen.getByRole("button", { name: "Table view" }));
  await screen.findByRole("button", { name: "View details for Ship 00" });
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(/^25 ships found$/);
  expect(
    screen.queryByRole("navigation", { name: "Fleet pages" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
  await screen.findByRole("button", { name: "View details for Ship 00" });
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(cards()).toHaveLength(25);
});

it.each(["grid", "table"])(
  "keeps the mounted viewport and buffer bounded as the catalogue grows in %s view",
  async (view) => {
    mockFleet(250);
    window.history.replaceState(null, "", `/?view=${view}`);
    const { queryClient } = renderWithProviders(<App />);
    await screen.findByRole("button", { name: "View details for Ship 00" });
    expect(screen.getByRole("status")).toHaveTextContent("250 ships found");
    const mountedCount = cards().length;
    // Includes the extra rows rendered outside the viewport for smooth scrolling.
    expect(mountedCount).toBeLessThan(250);
    expect(
      screen.queryByRole("button", { name: "View details for Ship 249" }),
    ).not.toBeInTheDocument();

    mockFleet(1000);
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: encyclopediaKeys.vehicles(),
      });
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("1,000 ships found"),
    );
    expect(cards()).toHaveLength(mountedCount);
    expect(
      screen.queryByRole("button", { name: "View details for Ship 999" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Fleet pages" }),
    ).not.toBeInTheDocument();
  },
);

it.each(["grid", "table"])(
  "does not force scrolling for controls, details, or refreshes in %s view",
  async (view) => {
    window.history.replaceState(null, "", `/?view=${view}`);
    const { queryClient } = renderWithProviders(<App />);
    const yamato = await screen.findByRole("button", {
      name: "View details for Yamato",
    });
    expect(window.scrollTo).not.toHaveBeenCalled();

    fireEvent.click(yamato);
    const dialog = await screen.findByRole("dialog", { name: "Yamato" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close ship details" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: encyclopediaKeys.vehicles(),
      });
    });
    expect(window.scrollTo).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole("combobox", { name: "Sort ships" }), {
      target: { value: "name" },
    });
    expect(cards()[0]).toHaveAccessibleName("View details for Hill");
    expect(window.scrollTo).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Hill" },
    });
    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(cards()[0]).toHaveAccessibleName("View details for Hill");
    expect(window.scrollTo).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", {
        name: view === "grid" ? "Table view" : "Grid view",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: view === "grid" ? "Table view" : "Grid view",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(window.scrollTo).not.toHaveBeenCalled();
    fireEvent.click(
      within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
        name: /Destroyer/,
      }),
    );
    expect(
      within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
        name: /Destroyer/,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(window.scrollTo).not.toHaveBeenCalled();
  },
);
