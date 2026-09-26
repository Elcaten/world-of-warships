import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";
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
      <DialogBackdrop className="fixed inset-0 bg-fleet-deep/75" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-h-full w-full max-w-3xl overflow-y-auto border border-fleet-line bg-fleet-panel p-6">
          {ship && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-2 font-mono text-xs text-fleet-cyan uppercase">
                    Ship profile
                  </p>
                  <DialogTitle className="font-heading text-3xl font-bold uppercase wrap-anywhere">
                    {shipName(ship)}
                  </DialogTitle>
                </div>
                <CommandButton
                  className="shrink-0"
                  aria-label="Close ship details"
                  onClick={onClose}
                >
                  <Icon name="close" />
                </CommandButton>
              </div>
              <div className="relative my-6 h-60 overflow-hidden bg-fleet-deep">
                <NationFlag
                  nation={ship.nation}
                  size="large"
                  className="absolute top-0 right-0 h-full opacity-10"
                />
                <img
                  className="relative size-full object-contain"
                  src={resolveMediaUrl(mediaPath, ship.icons.large)}
                  alt={shipName(ship)}
                />
              </div>
              <dl className="flex flex-wrap gap-6 border-b border-fleet-line pb-6">
                <ShipStat label="Nation">
                  {nation?.localization.mark.en ?? ship.nation}
                </ShipStat>
                <ShipStat label="Class">
                  {types.data?.[ship.vehicleType]?.localization.mark.en ??
                    ship.vehicleType}
                </ShipStat>
                <ShipStat label="Tier">{tierLabel(ship.level)}</ShipStat>
                {isPremium(ship) && (
                  <ShipStat label="Category" className="text-fleet-gold">
                    Premium
                  </ShipStat>
                )}
              </dl>
              {ship.localization.description.en && (
                <section className="mt-6">
                  <p className="text-fleet-secondary">
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

function ShipStat({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div>
      <dt className="mb-2 font-mono text-xs text-fleet-muted uppercase">
        {label}
      </dt>
      <dd
        className={clsx(
          "font-heading text-lg font-semibold",
          className,
        )}
      >
        {children}
      </dd>
    </div>
  );
}
