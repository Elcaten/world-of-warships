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
    <div className="mb-5 flex flex-wrap items-center gap-2 sm:mb-6 sm:gap-2.5 lg:flex-nowrap">
      <label className="flex min-h-11.5 min-w-45 flex-1 basis-full items-center gap-3 border border-transparent bg-fleet-deep px-3.5 focus-within:border-fleet-cyan sm:basis-[calc(100%-270px)] lg:basis-0">
        <Icon name="search" className="shrink-0 text-fleet-highlight" />
        <input
          className="min-w-0 w-full border-0 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-[#98a8b2] focus-visible:outline-none"
          type="search"
          aria-label="Search ships"
          placeholder="Search by ship name or designation…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="flex min-h-10.5 flex-1 basis-full items-center justify-between gap-2.5 bg-fleet-deep pl-3 font-mono text-xs sm:basis-auto lg:flex-none">
        <span className="text-[10px] text-fleet-muted uppercase">Sort</span>
        <select
          className="max-w-50 bg-fleet-deep px-2 py-2.5"
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
        className="flex flex-1 gap-0.5 bg-fleet-deep p-1 sm:flex-none"
        role="group"
        aria-label="Display mode"
      >
        <button
          className="flex flex-1 items-center justify-center gap-2 px-2.5 py-2 font-mono text-[11px] font-medium text-[#aababc] uppercase aria-pressed:bg-[#1c2c34] aria-pressed:text-fleet-highlight sm:flex-none"
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          onClick={() => onViewChange("grid")}
        >
          <Icon name="grid" className="size-4" />
          <span>Grid</span>
        </button>
        <button
          className="flex flex-1 items-center justify-center gap-2 px-2.5 py-2 font-mono text-[11px] font-medium text-[#aababc] uppercase aria-pressed:bg-[#1c2c34] aria-pressed:text-fleet-highlight sm:flex-none"
          aria-label="Table view"
          aria-pressed={view === "table"}
          onClick={() => onViewChange("table")}
        >
          <Icon name="table" className="size-4" />
          <span>Table</span>
        </button>
      </div>
      <CommandButton onClick={onReset}>
        <Icon name="reset" />
        Reset
      </CommandButton>
    </div>
  );
}
