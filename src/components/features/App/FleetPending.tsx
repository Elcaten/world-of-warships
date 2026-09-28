import clsx from "clsx";
import type { FleetView } from "../FleetToolbar";

export function FleetPending({ view }: { view: FleetView }) {
  return (
    <section aria-label="Loading fleet" aria-busy="true">
      <p className="text-fleet-muted py-4 font-mono text-xs" role="status">
        Loading the ship encyclopedia…
      </p>
      <div
        aria-hidden="true"
        className={clsx(
          "grid",
          view === "grid"
            ? "gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "gap-1",
        )}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={clsx(
              "bg-fleet-panel border-fleet-line animate-pulse",
              view === "grid" ? "h-56 border-2" : "h-16 border",
            )}
          />
        ))}
      </div>
    </section>
  );
}
