import { useCallback, useEffect, useMemo, useState } from "react";
import { arraysEqual } from "./arraysEqual";

export type FleetSort = "tier-desc" | "tier-asc" | "name";
export type FleetView = "grid" | "table";

export type FleetQueryState = {
  search: string;
  types: string[] | undefined;
  premium: boolean[] | undefined;
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
  "premium",
  "nation",
  "tier",
  "sort",
  "view",
] as const;

const defaultState: FleetQueryState = {
  search: "",
  types: undefined,
  premium: undefined,
  nations: undefined,
  levels: undefined,
  sort: "tier-desc",
  view: "grid",
};

const fleetSorts = new Set<FleetSort>(["tier-desc", "tier-asc", "name"]);
const fleetViews = new Set<FleetView>(["grid", "table"]);

export function useFleetQueryState(validFilters: ValidFleetFilters) {
  const [state, setState] = useState<FleetQueryState>(readQueryState);
  const normalizedState = useMemo(
    () => normalizeQueryState(state, validFilters),
    [state, validFilters.levels, validFilters.nations, validFilters.types],
  );

  useEffect(() => {
    if (!filtersEqual(state, normalizedState)) {
      setState(normalizedState);
    }
  }, [normalizedState, state]);

  useEffect(() => {
    replaceQueryState(normalizedState);
  }, [normalizedState]);

  const update = useCallback((patch: FleetQueryStatePatch) => {
    setState((current) => ({ ...current, ...patch }));
  }, []);

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
    premium: readStrings(params, "premium")
      ?.filter((value) => value === "true" || value === "false")
      .map((value) => value === "true"),
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
  name: "type" | "premium" | "nation",
): string[] | undefined {
  const values = [...new Set(params.getAll(name).filter(Boolean))];
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
  ];
  return values.length ? values : undefined;
}

function normalizeQueryState(
  state: FleetQueryState,
  validFilters: ValidFleetFilters,
): FleetQueryState {
  return {
    ...state,
    types: retainValidValues(state.types, validFilters.types)?.sort(),
    premium: retainValidValues(state.premium, [false, true])?.sort(),
    nations: retainValidValues(state.nations, validFilters.nations)?.sort(),
    levels: retainValidValues(state.levels, validFilters.levels)?.sort(
      (a, b) => a - b,
    ),
  };
}

function retainValidValues<T extends string | number | boolean>(
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
  state.premium?.forEach((value) => params.append("premium", String(value)));
  state.nations?.forEach((value) => params.append("nation", value));
  state.levels?.forEach((value) => params.append("tier", String(value)));
  if (state.sort !== defaultState.sort) params.set("sort", state.sort);
  if (state.view !== defaultState.view) params.set("view", state.view);

  const search = params.toString();
  const nextSearch = search ? `?${search}` : "";
  if (nextSearch !== window.location.search) {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${nextSearch}${window.location.hash}`,
    );
  }
}

function filtersEqual(a: FleetQueryState, b: FleetQueryState) {
  return (
    arraysEqual(a.types, b.types) &&
    arraysEqual(a.premium, b.premium) &&
    arraysEqual(a.nations, b.nations) &&
    arraysEqual(a.levels, b.levels)
  );
}
