import type { Nations, Ship, VehicleTypes } from "@/api/encyclopedia";
import { ShipCard } from "@/components/domain/ShipCard";
import { useCallback, useMemo } from "react";
import { VirtuosoGrid } from "react-virtuoso";

export function ShipsGrid({
  ships,
  mediaPath,
  nations,
  vehicleTypes,
  onViewDetails,
}: {
  ships: Ship[];
  mediaPath: string;
  nations: Nations;
  vehicleTypes: VehicleTypes;
  onViewDetails: (ship: Ship) => void;
}) {
  const nationsByName = useMemo(
    () => new Map(nations.map((nation) => [nation.name, nation])),
    [nations],
  );
  const itemContent = useCallback(
    (_index: number, ship: Ship) => (
      <ShipCard
        ship={ship}
        nation={nationsByName.get(ship.nation)}
        vehicleType={vehicleTypes[ship.vehicleType]}
        mediaPath={mediaPath}
        onViewDetails={onViewDetails}
      />
    ),
    [mediaPath, nationsByName, onViewDetails, vehicleTypes],
  );

  return (
    <VirtuosoGrid
      useWindowScroll
      data={ships}
      computeItemKey={(_, ship) => ship.id}
      listClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      itemClassName="min-w-0"
      itemContent={itemContent}
      increaseViewportBy={{ top: 800, bottom: 800 }}
    />
  );
}
