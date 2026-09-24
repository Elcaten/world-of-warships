import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import nationsFixture from "../api/encyclopedia/__fixtures__/nations.json";
import mediaFixture from "../api/encyclopedia/__fixtures__/media_path.json";
import { renderWithProviders } from "../test/render";
import { server } from "../test/mocks/server";
import { NationFlag } from "./NationFlag";

it("renders the requested flag size using its CDN icon", async () => {
  server.use(
    http.get("*/api/encyclopedia/en/nations/", () => HttpResponse.json(nationsFixture)),
    http.get("*/api/encyclopedia/en/media_path/", () => HttpResponse.json(mediaFixture)),
  );

  const { rerender } = renderWithProviders(<NationFlag nation="japan" className="flag" />);
  const flag = await screen.findByRole("img", { name: "Japan flag" });
  expect(flag).toHaveAttribute(
    "src",
    new URL(nationsFixture.data[0].icons.small, mediaFixture.data).href,
  );
  expect(flag).toHaveClass("flag");

  rerender(<NationFlag nation="japan" size="large" />);
  expect(flag).toHaveAttribute(
    "src",
    new URL(nationsFixture.data[0].icons.large, mediaFixture.data).href,
  );

  rerender(<NationFlag nation="unknown" />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
