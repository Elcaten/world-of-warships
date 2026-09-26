import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

export function CommandButton({
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type={type}
      className={clsx(
        "inline-flex items-center justify-center gap-2 border border-fleet-line bg-fleet-deep p-2 font-mono text-xs text-fleet-secondary uppercase enabled:hover:border-fleet-cyan enabled:hover:text-fleet-highlight",
        className,
      )}
    />
  );
}
