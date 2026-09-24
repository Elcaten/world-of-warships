import { memo, useDeferredValue, useState } from "react";
import {
  resolveMediaUrl,
  useMediaPath,
  useShips,
  type Ship,
} from "./api/encyclopedia";
import { NationFlag } from "./components/NationFlag";
import { ShipCard } from "./components/ShipCard";
import { ShipDetailsDialog } from "./components/ShipDetailsDialog";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { VehicleTypeIcon } from "./components/VehicleTypeIcon";
import { useDebounceValue } from "./lib/useDebounceValue";

export default function App() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search);
  const deferredSearch = useDeferredValue(debouncedSearch);

  return (
    <>
      <nav className="p-6 bg-blue-100">
        <Input
          type="search"
          aria-label="Search ships"
          placeholder="Search ships…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </nav>{" "}
      <main className="min-h-screen space-y-4 bg-slate-100 p-6">
        <Ships search={deferredSearch} />
      </main>
    </>
  );
}

const Ships = memo(function Ships({ search }: { search: string }) {
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const ships = useShips({ search });
  const mediaPath = useMediaPath();

  if (ships.error || mediaPath.error) {
    return <div>error</div>;
  }

  if (ships.isPending || mediaPath.isPending) {
    return <div>loading</div>;
  }

  return (
    <div className="space-y-2">
      <p>{ships.data.length} result(s)</p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {ships.data.map((ship) => {
          const displayName = ship.localization.shortmark.en ?? ship.name;

          return (
            <ShipCard
              key={ship.id}
              imageSrc={resolveMediaUrl(mediaPath.data, ship.icons.large)}
              imageAlt={displayName}
            >
              <NationFlag
                nation={ship.nation}
                className="absolute inset-0 z-[-1] opacity-50 "
                size="large"
              />
              {
                <Badge className="absolute top-3 left-4 flex">
                  <VehicleTypeIcon vehicleType={ship.vehicleType} />
                  {ship.level}
                </Badge>
              }
              {displayName && (
                <Badge className="absolute bottom-3 right-4">
                  {displayName}
                </Badge>
              )}
              <button
                type="button"
                aria-label={`View details for ${displayName}`}
                aria-haspopup="dialog"
                className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-600"
                onClick={() => setSelectedShip(ship)}
              />
            </ShipCard>
          );
        })}
      </div>
      {ships.data.length === 0 && <p>No ships found.</p>}
      <ShipDetailsDialog
        ship={selectedShip}
        mediaPath={mediaPath.data}
        onClose={() => setSelectedShip(null)}
      />
    </div>
  );
});
