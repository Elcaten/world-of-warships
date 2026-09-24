import clsx from "clsx";
import type { PropsWithChildren } from "react";

type ShipCardProps = {
  imageSrc: string;
  imageAlt: string;
  className?: string;
};

export function ShipCard({
  imageSrc,
  imageAlt,
  className,
  children,
}: PropsWithChildren<ShipCardProps>) {
  return (
    <article
      className={clsx(
        "relative aspect-video overflow-hidden rounded-xs shadow-lg isolate border-slate-300 border",
        className,
      )}
    >
      <img
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      {children}
    </article>
  );
}
