import { sortShips } from "@/lib/ships";
import type { FleetSort } from "@/lib/useFleetQueryState";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { encyclopediaBaseUrl, encyclopediaClient } from "./client";
import type { Vehicles } from "./schemas";
import {
  selectNationNames,
  selectShipCount,
  selectShips,
  selectShipTiers,
  selectVehicleTypeIds,
  type ShipFilters,
} from "./selectors";

export const encyclopediaKeys = {
  all: ["encyclopedia", encyclopediaBaseUrl] as const,
  vehicles: () => [...encyclopediaKeys.all, "vehicles"] as const,
  nations: () => [...encyclopediaKeys.all, "nations"] as const,
  vehicleTypes: () => [...encyclopediaKeys.all, "vehicle-types"] as const,
  mediaPath: () => [...encyclopediaKeys.all, "media-path"] as const,
};

// The vehicle catalogue is large (~20 MB uncompressed). Reuse it across
// screens and filter changes, while allowing explicit invalidation/refetching.
export const catalogueCache = {
  staleTime: 24 * 60 * 60 * 1000,
  gcTime: Infinity,
};

export const vehiclesQueryOptions = () =>
  queryOptions({
    ...catalogueCache,
    queryKey: encyclopediaKeys.vehicles(),
    queryFn: ({ signal }) => encyclopediaClient.getVehicles(signal),
  });

export const nationsQueryOptions = () =>
  queryOptions({
    ...catalogueCache,
    queryKey: encyclopediaKeys.nations(),
    queryFn: ({ signal }) => encyclopediaClient.getNations(signal),
  });

export const vehicleTypesQueryOptions = () =>
  queryOptions({
    ...catalogueCache,
    queryKey: encyclopediaKeys.vehicleTypes(),
    queryFn: ({ signal }) => encyclopediaClient.getVehicleTypes(signal),
  });

export const mediaPathQueryOptions = () =>
  queryOptions({
    ...catalogueCache,
    queryKey: encyclopediaKeys.mediaPath(),
    queryFn: ({ signal }) => encyclopediaClient.getMediaPath(signal),
  });

export const useVehiclesQuery = () => useQuery(vehiclesQueryOptions());
export const useNationsQuery = () => useQuery(nationsQueryOptions());
export const useVehicleTypesQuery = () => useQuery(vehicleTypesQueryOptions());
export const useMediaPathQuery = () => useQuery(mediaPathQueryOptions());

export const useShipCountQuery = () =>
  useQuery({ ...vehiclesQueryOptions(), select: selectShipCount });

export const useShipTiersQuery = () =>
  useQuery({ ...vehiclesQueryOptions(), select: selectShipTiers });

export const useNationNamesQuery = () =>
  useQuery({ ...nationsQueryOptions(), select: selectNationNames });

export const useVehicleTypeIdsQuery = () =>
  useQuery({ ...vehicleTypesQueryOptions(), select: selectVehicleTypeIds });

export function useShipsQuery(filters: ShipFilters = {}, sort?: FleetSort) {
  const { search, nations, types, levels } = filters;
  const select = useCallback(
    (vehicles: Vehicles) => {
      const ships = selectShips(vehicles, { search, nations, types, levels });
      return sort ? sortShips(ships, sort) : ships;
    },
    [search, nations, types, levels, sort],
  );

  return useQuery({ ...vehiclesQueryOptions(), select });
}
