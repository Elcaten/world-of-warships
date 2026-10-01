import {
  useMediaPathQuery,
  useNationsQuery,
  useShipsQuery,
  useVehicleTypesQuery,
  type Ship,
} from "@/api/encyclopedia";
import { ShipsGrid } from "@/components/features/ShipsGrid";
import { ShipsTable } from "@/components/features/ShipTable/ShipsTable";
import { CommandButton } from "@/components/ui/command-button";
import type { FleetQueryState } from "@/lib/useFleetQueryState";
import { useDeferredValue } from "react";
import { FleetError } from "./FleetError";
import { FleetMessage } from "./FleetMessage";
import { FleetPending } from "./FleetPending";

type FleetResultsProps = {
  state: FleetQueryState;
  onReset: () => void;
  onViewDetails: (ship: Ship) => void;
};

export function FleetResults({
  state: { search, types, premium, nations, levels, sort, view },
  onReset,
  onViewDetails,
}: FleetResultsProps) {
  const deferredSearch = useDeferredValue(search);
  const shipsQuery = useShipsQuery(
    { search: deferredSearch, types, premium, nations, levels },
    sort,
  );
  const mediaPathQuery = useMediaPathQuery();
  const nationsQuery = useNationsQuery();
  const vehicleTypesQuery = useVehicleTypesQuery();

  const queries = [shipsQuery, mediaPathQuery, nationsQuery, vehicleTypesQuery];
  const failed = queries.some(
    (query) => query.isError && query.data === undefined,
  );

  if (failed) {
    return (
      <FleetError
        onRetry={() => {
          queries
            .filter((query) => query.isError)
            .forEach((query) => void query.refetch());
        }}
      />
    );
  }

  if (
    shipsQuery.data === undefined ||
    mediaPathQuery.data === undefined ||
    nationsQuery.data === undefined ||
    vehicleTypesQuery.data === undefined
  ) {
    return (
      <div className="mx-auto max-w-4xl">
        <FleetPending view={view} />
      </div>
    );
  }

  const ships = shipsQuery.data;

  return (
    <>
      <div
        className="text-fleet-muted mx-auto max-w-4xl py-4 font-mono text-xs"
        role="status"
      >
        <strong className="text-fleet-text">
          {ships.length.toLocaleString()}
        </strong>{" "}
        {ships.length === 1 ? "ship" : "ships"} found
      </div>
      {ships.length === 0 ? (
        <FleetMessage
          icon="search"
          title="No ships found"
          description="Try another name or adjust your class, premium, nation, and tier filters."
        >
          <CommandButton onClick={onReset}>Clear filters</CommandButton>
        </FleetMessage>
      ) : view === "grid" ? (
        <div className="mx-auto max-w-4xl">
          <ShipsGrid
            ships={ships}
            mediaPath={mediaPathQuery.data}
            nations={nationsQuery.data}
            vehicleTypes={vehicleTypesQuery.data}
            onViewDetails={onViewDetails}
          />
        </div>
      ) : (
        <div className="border-fleet-line bg-fleet-panel -mx-4 max-w-4xl overflow-x-auto overflow-y-hidden sm:mx-auto sm:border">
          <ShipsTable
            ships={ships}
            mediaPath={mediaPathQuery.data}
            nations={nationsQuery.data}
            vehicleTypes={vehicleTypesQuery.data}
            onViewDetails={onViewDetails}
          />
        </div>
      )}
    </>
  );
}
