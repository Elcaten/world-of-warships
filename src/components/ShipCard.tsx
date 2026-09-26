import clsx from "clsx";
import {
  resolveMediaUrl,
  useNations,
  useVehicleTypes,
  type Ship,
} from "../api/encyclopedia";
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
  const types = useVehicleTypes();
  const nation = nations.data?.find((nation) => nation.name === ship.nation);
  const premium = isPremium(ship);
  return (
    <button
      className={clsx(
        "relative isolate flex min-w-0 flex-col overflow-hidden border border-fleet-line bg-fleet-panel p-4 text-left",
        premium ? "hover:border-fleet-gold" : "hover:border-fleet-cyan",
      )}
      aria-label={`View details for ${shipName(ship)}`}
      aria-haspopup="dialog"
      onClick={() => onViewDetails(ship)}
    >
      <NationFlag
        nation={ship.nation}
        size="large"
        className="absolute top-0 right-0 -z-10 w-32 opacity-10"
      />
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-heading font-bold">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            variant={premium ? "premium" : "default"}
            className="size-5 object-contain"
          />
          <span className={premium ? "text-fleet-gold" : ""}>
            {tierLabel(ship.level)}
          </span>
        </span>
        {premium && (
          <span className="font-mono text-xs text-fleet-gold uppercase">
            Premium
          </span>
        )}
      </span>
      <img
        className="my-2 h-44 w-full object-contain"
        src={resolveMediaUrl(mediaPath, ship.icons.medium)}
        alt=""
        loading="lazy"
      />
      <span className="flex flex-col gap-1">
        <span className="font-mono text-xs text-fleet-muted uppercase">
          {nation?.localization.mark.en ?? ship.nation}
        </span>
        <span
          className={clsx(
            "font-heading text-xl font-bold uppercase wrap-anywhere",
            premium && "text-fleet-gold",
          )}
        >
          {shipName(ship)}
        </span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2 pt-2 font-mono text-xs text-fleet-secondary uppercase">
        {types.data?.[ship.vehicleType]?.localization.mark.en ??
          ship.vehicleType}
        <Icon name="right" className="size-4 shrink-0" />
      </span>
    </button>
  );
}
