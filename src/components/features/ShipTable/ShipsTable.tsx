import type { Ship } from "@/api/encyclopedia";
import { Table, TableBody, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";
import { TableVirtuoso, type TableComponents } from "react-virtuoso";
import { ShipTableCells } from "./ShipTableCells";
import { fallbackContours } from "./fallbackContours";

// A normal first row lets the headings scroll away with the table.
type FleetRow = Ship | null;

const tableComponents: TableComponents<FleetRow> = {
  Table: ({ context: _context, children, ...props }) => (
    <Table {...props} className="min-w-3xl table-fixed border-separate">
      <colgroup>
        <col className="w-[45%]" />
        <col className="w-[25%]" />
        <col className="w-[22%]" />
        <col className="w-[8%]" />
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
  onViewDetails?: (ship: Ship) => void;
};

export function ShipsTable({
  ships,
  mediaPath,
  onViewDetails,
}: ShipsTableProps) {
  const rows = useMemo(() => [null, ...ships], [ships]);

  return (
    <div className="border-fleet-line bg-fleet-panel overflow-x-auto overflow-y-hidden border">
      <TableVirtuoso
        useWindowScroll
        increaseViewportBy={{ top: 800, bottom: 1200 }}
        data={rows}
        components={tableComponents}
        computeItemKey={(_, ship) => (ship ? `ship-${ship.id}` : "headings")}
        itemContent={(index, ship) => {
          return ship ? (
            <ShipTableCells
              fallbackContour={
                fallbackContours[index % fallbackContours.length]
              }
              ship={ship}
              mediaPath={mediaPath}
              onViewDetails={onViewDetails}
            />
          ) : (
            <>
              <TableHeader scope="col">Ship</TableHeader>
              <TableHeader scope="col">Nation</TableHeader>
              <TableHeader scope="col">Type</TableHeader>
              <TableHeader scope="col">Tier</TableHeader>
            </>
          );
        }}
      />
    </div>
  );
}
