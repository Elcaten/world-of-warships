import type { Ship } from "@/api/encyclopedia";

export const shipName = (ship: Ship) =>
  ship.localization.shortmark.en || ship.localization.mark.en || ship.name;

export const tierLabel = (tier: number) =>
  ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"][
    tier
  ] ?? String(tier);
