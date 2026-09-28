import { useCallback } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { encyclopediaBaseUrl, encyclopediaClient } from "./client";
import { selectShips, type ShipFilters } from "./selectors";
import type { Vehicles } from "./schemas";

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

export const useVehicles = () => useQuery(vehiclesQueryOptions());
export const useNations = () => useQuery(nationsQueryOptions());
export const useVehicleTypes = () => useQuery(vehicleTypesQueryOptions());
export const useMediaPath = () => useQuery(mediaPathQueryOptions());

export function useShips(filters: ShipFilters = {}) {
  const { search, nations, types, levels } = filters;
  const select = useCallback(
    (vehicles: Vehicles) =>
      selectShips(vehicles, { search, nations, types, levels }),
    [search, nations, types, levels],
  );

  return useQuery({ ...vehiclesQueryOptions(), select });
}
