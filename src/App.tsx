import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useMediaPath,
  useNations,
  useShips,
  useVehicleTypes,
  type Ship,
} from "@/api/encyclopedia";
import { AppHeader } from "@/components/features/AppHeader";
import { FleetToolbar } from "@/components/features/FleetToolbar";
import { ShipDetailsDialog } from "@/components/features/ShipDetailsDialog";
import { ShipFilters } from "@/components/features/ShipFilters";
import { ShipsGrid } from "@/components/features/ShipsGrid";
import { ShipsTable } from "@/components/features/ShipTable/ShipsTable";
import { CommandButton } from "@/components/ui/command-button";
import { Icon } from "@/components/ui/icon";
import { shipName } from "@/lib/ships";
import { useFleetQueryState } from "@/lib/useFleetQueryState";

export default function App() {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const catalogue = useShips();
  const media = useMediaPath();
  const nationCatalogue = useNations();
  const vehicleTypes = useVehicleTypes();
  const tiers = useMemo(
    () =>
      [...new Set(catalogue.data?.map((ship) => ship.level))].sort(
        (a, b) => a - b,
      ),
    [catalogue.data],
  );
  const validTypes = useMemo(
    () => (vehicleTypes.data ? Object.keys(vehicleTypes.data) : undefined),
    [vehicleTypes.data],
  );
  const validNations = useMemo(
    () => nationCatalogue.data?.map((nation) => nation.name),
    [nationCatalogue.data],
  );
  const { state, update, reset } = useFleetQueryState({
    types: validTypes,
    nations: validNations,
    levels: catalogue.data ? tiers : undefined,
  });
  const { search, types, nations, levels, sort, view } = state;
  const deferredSearch = useDeferredValue(search);
  const ships = useShips({ search: deferredSearch, types, nations, levels });
  const queries = [ships, media, nationCatalogue, vehicleTypes];
  const failed = queries.some(
    (query) => query.isError && query.data === undefined,
  );
  const pending = queries.some((query) => query.isPending);
  const sorted = useMemo(
    () =>
      [...(ships.data ?? [])].sort((a, b) => {
        const byName = shipName(a).localeCompare(shipName(b));
        return sort === "name"
          ? byName
          : (sort === "tier-desc" ? b.level - a.level : a.level - b.level) ||
              byName;
      }),
    [ships.data, sort],
  );
  // Compare query values, not result/array identity, so refreshes preserve scroll.
  const resultKey = JSON.stringify([
    deferredSearch,
    types,
    nations,
    levels,
    sort,
    view,
  ]);
  const previousResultKey = useRef<string | null>(null);
  useEffect(() => {
    if (pending || failed) {
      previousResultKey.current = null;
      return;
    }
    if (
      previousResultKey.current !== null &&
      previousResultKey.current !== resultKey
    ) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    previousResultKey.current = resultKey;
  }, [resultKey, pending, failed]);

  function showDetails(ship: Ship) {
    setSelectedShip(ship);
    setDetailsOpen(true);
  }

  function resetFilters() {
    reset();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main
        id="main-content"
        className="mx-auto w-full max-w-384 flex-1 px-4 py-8 sm:px-6 lg:px-10"
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-fleet-cyan mb-2 font-mono text-xs uppercase">
              World of Warships
            </p>
            <h1 className="font-heading text-3xl font-bold">Fleet roster</h1>
          </div>
          {!pending && !failed && (
            <p className="text-fleet-muted font-mono text-xs">
              {catalogue.data?.length.toLocaleString()} ships in the
              encyclopedia
            </p>
          )}
        </div>
        <section
          aria-label="Fleet controls"
          className="border-fleet-line bg-fleet-panel border p-4"
        >
          <FleetToolbar
            search={search}
            onSearchChange={(value) => {
              update({ search: value });
            }}
            sort={sort}
            onSortChange={(value) => {
              update({ sort: value });
            }}
            view={view}
            onViewChange={(value) => update({ view: value })}
            onReset={resetFilters}
          />
          {nationCatalogue.data && vehicleTypes.data && (
            <ShipFilters
              types={types}
              nations={nations}
              levels={levels}
              tiers={tiers}
              nationCatalogue={nationCatalogue.data}
              vehicleTypes={vehicleTypes.data}
              onTypesChange={(value) => {
                update({ types: value });
              }}
              onNationsChange={(value) => {
                update({ nations: value });
              }}
              onLevelsChange={(value) => {
                update({ levels: value });
              }}
            />
          )}
        </section>
        {failed ? (
          <FleetMessage
            icon="anchor"
            title="Unable to load the fleet"
            description="The encyclopedia couldn’t be reached. Try again in a moment."
            role="alert"
          >
            <CommandButton
              onClick={() => {
                queries
                  .filter((query) => query.isError)
                  .forEach((query) => void query.refetch());
              }}
            >
              Try again
            </CommandButton>
          </FleetMessage>
        ) : pending ? (
          <section aria-label="Loading fleet" aria-busy="true">
            <p
              className="text-fleet-muted py-4 font-mono text-xs"
              role="status"
            >
              Loading the ship encyclopedia…
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="bg-fleet-panel h-80 animate-pulse motion-reduce:animate-none"
                />
              ))}
            </div>
          </section>
        ) : (
          <>
            <div
              className="text-fleet-muted py-4 font-mono text-xs"
              role="status"
            >
              <span>
                <strong className="text-fleet-text">
                  {sorted.length.toLocaleString()}
                </strong>{" "}
                {sorted.length === 1 ? "ship" : "ships"} found
              </span>
            </div>
            {sorted.length === 0 ? (
              <FleetMessage
                icon="search"
                title="No ships found"
                description="Try another name or adjust your class, nation, and tier filters."
              >
                <CommandButton onClick={resetFilters}>
                  Clear filters
                </CommandButton>
              </FleetMessage>
            ) : view === "grid" ? (
              <ShipsGrid
                ships={sorted}
                mediaPath={media.data!}
                onViewDetails={showDetails}
              />
            ) : (
              <ShipsTable
                ships={sorted}
                mediaPath={media.data!}
                onViewDetails={showDetails}
              />
            )}
          </>
        )}
        <ShipDetailsDialog
          ship={selectedShip}
          open={detailsOpen}
          mediaPath={media.data ?? ""}
          onClose={() => setDetailsOpen(false)}
        />
      </main>
      <footer className="border-fleet-line text-fleet-muted mx-auto flex w-full max-w-384 flex-wrap justify-between gap-2 border-t px-4 py-6 font-mono text-xs sm:px-6 lg:px-10">
        <span className="uppercase">Warship Encyclopedia</span>
        <span>Ship data & imagery from World of Warships</span>
      </footer>
    </div>
  );
}

function FleetMessage({
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
