import type { Ship } from "@/api/encyclopedia";
import type { FleetSort } from "./useFleetQueryState";

export const shipName = (ship: Ship) =>
  ship.localization.shortmark.en || ship.localization.mark.en || ship.name;

export function sortShips(ships: readonly Ship[], sort: FleetSort): Ship[] {
  return [...ships].sort((a, b) => {
    switch (sort) {
      case "name":
        return shipName(a).localeCompare(shipName(b));
      case "tier-desc":
        return b.level - a.level || shipName(a).localeCompare(shipName(b));
      case "tier-asc":
        return a.level - b.level || shipName(a).localeCompare(shipName(b));
    }
  });
}

export const tierLabel = (tier: number) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"][
    tier
  ] ?? String(tier);
