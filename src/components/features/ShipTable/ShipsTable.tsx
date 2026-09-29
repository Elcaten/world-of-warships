import { type Nations, type Ship, type VehicleTypes } from "@/api/encyclopedia";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { useCallback, useMemo } from "react";
import { TableVirtuoso, type TableComponents } from "react-virtuoso";
import { ShipTableCells } from "./ShipTableCells";

// A normal first row lets the headings scroll away with the table.
type FleetRow = Ship | null;

const tableComponents: TableComponents<FleetRow> = {
  Table: ({ context: _context, children, ...props }) => (
    <Table {...props} className="table-fixed">
      <colgroup>
        <col className="w-[50%] md:w-[55%]" />
        <col className="w-[20%] md:w-[25%]" />
        <col className="w-[15%] md:w-[10%]" />
        <col className="w-[15%] md:w-[10%]" />
      </colgroup>
      {children}
    </Table>
  ),
  TableBody: ({ context: _context, ...props }) => <TableBody {...props} />,
  TableRow: ({ context: _context, item: _item, ...props }) => (
    <TableRow
      {...props}
      data-striped={
        props["data-index"] > 0 && props["data-index"] % 2 === 0
          ? ""
          : undefined
      }
    />
  ),
};

type ShipsTableProps = {
  ships: Ship[];
  mediaPath: string;
  nations: Nations;
  vehicleTypes: VehicleTypes;
  onViewDetails: (ship: Ship) => void;
};

export function ShipsTable({
  ships,
  mediaPath,
  nations,
  vehicleTypes,
  onViewDetails,
}: ShipsTableProps) {
  const rows = useMemo(() => [null, ...ships], [ships]);
  const nationsByName = useMemo(
    () => new Map(nations.map((nation) => [nation.name, nation])),
    [nations],
  );
  const itemContent = useCallback(
    (_index: number, ship: FleetRow) =>
      ship ? (
        <ShipTableCells
          ship={ship}
          nation={nationsByName.get(ship.nation)}
          vehicleType={vehicleTypes[ship.vehicleType]}
          mediaPath={mediaPath}
          onViewDetails={onViewDetails}
        />
      ) : (
        <>
          <TableHeader scope="col">Ship</TableHeader>
          <TableHeader scope="col">Nation</TableHeader>
          <TableHeader scope="col" className="text-end">
            Type
          </TableHeader>
          <TableHeader scope="col">Tier</TableHeader>
        </>
      ),
    [mediaPath, nationsByName, onViewDetails, vehicleTypes],
  );

  return (
    <TableVirtuoso
      useWindowScroll
      increaseViewportBy={{ top: 800, bottom: 800 }}
      skipAnimationFrameInResizeObserver
      data={rows}
      components={tableComponents}
      computeItemKey={(_, ship) => (ship ? `ship-${ship.id}` : "headings")}
      itemContent={itemContent}
    />
  );
}
