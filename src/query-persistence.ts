import type {
  PersistedClient,
  Persister,
  PersistQueryClientProviderProps,
} from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { encyclopediaKeys } from "@/api/encyclopedia/queries";

const storageKey = "elcaten-encyclopedia-query-cache";

// Based on TanStack Query's IndexedDB persister example:
// https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
export const persister: Persister = {
  async persistClient(client) {
    try {
      await set(storageKey, client);
    } catch {
      // Persistence is optional: quota or access failures must not break queries.
    }
  },
  async restoreClient() {
    try {
      return await get<PersistedClient>(storageKey);
    } catch {
      return undefined;
    }
  },
  async removeClient() {
    try {
      await del(storageKey);
    } catch {
      // Storage may also be unavailable when TanStack discards a broken cache.
    }
  },
};

export const persistOptions: PersistQueryClientProviderProps["persistOptions"] =
  {
    persister,
    maxAge: Infinity,
    dehydrateOptions: {
      shouldDehydrateMutation: () => false,
      // Keep previously fetched data even when a background refresh fails.
      shouldDehydrateQuery: (query) =>
        encyclopediaKeys.all.every(
          (part, index) => query.queryKey[index] === part,
        ) && query.state.data !== undefined,
    },
  };
