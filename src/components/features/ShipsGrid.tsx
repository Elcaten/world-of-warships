import type { Nations, Ship, VehicleTypes } from "@/api/encyclopedia";
import { ShipCard } from "@/components/domain/ShipCard";
import { useCallback, useMemo } from "react";
import { VirtuosoGrid, type GridComponents } from "react-virtuoso";

const components: GridComponents = {
  ScrollSeekPlaceholder: () => (
    <div
      className={
        "bg-fleet-panel border-fleet-line relative h-56 animate-pulse border-2"
      }
    >
      <div className="m-auto flex size-48">
        <div className="flex-1 bg-[#000091]/5"></div>
        <div className="flex-1 bg-white/5"></div>
        <div className="flex-1 bg-[#E1000F]/5"></div>
      </div>
      <div className="font-heading absolute bottom-2 left-4 text-xl font-bold text-slate-500 uppercase">
        VESSEL
      </div>
    </div>
  ),
};

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
      components={components}
      itemContent={itemContent}
      scrollSeekConfiguration={{
        enter: (velocity) => Math.abs(velocity) > 1500,
        exit: (velocity) => Math.abs(velocity) < 300,
      }}
    />
  );
}
