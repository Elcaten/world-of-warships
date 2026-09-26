import type { Nations, VehicleTypes } from "../api/encyclopedia";
import { tierLabel } from "../lib/ships";
import { NationFlag } from "./NationFlag";
import { VehicleTypeIcon } from "./VehicleTypeIcon";
import { FilterGroup } from "./ui/filter-group";
import { Icon } from "./ui/icon";

type ShipFiltersProps = {
  types: string[] | undefined;
  nations: string[] | undefined;
  levels: number[] | undefined;
  tiers: number[];
  nationCatalogue: Nations;
  vehicleTypes: VehicleTypes;
  onTypesChange: (types: string[] | undefined) => void;
  onNationsChange: (nations: string[] | undefined) => void;
  onLevelsChange: (levels: number[] | undefined) => void;
};

export function ShipFilters({
  types,
  nations,
  levels,
  tiers,
  nationCatalogue,
  vehicleTypes,
  onTypesChange,
  onNationsChange,
  onLevelsChange,
}: ShipFiltersProps) {
  return (
    <section aria-label="Ship filters" className="flex flex-col gap-4">
      <FilterGroup
        label="Class"
        icon={<Icon name="anchor" className="text-fleet-cyan size-4" />}
        allLabel="All hulls"
        selected={types}
        onChange={onTypesChange}
        options={Object.entries(vehicleTypes)
          .sort(([, a], [, b]) => a.sort_order - b.sort_order)
          .map(([value, type]) => ({
            value,
            label: type.localization.mark.en ?? value,
            icon: (
              <VehicleTypeIcon
                vehicleType={value}
                className="size-4 object-contain"
              />
            ),
          }))}
      />
      <FilterGroup
        label="Nation"
        icon={<Icon name="flag" className="text-fleet-gold size-4" />}
        allLabel="All nations"
        selected={nations}
        onChange={onNationsChange}
        options={nationCatalogue.map((nation) => ({
          value: nation.name,
          label: nation.localization.mark.en ?? nation.name,
          icon: (
            <NationFlag
              nation={nation.name}
              size="tiny"
              className="h-4 w-5 object-contain"
            />
          ),
        }))}
      />
      <FilterGroup
        label="Ship tier"
        icon={<Icon name="tier" className="text-fleet-cyan size-4" />}
        compact
        selected={levels}
        onChange={onLevelsChange}
        options={tiers.map((value) => ({ value, label: tierLabel(value) }))}
      />
    </section>
  );
}
