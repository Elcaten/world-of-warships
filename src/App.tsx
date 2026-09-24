import { memo, useDeferredValue, useState } from "react";
import { useMediaPath, useShips, type Ship } from "./api/encyclopedia";
import { ShipDetailsDialog } from "./components/ShipDetailsDialog";
import { ShipFilters } from "./components/ShipFilters";
import { ShipsTable } from "./components/ShipsTable";
import { useDebounceValue } from "./lib/useDebounceValue";

export default function App() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search);
  const deferredSearch = useDeferredValue(debouncedSearch);

  return (
    <>
      {/*<nav className="p-6 bg-blue-100">
        <Input
          type="search"
          aria-label="Search ships"
          placeholder="Search ships…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </nav>{" "}*/}
      <main className="min-h-screen space-y-4  p-6">
        <Ships search={deferredSearch} />
      </main>
    </>
  );
}

const Ships = memo(function Ships({ search }: { search: string }) {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [types, setTypes] = useState<string[]>();
  const [nations, setNations] = useState<string[]>();
  const ships = useShips({ search, types, nations });
  const mediaPath = useMediaPath();

  if (ships.error || mediaPath.error) {
    return <div>error</div>;
  }

  if (ships.isPending || mediaPath.isPending) {
    return <div>loading</div>;
  }

  return (
    <div className="space-y-2">
      <ShipFilters
        types={types}
        nations={nations}
        onTypesChange={setTypes}
        onNationsChange={setNations}
      />
      <p>{ships.data.length} result(s)</p>
      <ShipsTable
        ships={ships.data}
        mediaPath={mediaPath.data}
        onViewDetails={setSelectedShip}
      />
      {ships.data.length === 0 && <p>No ships found.</p>}
      <ShipDetailsDialog
        ship={selectedShip}
        mediaPath={mediaPath.data}
        onClose={() => setSelectedShip(null)}
      />
    </div>
  );
});
