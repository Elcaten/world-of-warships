import {
  resolveMediaUrl,
  type Nation,
  type Ship,
  type VehicleType,
} from "@/api/encyclopedia";
import { TableCell } from "@/components/ui/table";
import { shipName, tierLabel } from "@/lib/ships";
import { memo, useState } from "react";

type ShipTableCellsProps = {
  ship: Ship;
  nation?: Nation;
  vehicleType?: VehicleType;
  mediaPath: string;
  onViewDetails: (ship: Ship) => void;
};

export const ShipTableCells = memo(function ShipTableCells({
  ship,
  nation,
  vehicleType,
  mediaPath,
  onViewDetails,
}: ShipTableCellsProps) {
  const displayName = shipName(ship);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-3">
          {/* Keep text wrapping and row height stable while the image loads. */}
          <div className="relative hidden h-8 w-24 shrink-0 sm:block">
            <div
              className={`absolute bottom-2 h-1 w-full bg-slate-200 ${isImageLoaded ? "invisible" : ""}`}
            />
            <img
              src={resolveMediaUrl(mediaPath, ship.icons.contour_alive)}
              alt=""
              className={`absolute inset-0 size-full object-contain ${isImageLoaded ? "" : "invisible"}`}
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
          <button
            type="button"
            aria-label={`View details for ${displayName}`}
            aria-haspopup="dialog"
            className={`font-heading hover:text-fleet-cyan min-w-0 truncate text-left text-base font-semibold uppercase ${ship.isPremium ? "text-fleet-gold" : ""}`}
            onClick={() => onViewDetails(ship)}
          >
            {displayName}
          </button>
        </div>
      </TableCell>

      <TableCell>
        <span className="flex items-center justify-start gap-4">
          {nation && (
            <img
              src={resolveMediaUrl(mediaPath, nation.icons.tiny)}
              alt={`${nation.localization.mark.en ?? nation.name} flag`}
              className="h-8 w-12 shrink-0 object-contain sm:hidden md:block"
              aria-hidden="true"
            />
          )}
          <span className="hidden whitespace-nowrap sm:inline">
            {nation?.localization.mark.en ?? ship.nation}
          </span>
        </span>
      </TableCell>

      <TableCell>
        {vehicleType && (
          <div className="flex items-center justify-end">
            <img
              src={resolveMediaUrl(mediaPath, vehicleType.icons.default)}
              alt={vehicleType.localization.mark.en ?? ship.vehicleType}
              className="size-6 object-contain"
              aria-hidden="true"
            />
          </div>
        )}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-start">
          <span className="font-heading text-base font-semibold">
            {tierLabel(ship.level)}
          </span>
        </div>
      </TableCell>
    </>
  );
});
