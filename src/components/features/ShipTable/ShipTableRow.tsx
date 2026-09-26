import {
  resolveMediaUrl,
  useNations,
  useVehicleTypes,
  type Ship,
} from "@/api/encyclopedia";
import { NationFlag } from "@/components/domain/NationFlag";
import { VehicleTypeIcon } from "@/components/domain/VehicleTypeIcon";
import { TableCell, TableRow } from "@/components/ui/table";
import { shipName, tierLabel } from "@/lib/ships";

type ShipTableRowProps = {
  ship: Ship;
  mediaPath: string;
  className?: string;
  onViewDetails?: (ship: Ship) => void;
};

export function ShipTableRow({
  ship,
  mediaPath,
  className,
  onViewDetails,
}: ShipTableRowProps) {
  const displayName = shipName(ship);
  const nations = useNations();
  const types = useVehicleTypes();
  const nation = nations.data?.find((nation) => nation.name === ship.nation);

  return (
    <TableRow className={className}>
      <TableCell>
        <div className="flex items-center gap-3">
          <img
            src={resolveMediaUrl(mediaPath, ship.icons.contour_alive)}
            alt=""
            loading="lazy"
            className="w-24 object-contain"
          />
          {onViewDetails ? (
            <button
              type="button"
              aria-label={`View details for ${displayName}`}
              aria-haspopup="dialog"
              className={`font-heading hover:text-fleet-cyan text-left text-base font-semibold uppercase ${ship.isPremium ? "text-fleet-gold" : ""}`}
              onClick={() => onViewDetails(ship)}
            >
              {displayName}
            </button>
          ) : (
            <span className="font-medium">{displayName}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <NationFlag
            nation={ship.nation}
            size="small"
            className="h-8 w-12 object-contain"
            aria-hidden="true"
          />
          {nation?.localization.mark.en ?? ship.nation}
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            className="size-6 object-contain"
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
    </TableRow>
  );
}
