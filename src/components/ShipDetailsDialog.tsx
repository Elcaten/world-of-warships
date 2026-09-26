import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
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
  open: boolean;
  mediaPath: string;
  onClose: () => void;
};

export function ShipDetailsDialog({
  ship,
  open,
  mediaPath,
  onClose,
}: ShipDetailsDialogProps) {
  const nations = useNations();
  const types = useVehicleTypes();
  const nation = nations.data?.find((nation) => nation.name === ship?.nation);

  const largeImageUrl = ship && resolveMediaUrl(mediaPath, ship.icons.large);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const fullImageLoaded = loadedImageUrl === largeImageUrl;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="bg-fleet-deep/75 fixed inset-0 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="border-fleet-line bg-fleet-panel data-closed:opacity- max-h-full w-full max-w-3xl overflow-y-auto border p-6 duration-150 ease-out data-closed:scale-97 data-closed:opacity-0 data-closed:duration-0"
        >
          {ship && (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-fleet-cyan mb-2 font-mono text-xs uppercase">
                    Ship profile
                  </p>
                  <DialogTitle className="font-heading text-3xl font-bold wrap-anywhere uppercase">
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
              <div className="bg-fleet-deep relative my-6 h-60 overflow-hidden">
                <NationFlag
                  nation={ship.nation}
                  size="large"
                  className="absolute top-0 right-0 h-full opacity-20"
                />
                <img
                  className="absolute inset-0 size-full object-contain"
                  src={resolveMediaUrl(mediaPath, ship.icons.medium)}
                  alt=""
                />
                <img
                  className={clsx(
                    "linear absolute inset-0 size-full object-contain transition-opacity duration-2000",
                    fullImageLoaded ? "opacity-100" : "opacity-0",
                  )}
                  src={resolveMediaUrl(mediaPath, ship.icons.large)}
                  alt={shipName(ship)}
                  onLoad={() => setLoadedImageUrl(largeImageUrl)}
                />
              </div>
              <dl className="border-fleet-line flex flex-wrap gap-6 border-b pb-6">
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
      <dt className="text-fleet-muted mb-2 font-mono text-xs uppercase">
        {label}
      </dt>
      <dd className={clsx("font-heading text-lg font-semibold", className)}>
        {children}
      </dd>
    </div>
  );
}
