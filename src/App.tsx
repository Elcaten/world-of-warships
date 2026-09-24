import { memo, useDeferredValue, useState } from "react";
import { resolveMediaUrl, useMediaPath, useShips } from "./api/encyclopedia";
import { NationFlag } from "./components/NationFlag";
import { ShipCard } from "./components/ShipCard";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
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
              {<Badge className="absolute top-3 left-4">T{ship.level}</Badge>}
              {displayName && (
                <Badge className="absolute bottom-3 right-4">
                  {displayName}
                </Badge>
              )}
            </ShipCard>
          );
        })}
      </div>
      {ships.data.length === 0 && <p>No ships found.</p>}
    </div>
  );
});
