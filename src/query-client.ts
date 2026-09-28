import { QueryClient } from "@tanstack/react-query";
import { catalogueCache, encyclopediaKeys } from "@/api/encyclopedia/queries";

export function createQueryClient() {
  const client = new QueryClient();
  // Hydrated queries need these defaults before any hooks mount.
  client.setQueryDefaults(encyclopediaKeys.all, catalogueCache);
  return client;
}

export const queryClient = createQueryClient();
