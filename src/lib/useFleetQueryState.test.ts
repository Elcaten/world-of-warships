import { act, renderHook } from "@testing-library/react";
import { expect, it } from "vitest";
import { useFleetQueryState } from "./useFleetQueryState";

it.each(["grid", "table"] as const)(
  "preserves the latest %s view when a view update and reset are batched",
  (view) => {
    const initialView = view === "grid" ? "table" : "grid";
    window.history.replaceState(
      null,
      "",
      `/?q=Yamato&type=Battleship&premium=false&nation=japan&tier=10&sort=name&view=${initialView}`,
    );
    const { result } = renderHook(() => useFleetQueryState({}));

    act(() => {
      result.current.update({ view });
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      search: "",
      types: undefined,
      premium: undefined,
      nations: undefined,
      levels: undefined,
      sort: "tier-desc",
      view,
    });
    expect(window.location.search).toBe(view === "table" ? "?view=table" : "");
  },
);

it.each([
  ["", undefined, ""],
  ["?premium=true", [true], "?premium=true"],
  ["?premium=false", [false], "?premium=false"],
  ["?premium=true&premium=false", [false, true], "?premium=false&premium=true"],
  ["?premium=true&premium=true", [true], "?premium=true"],
  ["?premium=invalid&premium=false", [false], "?premium=false"],
  ["?premium=invalid", undefined, ""],
  ["?premium=", undefined, ""],
] as const)("restores premium from %s", (search, premium, normalizedSearch) => {
  window.history.replaceState(null, "", `/${search}`);
  const { result } = renderHook(() => useFleetQueryState({}));

  expect(result.current.state.premium).toEqual(premium);
  expect(window.location.search).toBe(normalizedSearch);
});

it("syncs every premium selection while preserving unrelated URL values", () => {
  window.history.replaceState(null, "", "/catalogue?campaign=fall#fleet");
  const { result } = renderHook(() => useFleetQueryState({}));

  for (const premium of [[true], [false, true], [false], undefined]) {
    act(() => result.current.update({ premium }));
    expect(result.current.state.premium).toEqual(premium);
    const params = new URLSearchParams(window.location.search);
    expect(params.getAll("premium")).toEqual(premium?.map(String) ?? []);
    expect(params.get("campaign")).toBe("fall");
    expect(window.location.pathname).toBe("/catalogue");
    expect(window.location.hash).toBe("#fleet");
  }
});
