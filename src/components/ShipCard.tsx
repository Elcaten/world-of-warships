import clsx from "clsx";
import { resolveMediaUrl, useNations, type Ship } from "../api/encyclopedia";
import { isPremium, shipName, tierLabel } from "../lib/ships";
import { NationFlag } from "./NationFlag";
import { VehicleTypeIcon } from "./VehicleTypeIcon";
import { Icon } from "./ui/icon";

export function ShipCard({
  ship,
  mediaPath,
  onViewDetails,
}: {
  ship: Ship;
  mediaPath: string;
  onViewDetails: (ship: Ship) => void;
}) {
  const nations = useNations();
  const premium = isPremium(ship);

  return (
    <button
      className={clsx(
        "border-fleet-line bg-fleet-panel group relative isolate flex min-w-0 flex-col overflow-hidden border-2 text-left transition-colors duration-150",
        premium ? "hover:border-fleet-gold" : "hover:border-fleet-cyan",
      )}
      aria-label={`View details for ${shipName(ship)}`}
      aria-haspopup="dialog"
      onClick={() => onViewDetails(ship)}
    >
      <div className="absolute inset-2 -z-10 opacity-10 duration-1000 group-hover:opacity-25 group-hover:duration-400">
        <NationFlag nation={ship.nation} size="large" className="" />
      </div>

      <span className="-mb-14 flex items-center justify-between gap-2 px-4 py-3">
        <span className="font-heading flex items-center gap-2 font-bold">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            variant={premium ? "premium" : "default"}
            className="object-contain"
          />
          <span className={premium ? "text-fleet-gold" : ""}>
            {tierLabel(ship.level)}
          </span>
        </span>
        {premium && (
          <span className="text-fleet-gold font-mono text-xs uppercase">
            Premium
          </span>
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
          className={clsx(
            "font-heading text-xl font-bold wrap-anywhere uppercase",
            premium && "text-fleet-gold",
          )}
        >
          {shipName(ship)}
        </span>
        <Icon name="right" className="size-4 shrink-0" />
      </span>
    </button>
  );
}
