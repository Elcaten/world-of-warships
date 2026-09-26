import type { MediaPath, Vehicle, Vehicles } from './schemas'

export type Ship = Vehicle & {
  id: string
  vehicleType: string
  isPremium: boolean
}

const vehicleTypeTags = new Set([
  'AirCarrier',
  'Battleship',
  'Cruiser',
  'Destroyer',
  'Submarine',
])

export interface ShipFilters {
  search?: string
  nations?: readonly string[]
  types?: readonly string[]
  levels?: readonly number[]
}

// Filters are local: these endpoints return full catalogues, not search pages.
// Omitted filters mean all values; empty nations/types mean none.
// Different filter categories are ANDed; empty levels still mean all tiers.
export function selectShips(
  vehicles: Vehicles,
  filters: ShipFilters = {},
): Ship[] {
  const search = filters.search?.trim().toLowerCase() ?? ''

  return Object.entries(vehicles)
    .filter(([id, ship]) => {
      const matchesSearch = !search || [
        id,
        ship.name,
        ship.localization.mark.en,
        ship.localization.shortmark.en,
      ].some((name) => name?.toLowerCase().includes(search))

      return matchesSearch &&
        (!filters.nations || filters.nations.includes(ship.nation)) &&
        (!filters.levels?.length || filters.levels.includes(ship.level)) &&
        (!filters.types || filters.types.some((type) => ship.tags.includes(type)))
    })
    .map(([id, ship]) => ({
      ...ship,
      id,
      // Each ship has exactly one vehicle type tag.
      vehicleType: ship.tags.find((tag) => vehicleTypeTags.has(tag))!,
      isPremium: ship.tags.includes('uiPremium'),
    }))
}

// Use CDN icon fields (small/medium/large/etc.), not game-local `local_*` paths.
export function resolveMediaUrl(mediaPath: MediaPath, iconPath: string): string {
  return new URL(iconPath, mediaPath.replace(/\/?$/, '/')).href
}
