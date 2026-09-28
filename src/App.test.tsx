import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";
import App from "@/App";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import nations from "@/api/encyclopedia/__fixtures__/nations.json";
import types from "@/api/encyclopedia/__fixtures__/vehicle_types_common.json";
import media from "@/api/encyclopedia/__fixtures__/media_path.json";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/render";
import { encyclopediaKeys } from "@/api/encyclopedia/queries";

const base = "*/api/encyclopedia/en";
const cards = () =>
  screen.getAllByRole("button", { name: /^View details for/ });

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  server.use(
    http.get(`${base}/vehicles/`, () => HttpResponse.json(vehicles)),
    http.get(`${base}/nations/`, () => HttpResponse.json(nations)),
    http.get(`${base}/vehicle_types_common/`, () => HttpResponse.json(types)),
    http.get(`${base}/media_path/`, () => HttpResponse.json(media)),
  );
});

it("restores the complete fleet view from the query string", async () => {
  const sample = vehicles.data["4276041424"];
  server.use(
    http.get(`${base}/vehicles/`, () =>
      HttpResponse.json({
        status: "ok",
        data: Object.fromEntries(
          Array.from({ length: 25 }, (_, index) => [
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
  window.history.replaceState(
    null,
    "",
    "/?q=Ship&type=Battleship&nation=japan&tier=10&sort=name&view=table&page=2",
  );

  renderWithProviders(<App />);

  await screen.findByRole("button", { name: "View details for Ship 24" });
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
  expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
});

it("syncs controls to the URL and reset removes only managed parameters", async () => {
  window.history.replaceState(null, "", "/catalogue?campaign=fall#fleet");
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
});

it("normalizes invalid query values and follows popstate navigation", async () => {
  window.history.replaceState(
    null,
    "",
    "/?campaign=fall&type=Unknown&type=Battleship&nation=atlantis&nation=japan&tier=no&tier=10&tier=99&sort=wrong&view=wrong&page=-3",
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
    expect(params.has("page")).toBe(false);
    expect(params.get("campaign")).toBe("fall");
  });

  window.history.pushState(null, "", "/?q=Hill&sort=name&view=table");
  window.dispatchEvent(new PopStateEvent("popstate"));

  await waitFor(() => {
    expect(screen.getByRole("searchbox")).toHaveValue("Hill");
    expect(screen.getByRole("combobox", { name: "Sort ships" })).toHaveValue(
      "name",
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
  await waitFor(() => expect(cards()).toHaveLength(1));
  expect(cards()[0]).toHaveAccessibleName("View details for Hill");
});

it("combines class, nation, tier, and search filters and clears an empty result", async () => {
  renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Yamato" });
  fireEvent.click(
    within(screen.getByRole("group", { name: "Class" })).getByRole("button", {
      name: /Battleship/,
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
      { name: "X" },
    ),
  );
  expect(cards()).toHaveLength(1);
  expect(cards()[0]).toHaveAccessibleName("View details for Yamato");
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Hill" },
  });
  expect(await screen.findByText("No ships found")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  await waitFor(() => expect(cards()).toHaveLength(2));
  expect(screen.getByRole("searchbox")).toHaveValue("");
});

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

it("retries a failed catalogue request", async () => {
  let attempts = 0;
  server.use(
    http.get(`${base}/vehicles/`, () =>
      ++attempts === 1
        ? new HttpResponse(null, { status: 503 })
        : HttpResponse.json(vehicles),
    ),
  );
  renderWithProviders(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to load the fleet",
  );
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("button", { name: "View details for Yamato" }),
  ).toBeInTheDocument();
  expect(attempts).toBe(2);
});

it("keeps the fleet visible when a background refresh fails", async () => {
  const { queryClient } = renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Yamato" });
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
});

it("paginates the catalogue and resets to the first page when filtering", async () => {
  const sample = vehicles.data["4276041424"];
  server.use(
    http.get(`${base}/vehicles/`, () =>
      HttpResponse.json({
        status: "ok",
        data: Object.fromEntries(
          Array.from({ length: 25 }, (_, index) => [
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
  renderWithProviders(<App />);
  await screen.findByRole("button", { name: "View details for Ship 00" });
  expect(cards()).toHaveLength(24);
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(cards()).toHaveLength(1);
  expect(cards()[0]).toHaveAccessibleName("View details for Ship 24");
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Ship 00" },
  });
  await waitFor(() =>
    expect(cards()[0]).toHaveAccessibleName("View details for Ship 00"),
  );
  expect(
    screen.queryByRole("navigation", { name: "Fleet pages" }),
  ).not.toBeInTheDocument();
});
