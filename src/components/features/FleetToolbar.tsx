import { CommandButton } from "@/components/ui/command-button";
import { Icon } from "@/components/ui/icon";
import { Listbox, ListboxOption } from "@/components/ui/listbox";
import type { FleetSort, FleetView } from "@/lib/useFleetQueryState";
import { useRef, type ReactNode } from "react";

export type { FleetSort, FleetView } from "@/lib/useFleetQueryState";

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <form
        className="basis-full md:flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          searchInputRef.current?.blur();
        }}
      >
        <label className="bg-fleet-deep focus-within:ring-fleet-cyan flex items-center gap-3 px-3 focus-within:ring-1">
          <Icon name="search" className="text-fleet-highlight shrink-0" />
          <input
            ref={searchInputRef}
            className="placeholder:text-fleet-muted w-full min-w-0 bg-transparent py-3 text-sm focus-visible:outline-none"
            type="search"
            enterKeyHint="done"
            aria-label="Search ships"
            placeholder="Search by ship name or designation…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      </form>
      <div className="bg-fleet-deep flex items-center gap-2 pl-3 font-mono text-xs">
        <span className="text-fleet-muted uppercase">Sort</span>
        <Listbox aria-label="Sort ships" value={sort} onChange={onSortChange}>
          <ListboxOption value="tier-desc">Tier: high to low</ListboxOption>
          <ListboxOption value="tier-asc">Tier: low to high</ListboxOption>
          <ListboxOption value="name">Name: A to Z</ListboxOption>
        </Listbox>
      </div>
      <div
        className="bg-fleet-deep flex p-1"
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
      className="text-fleet-muted aria-pressed:bg-fleet-line aria-pressed:text-fleet-highlight flex items-center gap-2 p-2 font-mono text-xs uppercase"
      aria-label={view === "grid" ? "Grid view" : "Table view"}
      aria-pressed={view === selected}
      onClick={() => onChange(view)}
    >
      {children}
    </button>
  );
}
