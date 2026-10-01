import {
  useNationNamesQuery,
  useShipTiersQuery,
  useVehicleTypeIdsQuery,
  type Ship,
} from "@/api/encyclopedia";
import { AppHeader } from "@/components/features/AppHeader";
import { FleetToolbar } from "@/components/features/FleetToolbar";
import { ShipDetailsDialog } from "@/components/features/ShipDetailsDialog";
import { ShipFilters } from "@/components/features/ShipFilters";
import { useFleetQueryState } from "@/lib/useFleetQueryState";
import { useCallback, useState } from "react";
import { FleetResults } from "./FleetResults";

export default function App() {
  const tiersQuery = useShipTiersQuery();
  const nationNamesQuery = useNationNamesQuery();
  const vehicleTypeIdsQuery = useVehicleTypeIdsQuery();
  const { state, update, reset } = useFleetQueryState({
    types: vehicleTypeIdsQuery.data,
    nations: nationNamesQuery.data,
    levels: tiersQuery.data,
  });
  const { search, sort, view } = state;

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
            onSearchChange={(search) => update({ search })}
            sort={sort}
            onSortChange={(sort) => update({ sort })}
            view={view}
            onViewChange={(view) => update({ view })}
            onReset={reset}
          />
          <ShipFilters value={state} onChange={update} />
        </section>
        <FleetResults
          state={state}
          detailsOpen={detailsOpen}
          onReset={reset}
          onViewDetails={showDetails}
        />
        <ShipDetailsDialog
          ship={selectedShip}
          open={detailsOpen}
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
