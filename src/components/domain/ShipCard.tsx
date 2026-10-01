import {
  resolveMediaUrl,
  type Nation,
  type Ship,
  type VehicleType,
} from "@/api/encyclopedia";
import { Icon } from "@/components/ui/icon";
import { shipName, tierLabel } from "@/lib/ships";
import clsx from "clsx";
import { memo } from "react";

export const ShipCard = memo(function ShipCard({
  ship,
  nation,
  vehicleType,
  mediaPath,
  onViewDetails,
}: {
  ship: Ship;
  nation?: Nation;
  vehicleType?: VehicleType;
  mediaPath: string;
  onViewDetails: (ship: Ship) => void;
}) {
  return (
    <button
      className={clsx(
        "border-fleet-line bg-fleet-panel group relative isolate flex w-full min-w-0 flex-col overflow-hidden border-2 text-left transition-colors duration-150",
        ship.isPremium
          ? "hover:border-fleet-gold text-fleet-gold"
          : "hover:border-fleet-cyan",
      )}
      aria-label={`View details for ${shipName(ship)}`}
      aria-haspopup="dialog"
      onClick={() => onViewDetails(ship)}
    >
      <div className="absolute inset-2 -z-10 opacity-10 duration-1000 group-hover:opacity-25 group-hover:duration-200">
        {nation && (
          <img
            src={resolveMediaUrl(mediaPath, nation.icons.large)}
            alt={`${nation.localization.mark.en ?? nation.name} flag`}
          />
        )}
      </div>

      <span className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-heading flex items-center gap-1 font-bold">
          {vehicleType && (
            <img
              src={resolveMediaUrl(
                mediaPath,
                vehicleType.icons[ship.isPremium ? "premium" : "default"],
              )}
              alt={vehicleType.localization.mark.en ?? ship.vehicleType}
              className="size-5 object-contain"
            />
          )}
          <span className={"text-xs"}>{tierLabel(ship.level)}</span>
        </span>
        {ship.isPremium && (
          <span className="font-mono text-xs uppercase">Premium</span>
        )}
      </span>

      <div className="-z-1 h-44 w-full">
        <img
          className={clsx("h-full w-full object-contain")}
          src={resolveMediaUrl(mediaPath, ship.icons.medium)}
          alt=""
        />
      </div>

      <span className="bg-fleet-panel/40 flex w-full items-center justify-between gap-2 py-2 pr-3 pl-4">
        <span
          className="font-heading min-w-0 truncate text-xl font-bold uppercase"
          title={shipName(ship)}
        >
          {shipName(ship)}
        </span>
        <Icon name="right" className="size-4 shrink-0" />
      </span>
    </button>
  );
});
