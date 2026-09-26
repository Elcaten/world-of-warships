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
      className={`group relative isolate flex min-w-0 flex-col overflow-hidden border border-fleet-line/40 bg-linear-[145deg] from-[#17232b] to-[#121b22] p-4 text-left shadow-[0_4px_12px_#0002,inset_0_1px_#ffffff03] transition-[border-color,box-shadow] after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-linear-to-r after:to-transparent after:opacity-65 hover:shadow-[0_0_20px_#38d7d212] motion-reduce:transition-none ${premium ? "after:from-fleet-gold hover:border-fleet-gold" : "after:from-fleet-cyan hover:border-fleet-cyan"}`}
      aria-label={`View details for ${shipName(ship)}`}
      aria-haspopup="dialog"
      onClick={() => onViewDetails(ship)}
    >
      <NationFlag
        nation={ship.nation}
        size="large"
        className="absolute -top-[15px] -right-3 -z-10 h-25 w-[135px] object-contain opacity-9 saturate-60"
      />
      <span className="flex min-h-6 items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-heading text-base leading-normal font-bold ">
          <VehicleTypeIcon
            vehicleType={ship.vehicleType}
            className="h-4.5 w-5 object-contain"
          />
          {tierLabel(ship.level)}
        </span>
        {premium && (
          <span className="border border-fleet-gold/12 bg-fleet-gold/8 px-1.5 py-0.75 font-mono text-[10px] leading-normal font-medium  text-fleet-gold uppercase">
            Premium
          </span>
        )}
      </span>
      <span className="-mx-2 my-1.5 flex h-45 items-center justify-center bg-[radial-gradient(ellipse_at_center,#35647820,transparent_70%)] sm:h-38 xl:h-45">
        <img
          className="size-full object-contain drop-shadow-[0_10px_8px_#0008] transition-transform duration-250 group-hover:scale-[1.045] motion-reduce:transition-none"
          src={resolveMediaUrl(mediaPath, ship.icons.medium)}
          alt=""
          loading="lazy"
        />
      </span>
      <span className="flex items-end justify-between gap-4 sm:flex-col sm:items-stretch sm:gap-1.25">
        <span className="max-w-[42%] font-mono text-[10px] leading-normal  text-fleet-muted uppercase sm:max-w-none">
          {nation?.localization.mark.en ?? ship.nation}
        </span>
        <span
          className={`text-right font-heading text-xl/[1.25] font-bold ] uppercase [overflow-wrap:anywhere] sm:text-left ${premium ? "text-fleet-gold" : "group-hover:text-fleet-cyan"}`}
        >
          {shipName(ship)}
        </span>
      </span>
      <span className="mt-2 flex items-center justify-between font-mono text-[10px] leading-normal  text-[#87b9bc] uppercase">
        {types.data?.[ship.vehicleType]?.localization.mark.en ??
          ship.vehicleType}
        <Icon name="right" className="size-3.5" />
      </span>
    </button>
  );
}
