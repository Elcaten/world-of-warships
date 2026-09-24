import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Badge({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={clsx(
        "uppercase text-xl font-bold text-shadow-lg drop-shadow-[0_0px_1px_rgba(0,0,0,0.6)] text-slate-50",
        className,
      )}
    >
      {children}
    </span>
  );
}
