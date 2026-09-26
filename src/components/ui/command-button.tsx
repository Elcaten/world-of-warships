import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

export const commandButtonStyles =
  "inline-flex min-h-10 items-center justify-center gap-2 border border-[#3c4948] bg-[#232d34] px-[13px] py-2 font-mono text-xs font-medium tracking-[0.05em] text-fleet-secondary uppercase enabled:hover:border-fleet-cyan enabled:hover:bg-[#263b42] enabled:hover:text-fleet-highlight";

export function CommandButton({
  className,
  type = "button",
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      {...props}
      type={type}
      className={clsx(commandButtonStyles, className)}
    />
  );
}
