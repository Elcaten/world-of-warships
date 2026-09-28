import {
  useMediaPath,
  useNationNames,
  useNations,
  useShipCount,
  useShips,
  useShipTiers,
  useVehicleTypeIds,
  useVehicleTypes,
  type Ship,
} from "@/api/encyclopedia";
import { AppHeader } from "@/components/features/AppHeader";
import { FleetToolbar } from "@/components/features/FleetToolbar";
import { ShipDetailsDialog } from "@/components/features/ShipDetailsDialog";
import { ShipFilters } from "@/components/features/ShipFilters";
import { ShipsGrid } from "@/components/features/ShipsGrid";
import { ShipsTable } from "@/components/features/ShipTable/ShipsTable";
import { CommandButton } from "@/components/ui/command-button";
import { sortShips } from "@/lib/ships";
import { useFleetQueryState } from "@/lib/useFleetQueryState";
import { useDeferredValue, useMemo, useState } from "react";
import { FleetError } from "./FleetError";
import { FleetMessage } from "./FleetMessage";
import { FleetPending } from "./FleetPending";

export default function App() {
  const shipCount = useShipCount();
  const media = useMediaPath();
  const nationCatalogue = useNations();
  const vehicleTypes = useVehicleTypes();
  const tiers = useShipTiers();
  const vehicleTypeIds = useVehicleTypeIds();
  const nationNames = useNationNames();

  const { state, update, reset } = useFleetQueryState({
    types: vehicleTypeIds.data,
    nations: nationNames.data,
    levels: tiers.data,
  });
  const { search, types, nations, levels, sort, view } = state;
  const deferredSearch = useDeferredValue(search);
  const ships = useShips({ search: deferredSearch, types, nations, levels });

  const sorted = useMemo(
    () => sortShips(ships.data ?? [], sort),
    [ships.data, sort],
  );

  const queries = [ships, media, nationCatalogue, vehicleTypes];
  const pending = queries.some((query) => query.isPending);
  const failed = queries.some(
    (query) => query.isError && query.data === undefined,
  );

  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  function showDetails(ship: Ship) {
    setSelectedShip(ship);
    setDetailsOpen(true);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-384 flex-1 px-4 py-8 sm:px-6 lg:px-10"
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-fleet-cyan mb-2 font-mono text-xs uppercase">
              World of Warships
            </p>
            <h1 className="font-heading text-3xl font-bold">Fleet roster</h1>
          </div>
          {!pending && !failed && (
            <p className="text-fleet-muted font-mono text-xs">
              {shipCount.data?.toLocaleString()} ships in the
              encyclopedia
            </p>
          )}
        </div>
        <section
          aria-label="Fleet controls"
          className="border-fleet-line bg-fleet-panel border p-4"
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
          {nationCatalogue.data && vehicleTypes.data && (
            <ShipFilters
              types={types}
              nations={nations}
              levels={levels}
              tiers={tiers.data ?? []}
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
          )}
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
              className="text-fleet-muted py-4 font-mono text-xs"
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
                <CommandButton onClick={reset}>
                  Clear filters
                </CommandButton>
              </FleetMessage>
            ) : view === "grid" ? (
              <ShipsGrid
                ships={sorted}
                mediaPath={media.data!}
                onViewDetails={showDetails}
              />
            ) : (
              <ShipsTable
                ships={sorted}
                mediaPath={media.data!}
                onViewDetails={showDetails}
              />
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
