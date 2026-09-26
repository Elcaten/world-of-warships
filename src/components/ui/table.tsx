import clsx from "clsx";
import type { ComponentPropsWithoutRef } from "react";

export function Table({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="overflow-x-auto border border-fleet-line bg-fleet-panel">
      <table
        {...props}
        className={clsx("w-full text-left text-sm whitespace-nowrap", className)}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHead({
  className,
  ...props
}: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      {...props}
      className={clsx("font-mono text-xs text-fleet-muted uppercase", className)}
    />
  );
}

export function TableBody(props: ComponentPropsWithoutRef<"tbody">) {
  return <tbody {...props} />;
}

export function TableRow({
  className,
  ...props
}: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      {...props}
      className={clsx("even:bg-fleet-deep hover:bg-fleet-line", className)}
    />
  );
}

export function TableHeader({
  className,
  ...props
}: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      {...props}
      className={clsx("border-b border-fleet-line p-4 font-medium", className)}
    />
  );
}

export function TableCell({
  className,
  ...props
}: ComponentPropsWithoutRef<"td">) {
  return <td {...props} className={clsx("p-4", className)} />;
}
