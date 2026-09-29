import clsx from "clsx";
import type { ComponentPropsWithRef } from "react";

export function Table({
  children,
  className,
  ...props
}: ComponentPropsWithRef<"table">) {
  return (
    <table {...props} className={clsx("w-full text-left text-sm", className)}>
      {children}
    </table>
  );
}

export function TableHead({
  className,
  ...props
}: ComponentPropsWithRef<"thead">) {
  return (
    <thead
      {...props}
      className={clsx(
        "text-fleet-muted font-mono text-xs uppercase",
        className,
      )}
    />
  );
}

export function TableBody(props: ComponentPropsWithRef<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: ComponentPropsWithRef<"tr">) {
  return (
    <tr
      {...props}
      className={clsx(
        "data-striped:bg-fleet-deep hover:bg-fleet-line",
        className,
      )}
    />
  );
}

export function TableHeader({
  className,
  ...props
}: ComponentPropsWithRef<"th">) {
  return (
    <th
      {...props}
      className={clsx(
        "text-fleet-muted font-heading px-4 py-2 text-base font-medium uppercase inset-shadow-[0_-1px_0_0_var(--color-fleet-line)] sm:p-4",
        className,
      )}
    />
  );
}

export function TableCell({
  className,
  ...props
}: ComponentPropsWithRef<"td">) {
  return (
    <td
      {...props}
      className={clsx("px-4 py-2 text-center sm:p-4", className)}
    />
  );
}
