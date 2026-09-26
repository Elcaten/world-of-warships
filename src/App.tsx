import { useDeferredValue, useMemo, useState } from "react";
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_50%_0%,#17283255,transparent_65%),repeating-linear-gradient(135deg,transparent,transparent_4px,#ffffff01_4px,#ffffff01_5px)]">
      <AppHeader />
      <main
        id="main-content"
        className="mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:w-[min(100%-80px,1536px)] min-h-[calc(100vh-164px)] pt-6 pb-12 sm:pt-7.5"
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 font-mono text-[11px] leading-normal font-medium text-fleet-cyan uppercase">
              World of Warships
            </p>
            <h1 className="font-heading text-[28px]/[1.2] font-bold sm:text-[32px]">
              Fleet roster
            </h1>
          </div>
          {!pending && !failed && (
            <p className="mb-1 flex items-center gap-2 font-mono text-[11px] leading-normal text-fleet-muted">
              <span className="size-1.5 bg-fleet-cyan shadow-[0_0_10px_#38d7d240]" />
              {catalogue.data?.length.toLocaleString()} ships in the
              encyclopedia
            </p>
          )}
        </div>
        <section
          aria-label="Fleet controls"
          className="border border-fleet-line/40 bg-fleet-panel p-3.5 shadow-[inset_0_1px_#ffffff05] sm:p-5"
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
          <section
            className="flex min-h-[340px] flex-col items-center justify-center gap-4 px-5 py-10 text-center [&>svg]:size-8 [&>svg]:text-fleet-cyan [&>h2]:font-heading [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:max-w-[400px] [&>p]:text-fleet-muted"
            role="alert"
          >
            <Icon name="anchor" />
            <h2>Unable to load the fleet</h2>
            <p>The encyclopedia couldn’t be reached. Try again in a moment.</p>
            <CommandButton
              onClick={() => {
                queries
                  .filter((query) => query.isError)
                  .forEach((query) => void query.refetch());
              }}
            >
              Try again
            </CommandButton>
          </section>
        ) : pending ? (
          <section aria-label="Loading fleet" aria-busy="true">
            <p
              className="flex justify-between gap-4 pt-5 pb-4 font-mono text-[11px] leading-normal text-fleet-muted [&_strong]:font-medium [&_strong]:text-fleet-text"
              role="status"
            >
              Loading the ship encyclopedia…
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-4.5 lg:grid-cols-4 lg:gap-6">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-[286px] animate-pulse border border-fleet-line bg-fleet-panel motion-reduce:animate-none"
                />
              ))}
            </div>
          </section>
        ) : (
          <>
            <div
              className="flex justify-between gap-4 pt-5 pb-4 font-mono text-[11px] leading-normal text-fleet-muted [&_strong]:font-medium [&_strong]:text-fleet-text"
              role="status"
            >
              <span>
                <strong>{sorted.length.toLocaleString()}</strong>{" "}
                {sorted.length === 1 ? "ship" : "ships"} found
              </span>
              <span>
                {sorted.length > 0 &&
                  `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, sorted.length)} of ${sorted.length.toLocaleString()}`}
              </span>
            </div>
            {sorted.length === 0 ? (
              <section className="flex min-h-[340px] flex-col items-center justify-center gap-4 px-5 py-10 text-center [&>svg]:size-8 [&>svg]:text-fleet-cyan [&>h2]:font-heading [&>h2]:text-2xl [&>h2]:font-semibold [&>p]:max-w-[400px] [&>p]:text-fleet-muted">
                <Icon name="search" />
                <h2>No ships found</h2>
                <p>
                  Try another name or adjust your class, nation, and tier
                  filters.
                </p>
                <CommandButton onClick={resetFilters}>
                  Clear filters
                </CommandButton>
              </section>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-4.5 lg:grid-cols-4 lg:gap-6">
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
                className="mt-8 flex items-center justify-center gap-3 font-mono text-[11px] leading-normal text-fleet-muted sm:gap-6 [&_button]:px-2 [&_button]:text-[10px] sm:[&_button]:px-3 sm:[&_button]:text-xs"
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
      <footer className="mx-auto w-[calc(100%-32px)] sm:w-[calc(100%-48px)] lg:w-[min(100%-80px,1536px)] flex flex-col justify-between gap-1.5 border-t border-fleet-line/50 py-6 font-mono text-[10px]/[1.7] text-[#7e949e] sm:flex-row sm:gap-4">
        <span className="uppercase">Warship Encyclopedia</span>
        <span>Ship data & imagery from World of Warships</span>
      </footer>
    </div>
  );
}
