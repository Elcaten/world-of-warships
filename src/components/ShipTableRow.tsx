import { resolveMediaUrl, type Ship } from "../api/encyclopedia";
import { NationFlag } from "./NationFlag";
import { VehicleTypeIcon } from "./VehicleTypeIcon";
import { TableCell, TableRow } from "./ui/table";

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
  const displayName = ship.localization.shortmark.en ?? ship.name;

  return (
    <TableRow className={className}>
      <TableCell>
        <div className="flex items-center gap-3">
          <img
            src={resolveMediaUrl(mediaPath, ship.icons.contour_alive)}
            alt=""
            loading="lazy"
            className=" w-24 object-contain"
          />
          {onViewDetails ? (
            <button
              type="button"
              aria-label={`View details for ${displayName}`}
              aria-haspopup="dialog"
              className="cursor-pointer font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
        <NationFlag
          nation={ship.nation}
          size="small"
          className="h-8 w-12 object-contain"
        />
      </TableCell>
      <TableCell>
        <VehicleTypeIcon
          vehicleType={ship.vehicleType}
          className="h-6 w-6 object-contain"
        />
      </TableCell>
      <TableCell>{ship.level}</TableCell>
    </TableRow>
  );
}
