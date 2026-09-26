import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";
import App from "@/App";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import nations from "@/api/encyclopedia/__fixtures__/nations.json";
import types from "@/api/encyclopedia/__fixtures__/vehicle_types_common.json";
import media from "@/api/encyclopedia/__fixtures__/media_path.json";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/render";

const base = "*/api/encyclopedia/en";
const cards = () =>
  screen.getAllByRole("button", { name: /^View details for/ });

beforeEach(() => {
  server.use(
    http.get(`${base}/vehicles/`, () => HttpResponse.json(vehicles)),
    http.get(`${base}/nations/`, () => HttpResponse.json(nations)),
    http.get(`${base}/vehicle_types_common/`, () => HttpResponse.json(types)),
    http.get(`${base}/media_path/`, () => HttpResponse.json(media)),
  );
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
