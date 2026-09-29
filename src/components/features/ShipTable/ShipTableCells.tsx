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
  onViewDetails?: (ship: Ship) => void;
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
          <div className="relative h-8 w-24 shrink-0">
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
          {onViewDetails ? (
            <button
              type="button"
              aria-label={`View details for ${displayName}`}
              aria-haspopup="dialog"
              className={`font-heading hover:text-fleet-cyan min-w-0 text-left text-base font-semibold wrap-anywhere uppercase ${ship.isPremium ? "text-fleet-gold" : ""}`}
              onClick={() => onViewDetails(ship)}
            >
              {displayName}
            </button>
          ) : (
            <span className="min-w-0 font-medium wrap-anywhere">
              {displayName}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          {nation && (
            <img
              src={resolveMediaUrl(mediaPath, nation.icons.small)}
              alt={`${nation.localization.mark.en ?? nation.name} flag`}
              className="h-8 w-12 shrink-0 object-contain"
              aria-hidden="true"
            />
          )}
          {nation?.localization.mark.en ?? ship.nation}
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          {vehicleType && (
            <img
              src={resolveMediaUrl(mediaPath, vehicleType.icons.default)}
              alt={vehicleType.localization.mark.en ?? ship.vehicleType}
              className="size-6 shrink-0 object-contain"
              aria-hidden="true"
            />
          )}
          {vehicleType?.localization.mark.en ?? ship.vehicleType}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-heading text-base font-semibold">
          {tierLabel(ship.level)}
        </span>
      </TableCell>
    </>
  );
});
