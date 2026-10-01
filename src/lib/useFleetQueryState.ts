import { useCallback, useEffect, useMemo, useState } from "react";
import { arraysEqual } from "./arraysEqual";

export type FleetSort = "tier-desc" | "tier-asc" | "name";
export type FleetView = "grid" | "table";

export type FleetQueryState = {
  search: string;
  types: string[] | undefined;
  nations: string[] | undefined;
  levels: number[] | undefined;
  sort: FleetSort;
  view: FleetView;
};

type FleetQueryStatePatch = Partial<FleetQueryState>;

type ValidFleetFilters = {
  types?: readonly string[];
  nations?: readonly string[];
  levels?: readonly number[];
};

const managedParams = [
  "q",
  "type",
  "nation",
  "tier",
  "sort",
  "view",
  "page", // Strip pagination from legacy links.
] as const;

const defaultState: FleetQueryState = {
  search: "",
  types: undefined,
  nations: undefined,
  levels: undefined,
  sort: "tier-desc",
  view: "grid",
};

const fleetSorts = new Set<FleetSort>(["tier-desc", "tier-asc", "name"]);
const fleetViews = new Set<FleetView>(["grid", "table"]);

export function useFleetQueryState(validFilters: ValidFleetFilters = {}) {
  const [state, setState] = useState<FleetQueryState>(readQueryState);
  const normalizedState = useMemo(
    () => normalizeQueryState(state, validFilters),
    [state, validFilters.levels, validFilters.nations, validFilters.types],
  );

  useEffect(() => {
    if (!queryStatesEqual(state, normalizedState)) {
      setState(normalizedState);
    }
  }, [normalizedState, state]);

  useEffect(() => {
    replaceQueryState(normalizedState);
  }, [normalizedState]);

  const update = useCallback(
    (
      patch:
        | FleetQueryStatePatch
        | ((current: FleetQueryState) => FleetQueryStatePatch),
    ) => {
      setState((current) => ({
        ...current,
        ...(typeof patch === "function" ? patch(current) : patch),
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    setState((current) => ({
      ...defaultState,
      view: current.view,
    }));
  }, []);

  return { state: normalizedState, update, reset };
}

function readQueryState(): FleetQueryState {
  const params = new URLSearchParams(window.location.search);
  const sort = params.get("sort");
  const view = params.get("view");

  return {
    search: params.get("q") ?? defaultState.search,
    types: readStrings(params, "type"),
    nations: readStrings(params, "nation"),
    levels: readLevels(params),
    sort: fleetSorts.has(sort as FleetSort)
      ? (sort as FleetSort)
      : defaultState.sort,
    view: fleetViews.has(view as FleetView)
      ? (view as FleetView)
      : defaultState.view,
  };
}

function readStrings(
  params: URLSearchParams,
  name: "type" | "nation",
): string[] | undefined {
  const values = [...new Set(params.getAll(name).filter(Boolean))].sort();
  return values.length ? values : undefined;
}

function readLevels(params: URLSearchParams): number[] | undefined {
  const values = [
    ...new Set(
      params
        .getAll("tier")
        .map(Number)
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  ].sort((a, b) => a - b);
  return values.length ? values : undefined;
}

function normalizeQueryState(
  state: FleetQueryState,
  validFilters: ValidFleetFilters,
): FleetQueryState {
  return {
    ...state,
    types: retainValidValues(state.types, validFilters.types)?.sort(),
    nations: retainValidValues(state.nations, validFilters.nations)?.sort(),
    levels: retainValidValues(state.levels, validFilters.levels)?.sort(
      (a, b) => a - b,
    ),
  };
}

function retainValidValues<T extends string | number>(
  selected: T[] | undefined,
  valid: readonly T[] | undefined,
): T[] | undefined {
  if (!selected) return undefined;
  if (!valid) return [...selected];
  const allowed = new Set(valid);
  const retained = selected.filter((value) => allowed.has(value));
  return retained.length ? retained : undefined;
}

function replaceQueryState(state: FleetQueryState) {
  const params = new URLSearchParams(window.location.search);
  managedParams.forEach((name) => params.delete(name));

  if (state.search) params.set("q", state.search);
  state.types?.forEach((value) => params.append("type", value));
  state.nations?.forEach((value) => params.append("nation", value));
  state.levels?.forEach((value) => params.append("tier", String(value)));
  if (state.sort !== defaultState.sort) params.set("sort", state.sort);
  if (state.view !== defaultState.view) params.set("view", state.view);

  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}

function queryStatesEqual(a: FleetQueryState, b: FleetQueryState) {
  return (
    a.search === b.search &&
    arraysEqual(a.types, b.types) &&
    arraysEqual(a.nations, b.nations) &&
    arraysEqual(a.levels, b.levels) &&
    a.sort === b.sort &&
    a.view === b.view
  );
}
