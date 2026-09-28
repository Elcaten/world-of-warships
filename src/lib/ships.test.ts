import { expect, it } from "vitest";
import {
  selectShips,
  vehiclesResponseSchema,
  type Ship,
} from "@/api/encyclopedia";
import vehicles from "@/api/encyclopedia/__fixtures__/vehicles.json";
import { shipName, sortShips } from "./ships";

it.each([
  ["name", ["Alpha", "Bravo", "Zulu"]],
  ["tier-asc", ["Bravo", "Alpha", "Zulu"]],
  ["tier-desc", ["Alpha", "Zulu", "Bravo"]],
] as const)(
  "sorts by %s with alphabetical tier ties without mutating the input",
  (sort, expected) => {
    const [sample] = selectShips(vehiclesResponseSchema.parse(vehicles).data);
    const makeShip = (name: string, level: number): Ship => ({
      ...sample,
      id: name,
      level,
      localization: { ...sample.localization, shortmark: { en: name } },
    });
    const ships = Object.freeze([
      makeShip("Zulu", 10),
      makeShip("Bravo", 5),
      makeShip("Alpha", 10),
    ]);
    const original = structuredClone(ships);

    expect(sortShips(ships, sort).map(shipName)).toEqual(expected);
    expect(ships).toEqual(original);
  },
);
