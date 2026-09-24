import { memo, useDeferredValue, useState } from "react";
import { useShips } from "./api/encyclopedia";
import { Input } from "./components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
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

  if (ships.error) {
    return <div>error</div>;
  }

  if (ships.isPending) {
    return <div>loading</div>;
  }

  return (
    <div className="space-y-2">
      <p>{ships.data.length} result(s)</p>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>Ship</TableHeader>
            <TableHeader>Tier</TableHeader>
            <TableHeader>Nation</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {ships.data.map((ship) => (
            <TableRow key={ship.id}>
              <TableCell>{ship.localization.mark.en ?? ship.name}</TableCell>
              <TableCell>{ship.level}</TableCell>
              <TableCell>{ship.nation}</TableCell>
            </TableRow>
          ))}
          {ships.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={3}>No ships found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});
