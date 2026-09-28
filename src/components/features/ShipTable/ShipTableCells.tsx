import {
  resolveMediaUrl,
  useNations,
  useVehicleTypes,
  type Ship,
} from "@/api/encyclopedia";
import { NationFlag } from "@/components/domain/NationFlag";
import { VehicleTypeIcon } from "@/components/domain/VehicleTypeIcon";
import { TableCell } from "@/components/ui/table";
import { shipName, tierLabel } from "@/lib/ships";

type ShipTableCellsProps = {
  ship: Ship;
  mediaPath: string;
  onViewDetails?: (ship: Ship) => void;
};

export function ShipTableCells({
  ship,
  mediaPath,
  onViewDetails,
}: ShipTableCellsProps) {
  const displayName = shipName(ship);
  const nations = useNations();
  const types = useVehicleTypes();
  const nation = nations.data?.find((nation) => nation.name === ship.nation);

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-3">
          <img
            src={resolveMediaUrl(mediaPath, ship.icons.contour_alive)}
            alt=""
            loading="lazy"
            className="h-8 w-24 shrink-0 object-contain"
          />
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
          <NationFlag
            nation={ship.nation}
            size="small"
            className="h-8 w-12 shrink-0 object-contain"
            aria-hidden="true"
          />
          {nation?.localization.mark.en ?? ship.nation}
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            className="size-6 shrink-0 object-contain"
            aria-hidden="true"
          />
          {types.data?.[ship.vehicleType]?.localization.mark.en ??
            ship.vehicleType}
        </span>
      </TableCell>
      <TableCell>
        <span className="font-heading text-base font-semibold">
          {tierLabel(ship.level)}
        </span>
      </TableCell>
    </>
  );
}
