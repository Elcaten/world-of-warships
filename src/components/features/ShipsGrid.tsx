import type { Ship } from "@/api/encyclopedia";
import { ShipCard } from "@/components/domain/ShipCard";
import { VirtuosoGrid } from "react-virtuoso";

export function ShipsGrid({
  ships,
  mediaPath,
  onViewDetails,
}: {
  ships: Ship[];
  mediaPath: string;
  onViewDetails: (ship: Ship) => void;
}) {
  return (
    <VirtuosoGrid
      useWindowScroll
      data={ships}
      computeItemKey={(_, ship) => ship.id}
      listClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      itemClassName="min-w-0"
      itemContent={(_, ship) => (
        <ShipCard
          ship={ship}
          mediaPath={mediaPath}
          onViewDetails={onViewDetails}
        />
      )}
      increaseViewportBy={{ top: 800, bottom: 1200 }}
    />
  );
}
