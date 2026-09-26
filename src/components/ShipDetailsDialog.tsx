import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  resolveMediaUrl,
  useNations,
  useVehicleTypes,
  type Ship,
} from "../api/encyclopedia";
import { isPremium, shipName, tierLabel } from "../lib/ships";
import { NationFlag } from "./NationFlag";
import { CommandButton } from "./ui/command-button";
import { Icon } from "./ui/icon";

type ShipDetailsDialogProps = {
  ship: Ship | null;
  mediaPath: string;
  onClose: () => void;
};

export function ShipDetailsDialog({
  ship,
  mediaPath,
  onClose,
}: ShipDetailsDialogProps) {
  const nations = useNations();
  const types = useVehicleTypes();
  const nation = nations.data?.find((nation) => nation.name === ship?.nation);

  return (
    <Dialog open={ship !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-fleet-deep/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-8">
        <DialogPanel className="max-h-full w-full max-w-200 overflow-y-auto border border-[#3c505c] bg-fleet-panel p-5 shadow-[0_30px_100px_#0009] sm:p-7">
          {ship && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 font-mono text-[11px] leading-normal font-medium text-fleet-cyan uppercase">
                    Ship profile
                  </p>
                  <DialogTitle className="font-heading text-[26px]/[1.2] font-bold uppercase wrap-anywhere sm:text-[32px]">
                    {shipName(ship)}
                  </DialogTitle>
                </div>
                <CommandButton
                  className="p-2"
                  aria-label="Close ship details"
                  onClick={onClose}
                >
                  <Icon name="close" />
                </CommandButton>
              </div>
              <div className="relative -mx-5 my-5 h-50 overflow-hidden bg-[radial-gradient(ellipse_at_center,#25425270,#070f1660)] sm:-mx-7 sm:h-70">
                <NationFlag
                  nation={ship.nation}
                  size="large"
                  className="absolute top-0 right-0 h-full opacity-9"
                />
                <img
                  className="relative size-full object-contain drop-shadow-[0_15px_10px_#0006]"
                  src={resolveMediaUrl(mediaPath, ship.icons.large)}
                  alt={shipName(ship)}
                />
              </div>
              <dl className="flex flex-wrap gap-x-9 gap-y-6 border-b border-fleet-line pb-6 [&_dt]:mb-2 [&_dt]:font-mono [&_dt]:text-[10px] [&_dt]:leading-normal [&_dt]:[&_dt]:text-fleet-muted [&_dt]:uppercase [&_dd]:font-heading [&_dd]:text-[17px] [&_dd]:leading-normal [&_dd]:font-semibold">
                <div>
                  <dt>Nation</dt>
                  <dd>{nation?.localization.mark.en ?? ship.nation}</dd>
                </div>
                <div>
                  <dt>Class</dt>
                  <dd>
                    {types.data?.[ship.vehicleType]?.localization.mark.en ??
                      ship.vehicleType}
                  </dd>
                </div>
                <div>
                  <dt>Tier</dt>
                  <dd>{tierLabel(ship.level)}</dd>
                </div>
                {isPremium(ship) && (
                  <div>
                    <dt>Category</dt>
                    <dd className="text-fleet-gold">Premium</dd>
                  </div>
                )}
              </dl>
              {ship.localization.description.en && (
                <section className="mt-6">
                  <p className="text-[15px]/[1.8] whitespace-pre-line text-fleet-secondary">
                    {ship.localization.description.en}
                  </p>
                </section>
              )}
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
