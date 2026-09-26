import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import {
  useMediaPath,
  useNations,
  useShips,
  useVehicleTypes,
  type Ship,
} from "./api/encyclopedia";
import { AppHeader } from "./components/AppHeader";
import {
  FleetToolbar,
  type FleetSort,
  type FleetView,
} from "./components/FleetToolbar";
import { ShipCard } from "./components/ShipCard";
import { ShipDetailsDialog } from "./components/ShipDetailsDialog";
import { ShipFilters } from "./components/ShipFilters";
import { ShipsTable } from "./components/ShipsTable";
import { CommandButton } from "./components/ui/command-button";
import { Icon } from "./components/ui/icon";
import { shipName } from "./lib/ships";

const PAGE_SIZE = 24;

export default function App() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [types, setTypes] = useState<string[]>();
  const [nations, setNations] = useState<string[]>();
  const [levels, setLevels] = useState<number[]>();
  const [sort, setSort] = useState<FleetSort>("tier-desc");
  const [view, setView] = useState<FleetView>("grid");
  const [page, setPage] = useState(1);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const catalogue = useShips();
  const ships = useShips({ search: deferredSearch, types, nations, levels });
  const media = useMediaPath();
  const nationCatalogue = useNations();
  const vehicleTypes = useVehicleTypes();
  const queries = [ships, media, nationCatalogue, vehicleTypes];
  const failed = queries.some((query) => query.isError);
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
  const tiers = useMemo(
    () =>
      [...new Set(catalogue.data?.map((ship) => ship.level))].sort(
        (a, b) => a - b,
      ),
    [catalogue.data],
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleShips = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function resetFilters() {
    setSearch("");
    setTypes(undefined);
    setNations(undefined);
    setLevels(undefined);
    setPage(1);
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
            <p className="mb-2 font-mono text-xs text-fleet-cyan uppercase">
              World of Warships
            </p>
            <h1 className="font-heading text-3xl font-bold">
              Fleet roster
            </h1>
          </div>
          {!pending && !failed && (
            <p className="font-mono text-xs text-fleet-muted">
              {catalogue.data?.length.toLocaleString()} ships in the
              encyclopedia
            </p>
          )}
        </div>
        <section
          aria-label="Fleet controls"
          className="border border-fleet-line bg-fleet-panel p-4"
        >
          <FleetToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(value) => {
              setSort(value);
              setPage(1);
            }}
            view={view}
            onViewChange={setView}
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
                setTypes(value);
                setPage(1);
              }}
              onNationsChange={(value) => {
                setNations(value);
                setPage(1);
              }}
              onLevelsChange={(value) => {
                setLevels(value);
                setPage(1);
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
              className="py-4 font-mono text-xs text-fleet-muted"
              role="status"
            >
              Loading the ship encyclopedia…
            </p>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse bg-fleet-panel motion-reduce:animate-none"
                />
              ))}
            </div>
          </section>
        ) : (
          <>
            <div
              className="flex justify-between gap-4 py-4 font-mono text-xs text-fleet-muted"
              role="status"
            >
              <span>
                <strong className="text-fleet-text">
                  {sorted.length.toLocaleString()}
                </strong>{" "}
                {sorted.length === 1 ? "ship" : "ships"} found
              </span>
              <span>
                {sorted.length > 0 &&
                  `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} of ${sorted.length.toLocaleString()}`}
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
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {visibleShips.map((ship) => (
                  <ShipCard
                    key={ship.id}
                    ship={ship}
                    mediaPath={media.data!}
                    onViewDetails={setSelectedShip}
                  />
                ))}
              </div>
            ) : (
              <ShipsTable
                ships={visibleShips}
                mediaPath={media.data!}
                onViewDetails={setSelectedShip}
              />
            )}
            {pageCount > 1 && (
              <nav
                aria-label="Fleet pages"
                className="mt-8 flex flex-wrap items-center justify-center gap-3 font-mono text-xs text-fleet-muted"
              >
                <CommandButton
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <Icon name="left" />
                  Previous
                </CommandButton>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <CommandButton
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <Icon name="right" />
                </CommandButton>
              </nav>
            )}
          </>
        )}
        <ShipDetailsDialog
          ship={selectedShip}
          mediaPath={media.data ?? ""}
          onClose={() => setSelectedShip(null)}
        />
      </main>
      <footer className="mx-auto flex w-full max-w-384 flex-wrap justify-between gap-2 border-t border-fleet-line px-4 py-6 font-mono text-xs text-fleet-muted sm:px-6 lg:px-10">
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
      <Icon name={icon} className="size-8 text-fleet-cyan" />
      <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      <p className="max-w-md text-fleet-muted">{description}</p>
      {children}
    </section>
  );
}
