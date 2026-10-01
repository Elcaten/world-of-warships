import {
  resolveMediaUrl,
  useMediaPathQuery,
  useNationsQuery,
  useVehicleTypesQuery,
  type Ship,
} from "@/api/encyclopedia";
import { NationFlag } from "@/components/domain/NationFlag";
import { CommandButton } from "@/components/ui/command-button";
import { Icon } from "@/components/ui/icon";
import { shipName, tierLabel } from "@/lib/ships";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import { useState, type ReactNode } from "react";

type ShipDetailsDialogProps = {
  ship: Ship | null;
  open: boolean;
  onClose: () => void;
};

export function ShipDetailsDialog({
  ship,
  open,
  onClose,
}: ShipDetailsDialogProps) {
  const mediaPathQuery = useMediaPathQuery();
  const mediaPath = mediaPathQuery.data ?? "";
  const nations = useNationsQuery();
  const types = useVehicleTypesQuery();
  const nation = nations.data?.find((nation) => nation.name === ship?.nation);

  const largeImageUrl = ship && resolveMediaUrl(mediaPath, ship.icons.large);
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const fullImageLoaded = loadedImageUrl === largeImageUrl;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="bg-fleet-deep/50 fixed inset-0 backdrop-blur-md" />
      <div className="fixed inset-0 flex w-screen items-end justify-center p-0 sm:items-center sm:p-4">
        <DialogPanel
          transition
          className={clsx(
            "border-fleet-line bg-fleet-panel group -mb-2 max-h-[75vh] w-full max-w-3xl overflow-y-auto p-6 duration-250 data-closed:translate-y-full sm:mb-0 sm:max-h-full sm:border sm:duration-0 sm:data-closed:translate-0",
            overshootEasing,
          )}
        >
          {ship && (
            <div className="group-not-data-closed:animate-[fade-in_150ms_ease-out_150ms_both] sm:group-not-data-closed:animate-none">
              <div className="mb-6 flex items-center justify-between gap-4">
                <DialogTitle className="font-heading text-3xl font-bold wrap-anywhere uppercase">
                  {shipName(ship)}
                </DialogTitle>
                <CommandButton
                  className="shrink-0"
                  aria-label="Close ship details"
                  onClick={onClose}
                >
                  <Icon name="close" />
                </CommandButton>
              </div>
              <div className="bg-fleet-deep relative mb-6 hidden h-60 overflow-hidden sm:block">
                <NationFlag
                  nation={ship.nation}
                  size="large"
                  className="absolute top-0 right-0 h-full opacity-20"
                />
                <img
                  className="border-fleet-line absolute inset-0 size-full border object-contain"
                  src={resolveMediaUrl(mediaPath, ship.icons.medium)}
                  alt=""
                />
                <img
                  className={clsx(
                    "linear border-fleet-line absolute inset-0 size-full border object-contain transition-opacity duration-2000",
                    fullImageLoaded ? "opacity-100" : "opacity-0",
                  )}
                  src={resolveMediaUrl(mediaPath, ship.icons.large)}
                  alt={shipName(ship)}
                  onLoad={() => setLoadedImageUrl(largeImageUrl)}
                />
              </div>
              <dl className="border-fleet-line hidden flex-wrap gap-6 border-b pb-6 sm:flex">
                <ShipStat label="Nation">
                  {nation?.localization.mark.en ?? ship.nation}
                </ShipStat>
                <ShipStat label="Class">
                  {types.data?.[ship.vehicleType]?.localization.mark.en ??
                    ship.vehicleType}
                </ShipStat>
                <ShipStat label="Tier">{tierLabel(ship.level)}</ShipStat>
                {ship.isPremium && (
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
            </div>
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

const overshootEasing =
  "ease-[linear(0,0.332_9.1%,0.594_18.5%,0.793_28.4%,0.87_33.6%,0.933_39%,0.976_44%,1.009_49.2%,1.031_54.7%,1.042_60.6%,1.041_70.9%,1.007_91.4%,1)]";
