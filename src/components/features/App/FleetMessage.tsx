import { Icon } from "@/components/ui/icon";
import type { ReactNode } from "react";

export function FleetMessage({
  icon,
  title,
  description,
  role,
  children,
}: {
  icon: "anchor" | "search";
  title: string;
  description: string;
  role?: "alert";
  children: ReactNode;
}) {
  return (
    <section
      role={role}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <Icon name={icon} className="text-fleet-cyan size-8" />
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <p className="text-fleet-muted max-w-md">{description}</p>
      {children}
    </section>
  );
}
