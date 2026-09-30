import {
  useMediaPathQuery,
  useNationNamesQuery,
  useNationsQuery,
  useShipsQuery,
  useShipTiersQuery,
  useVehicleTypeIdsQuery,
  useVehicleTypesQuery,
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
import { useFleetQueryState } from "@/lib/useFleetQueryState";
import { useCallback, useDeferredValue, useState } from "react";
import { FleetError } from "./FleetError";
import { FleetMessage } from "./FleetMessage";
import { FleetPending } from "./FleetPending";

export default function App() {
  const mediaPathQuery = useMediaPathQuery();
  const tiersQuery = useShipTiersQuery();
  const nationsQuery = useNationsQuery();
  const nationNamesQuery = useNationNamesQuery();
  const vehicleTypesQuery = useVehicleTypesQuery();
  const vehicleTypeIdsQuery = useVehicleTypeIdsQuery();

  const { state, update, reset } = useFleetQueryState({
    types: vehicleTypeIdsQuery.data,
    nations: nationNamesQuery.data,
    levels: tiersQuery.data,
  });
  const { search, types, nations, levels, sort, view } = state;
  const deferredSearch = useDeferredValue(search);
  const ships = useShipsQuery(
    { search: deferredSearch, types, nations, levels },
    sort,
  );

  const queries = [ships, mediaPathQuery, nationsQuery, vehicleTypesQuery];
  const failed = queries.some(
    (query) => query.isError && query.data === undefined,
  );
  const pending = queries.some((query) => query.isPending);

  const filtersPending =
    tiersQuery.isPending ||
    nationsQuery.isPending ||
    vehicleTypesQuery.isPending;
  const sorted = ships.data ?? [];

  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const showDetails = useCallback((ship: Ship) => {
    setSelectedShip(ship);
    setDetailsOpen(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-384 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <section
          aria-label="Fleet controls"
          className="border-fleet-line bg-fleet-panel -mx-4 max-w-4xl p-4 sm:mx-auto sm:border"
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
            onReset={reset}
          />
          {tiersQuery.data && nationsQuery.data && vehicleTypesQuery.data ? (
            <ShipFilters
              types={types}
              nations={nations}
              levels={levels}
              tiers={tiersQuery.data}
              nationCatalogue={nationsQuery.data}
              vehicleTypes={vehicleTypesQuery.data}
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
                <CommandButton onClick={reset}>Clear filters</CommandButton>
              </FleetMessage>
            ) : view === "grid" ? (
              <div className="mx-auto max-w-4xl">
                <ShipsGrid
                  ships={sorted}
                  mediaPath={mediaPathQuery.data!}
                  nations={nationsQuery.data!}
                  vehicleTypes={vehicleTypesQuery.data!}
                  onViewDetails={showDetails}
                />
              </div>
            ) : (
              <div className="border-fleet-line bg-fleet-panel -mx-4 max-w-4xl overflow-x-auto overflow-y-hidden sm:mx-auto sm:border">
                <ShipsTable
                  ships={sorted}
                  mediaPath={mediaPathQuery.data!}
                  nations={nationsQuery.data!}
                  vehicleTypes={vehicleTypesQuery.data!}
                  onViewDetails={showDetails}
                />
              </div>
            )}
          </>
        )}
        <ShipDetailsDialog
          ship={selectedShip}
          open={detailsOpen}
          mediaPath={mediaPathQuery.data ?? ""}
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
