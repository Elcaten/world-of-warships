import type { ReactNode } from "react";
import { CommandButton } from "./ui/command-button";
import { Icon } from "./ui/icon";

export type FleetSort = "tier-desc" | "tier-asc" | "name";
export type FleetView = "grid" | "table";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  sort: FleetSort;
  onSortChange: (value: FleetSort) => void;
  view: FleetView;
  onViewChange: (value: FleetView) => void;
  onReset: () => void;
};

export function FleetToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  onReset,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <label className="flex basis-full items-center gap-3 bg-fleet-deep px-3 focus-within:ring-1 focus-within:ring-fleet-cyan lg:flex-1">
        <Icon name="search" className="shrink-0 text-fleet-highlight" />
        <input
          className="min-w-0 w-full bg-transparent py-3 text-sm placeholder:text-fleet-muted focus-visible:outline-none"
          type="search"
          aria-label="Search ships"
          placeholder="Search by ship name or designation…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 bg-fleet-deep pl-3 font-mono text-xs">
        <span className="text-fleet-muted uppercase">Sort</span>
        <select
          className="bg-fleet-deep p-3"
          aria-label="Sort ships"
          value={sort}
          onChange={(event) => onSortChange(event.target.value as FleetSort)}
        >
          <option value="tier-desc">Tier: high to low</option>
          <option value="tier-asc">Tier: low to high</option>
          <option value="name">Name: A to Z</option>
        </select>
      </label>
      <div
        className="flex bg-fleet-deep p-1"
        role="group"
        aria-label="Display mode"
      >
        <ViewButton view="grid" selected={view} onChange={onViewChange}>
          <Icon name="grid" className="size-4" />
          <span>Grid</span>
        </ViewButton>
        <ViewButton view="table" selected={view} onChange={onViewChange}>
          <Icon name="table" className="size-4" />
          <span>Table</span>
        </ViewButton>
      </div>
      <CommandButton onClick={onReset}>
        <Icon name="reset" />
        Reset
      </CommandButton>
    </div>
  );
}

function ViewButton({
  view,
  selected,
  onChange,
  children,
}: {
  view: FleetView;
  selected: FleetView;
  onChange: (view: FleetView) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 p-2 font-mono text-xs text-fleet-muted uppercase aria-pressed:bg-fleet-line aria-pressed:text-fleet-highlight"
      aria-label={view === "grid" ? "Grid view" : "Table view"}
      aria-pressed={view === selected}
      onClick={() => onChange(view)}
    >
      {children}
    </button>
  );
}
