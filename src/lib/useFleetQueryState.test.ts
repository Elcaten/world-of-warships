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
      `/?q=Yamato&type=Battleship&nation=japan&tier=10&sort=name&view=${initialView}`,
    );
    const { result } = renderHook(() => useFleetQueryState({}));

    act(() => {
      result.current.update({ view });
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      search: "",
      types: undefined,
      nations: undefined,
      levels: undefined,
      sort: "tier-desc",
      view,
    });
    expect(window.location.search).toBe(view === "table" ? "?view=table" : "");
  },
);
