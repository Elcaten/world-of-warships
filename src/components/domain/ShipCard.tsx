import clsx from "clsx";
import { resolveMediaUrl, type Ship } from "@/api/encyclopedia";
import { Icon } from "@/components/ui/icon";
import { shipName, tierLabel } from "@/lib/ships";
import { NationFlag } from "./NationFlag";
import { VehicleTypeIcon } from "./VehicleTypeIcon";

export function ShipCard({
  ship,
  mediaPath,
  onViewDetails,
}: {
  ship: Ship;
  mediaPath: string;
  onViewDetails: (ship: Ship) => void;
}) {
  return (
    <button
      className={clsx(
        "border-fleet-line bg-fleet-panel group relative isolate flex min-w-0 flex-col overflow-hidden border-2 text-left transition-colors duration-150",
        ship.isPremium
          ? "hover:border-fleet-gold text-fleet-gold"
          : "hover:border-fleet-cyan",
      )}
      aria-label={`View details for ${shipName(ship)}`}
      aria-haspopup="dialog"
      onClick={() => onViewDetails(ship)}
    >
      <div className="absolute inset-2 -z-10 opacity-10 duration-1000 group-hover:opacity-30 group-hover:duration-400">
        <NationFlag nation={ship.nation} size="large" className="" />
      </div>

      <span className="-mb-14 flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-heading flex items-center gap-1 font-bold">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            variant={ship.isPremium ? "premium" : "default"}
            className="size-5 object-contain"
          />
          <span className={"text-xs"}>{tierLabel(ship.level)}</span>
        </span>
        {ship.isPremium && (
          <span className="font-mono text-xs uppercase">Premium</span>
        )}
      </span>

      <img
        className="-z-1 h-44 w-full origin-bottom object-contain transition-transform duration-500 ease-in group-hover:scale-102 group-hover:duration-150 group-hover:ease-out motion-reduce:transition-none"
        src={resolveMediaUrl(mediaPath, ship.icons.medium)}
        alt=""
        loading="lazy"
      />

      <span className="bg-fleet-panel/40 -mt-8 flex items-center justify-between gap-2 py-2 pr-3 pl-4">
        <span
          className={"font-heading text-xl font-bold wrap-anywhere uppercase"}
        >
          {shipName(ship)}
        </span>
        <Icon name="right" className="size-4 shrink-0" />
      </span>
    </button>
  );
}
