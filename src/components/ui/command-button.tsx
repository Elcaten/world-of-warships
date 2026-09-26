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
        "inline-flex items-center justify-center gap-2 border border-[#3c4948] bg-[#232d34] px-4 py-2 font-mono text-xs font-medium text-fleet-secondary uppercase enabled:hover:border-fleet-cyan enabled:hover:bg-fleet-line enabled:hover:text-fleet-highlight",
        className,
      )}
    />
  );
}
