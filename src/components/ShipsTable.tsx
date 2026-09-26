import type { Ship } from "../api/encyclopedia";
import { ShipTableRow } from "./ShipTableRow";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "./ui/table";

type ShipsTableProps = {
  ships: Ship[];
  mediaPath: string;
  onViewDetails?: (ship: Ship) => void;
};

export function ShipsTable({
  ships,
  mediaPath,
  onViewDetails,
}: ShipsTableProps) {
  return (
    <Table
      striped
      className="border border-fleet-line bg-fleet-panel px-3 sm:px-5 [&_th]:py-4 [&_tbody_tr:hover]:bg-fleet-cyan/3"
    >
      <TableHead className="font-mono text-[11px] font-medium uppercase">
        <TableRow>
          <TableHeader scope="col">Ship</TableHeader>
          <TableHeader scope="col">Nation</TableHeader>
          <TableHeader scope="col">Type</TableHeader>
          <TableHeader scope="col">Tier</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        {ships.map((ship) => (
          <ShipTableRow
            key={ship.id}
            ship={ship}
            mediaPath={mediaPath}
            onViewDetails={onViewDetails}
          />
        ))}
      </TableBody>
    </Table>
  );
}
