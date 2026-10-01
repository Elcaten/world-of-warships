import { selectShips, vehiclesResponseSchema } from "@/api/encyclopedia";
import media from "@/api/encyclopedia/__fixtures__/media_path.json";
import nations from "@/api/encyclopedia/__fixtures__/nations.json";
import types from "@/api/encyclopedia/__fixtures__/vehicle_types_common.json";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ShipCard } from "./ShipCard";

const ships = selectShips(vehiclesResponseSchema.parse(vehicles).data);
const yamato = ships.find((ship) => ship.id === "4276041424")!;
const hill = ships.find((ship) => ship.id === "3765319664")!;

it("renders the correct ship information", () => {
  const onViewDetails = vi.fn();
  const { rerender } = render(
    <ShipCard
      ship={yamato}
      nation={nations.data[0]}
      vehicleType={types.data.Battleship}
      mediaPath={media.data}
      onViewDetails={onViewDetails}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View details for Yamato" }),
  ).toHaveAttribute("aria-haspopup", "dialog");
  expect(screen.getByText("Yamato")).toHaveAttribute("title", "Yamato");
  expect(screen.getByText("X")).toBeInTheDocument();
  expect(screen.queryByText("Premium")).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Japan flag" })).toHaveAttribute(
    "src",
    new URL(nations.data[0].icons.large, media.data).href,
  );
  expect(screen.getByRole("img", { name: "Battleship" })).toHaveAttribute(
    "src",
    new URL(types.data.Battleship.icons.default, media.data).href,
  );
  expect(screen.getByAltText("")).toHaveAttribute(
    "src",
    new URL(yamato.icons.medium, media.data).href,
  );

  rerender(
    <ShipCard
      ship={hill}
      nation={nations.data[1]}
      vehicleType={types.data.Destroyer}
      mediaPath={media.data}
      onViewDetails={onViewDetails}
    />,
  );

  expect(
    screen.getByRole("button", { name: "View details for Hill" }),
  ).toHaveAttribute("aria-haspopup", "dialog");
  expect(screen.getByText("Hill")).toHaveAttribute("title", "Hill");
  expect(screen.getByText("V")).toBeInTheDocument();
  expect(screen.getByText("Premium")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "U.S.A. flag" })).toHaveAttribute(
    "src",
    new URL(nations.data[1].icons.large, media.data).href,
  );
  expect(screen.getByRole("img", { name: "Destroyer" })).toHaveAttribute(
    "src",
    new URL(types.data.Destroyer.icons.premium, media.data).href,
  );
  expect(screen.getByAltText("")).toHaveAttribute(
    "src",
    new URL(hill.icons.medium, media.data).href,
  );
});

it("selecting the card passes the correct ship", () => {
  const onViewDetails = vi.fn();
  render(
    <ShipCard
      ship={yamato}
      mediaPath={media.data}
      onViewDetails={onViewDetails}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "View details for Yamato" }),
  );

  expect(onViewDetails).toHaveBeenCalledExactlyOnceWith(yamato);
  expect(onViewDetails.mock.calls[0][0]).toBe(yamato);
});
