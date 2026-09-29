import {
  useMediaPath,
  useNations,
  useShips,
  useVehicleTypes,
  type Ship,
} from "@/api/encyclopedia";
import { AppHeader } from "@/components/features/AppHeader";
import { FleetToolbar } from "@/components/features/FleetToolbar";
import { ShipDetailsDialog } from "@/components/features/ShipDetailsDialog";
import {
  ShipFilters,
  ShipFiltersSkeleton,
} from "@/components/features/ShipFilters";
import { ShipsGrid } from "@/components/features/ShipsGrid";
import { ShipsTable } from "@/components/features/ShipTable/ShipsTable";
import { CommandButton } from "@/components/ui/command-button";
import { shipName } from "@/lib/ships";
import { useFleetQueryState } from "@/lib/useFleetQueryState";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FleetError } from "./FleetError";
import { FleetMessage } from "./FleetMessage";
import { FleetPending } from "./FleetPending";

export default function App() {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const catalogue = useShips();
  const media = useMediaPath();
  const nationCatalogue = useNations();
  const vehicleTypes = useVehicleTypes();
  const tiers = useMemo(
    () =>
      [...new Set(catalogue.data?.map((ship) => ship.level))].sort(
        (a, b) => a - b,
      ),
    [catalogue.data],
  );
  const validTypes = useMemo(
    () => (vehicleTypes.data ? Object.keys(vehicleTypes.data) : undefined),
    [vehicleTypes.data],
  );
  const validNations = useMemo(
    () => nationCatalogue.data?.map((nation) => nation.name),
    [nationCatalogue.data],
  );
  const { state, update, reset } = useFleetQueryState({
    types: validTypes,
    nations: validNations,
    levels: catalogue.data ? tiers : undefined,
  });
  const { search, types, nations, levels, sort, view } = state;
  const deferredSearch = useDeferredValue(search);
  const ships = useShips({ search: deferredSearch, types, nations, levels });
  const queries = [ships, media, nationCatalogue, vehicleTypes];
  const failed = queries.some(
    (query) => query.isError && query.data === undefined,
  );
  const pending = queries.some((query) => query.isPending);
  const filtersPending =
    catalogue.isPending || nationCatalogue.isPending || vehicleTypes.isPending;
  const sorted = useMemo(
    () =>
      [...(ships.data ?? [])].sort((a, b) => {
        const byName = shipName(a).localeCompare(shipName(b));
        return sort === "name"
          ? byName
          : (sort === "tier-desc" ? b.level - a.level : a.level - b.level) ||
              byName;
      }),
    [ships.data, sort],
  );
  // Compare query values, not result/array identity, so refreshes preserve scroll.
  const resultKey = JSON.stringify([
    deferredSearch,
    types,
    nations,
    levels,
    sort,
    view,
  ]);
  const previousResultKey = useRef<string | null>(null);
  useEffect(() => {
    if (pending || failed) {
      previousResultKey.current = null;
      return;
    }
    if (
      previousResultKey.current !== null &&
      previousResultKey.current !== resultKey
    ) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    previousResultKey.current = resultKey;
  }, [resultKey, pending, failed]);

  const showDetails = useCallback((ship: Ship) => {
    setSelectedShip(ship);
    setDetailsOpen(true);
  }, []);

  function resetFilters() {
    reset();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-384 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <section
          aria-label="Fleet controls"
          className="border-fleet-line bg-fleet-panel mx-auto max-w-4xl border p-4"
        >
          <FleetToolbar
            search={search}
            onSearchChange={(value) => {
              update({ search: value });
            }}
            sort={sort}
            onSortChange={(value) => {
              update({ sort: value });
            }}
            view={view}
            onViewChange={(value) => update({ view: value })}
            onReset={resetFilters}
          />
          {catalogue.data && nationCatalogue.data && vehicleTypes.data ? (
            <ShipFilters
              types={types}
              nations={nations}
              levels={levels}
              tiers={tiers}
              nationCatalogue={nationCatalogue.data}
              vehicleTypes={vehicleTypes.data}
              onTypesChange={(value) => {
                update({ types: value });
              }}
              onNationsChange={(value) => {
                update({ nations: value });
              }}
              onLevelsChange={(value) => {
                update({ levels: value });
              }}
            />
          ) : !failed && filtersPending ? (
            <ShipFiltersSkeleton />
          ) : null}
        </section>
        {failed ? (
          <FleetError
            onRetry={() => {
              queries
                .filter((query) => query.isError)
                .forEach((query) => void query.refetch());
            }}
          />
        ) : pending ? (
          <FleetPending view={view} />
        ) : (
          <>
            <div
              className="text-fleet-muted mx-auto max-w-4xl py-4 font-mono text-xs"
              role="status"
            >
              <span>
                <strong className="text-fleet-text">
                  {sorted.length.toLocaleString()}
                </strong>{" "}
                {sorted.length === 1 ? "ship" : "ships"} found
              </span>
            </div>
            {sorted.length === 0 ? (
              <FleetMessage
                icon="search"
                title="No ships found"
                description="Try another name or adjust your class, nation, and tier filters."
              >
                <CommandButton onClick={resetFilters}>
                  Clear filters
                </CommandButton>
              </FleetMessage>
            ) : view === "grid" ? (
              // <div className="mx-auto max-w-4xl">
              <ShipsGrid
                ships={sorted}
                mediaPath={media.data!}
                nations={nationCatalogue.data!}
                vehicleTypes={vehicleTypes.data!}
                onViewDetails={showDetails}
              />
            ) : (
              // </div>
              <div className="border-fleet-line bg-fleet-panel -mx-4 max-w-4xl overflow-x-auto overflow-y-hidden sm:mx-auto sm:border">
                <ShipsTable
                  ships={sorted}
                  mediaPath={media.data!}
                  nations={nationCatalogue.data!}
                  vehicleTypes={vehicleTypes.data!}
                  onViewDetails={showDetails}
                />
              </div>
            )}
          </>
        )}
        <ShipDetailsDialog
          ship={selectedShip}
          open={detailsOpen}
          mediaPath={media.data ?? ""}
          onClose={() => setDetailsOpen(false)}
        />
      </main>
      <footer className="border-fleet-line text-fleet-muted mx-auto flex w-full max-w-384 flex-wrap justify-between gap-2 border-t px-4 py-6 font-mono text-xs sm:px-6 lg:px-10">
        <span className="uppercase">Warship Encyclopedia</span>
        <span>Ship data & imagery from World of Warships</span>
      </footer>
    </div>
  );
}
