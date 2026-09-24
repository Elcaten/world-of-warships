import type { MediaPath, Vehicle, Vehicles } from './schemas'

export type Ship = Vehicle & { id: string }

export interface ShipFilters {
  search?: string
  nations?: readonly string[]
  types?: readonly string[]
  levels?: readonly number[]
}

// Filters are local: these endpoints return full catalogues, not search pages.
// Empty filter arrays mean all values; different filter categories are ANDed.
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
        (!filters.nations?.length || filters.nations.includes(ship.nation)) &&
        (!filters.levels?.length || filters.levels.includes(ship.level)) &&
        (!filters.types?.length || filters.types.some((type) => ship.tags.includes(type)))
    })
    .map(([id, ship]) => ({ ...ship, id }))
}

// Use CDN icon fields (small/medium/large/etc.), not game-local `local_*` paths.
export function resolveMediaUrl(mediaPath: MediaPath, iconPath: string): string {
  return new URL(iconPath, mediaPath.replace(/\/?$/, '/')).href
}
