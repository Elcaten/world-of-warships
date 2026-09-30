import {
  useNationsQuery,
  useShipTiersQuery,
  useVehicleTypesQuery,
} from "@/api/encyclopedia";
import { NationFlag } from "@/components/domain/NationFlag";
import { VehicleTypeIcon } from "@/components/domain/VehicleTypeIcon";
import { FilterGroup, FilterGroupSkeleton } from "@/components/ui/filter-group";
import { Icon } from "@/components/ui/icon";
import { tierLabel } from "@/lib/ships";

type ShipFiltersProps = {
  types: string[] | undefined;
  nations: string[] | undefined;
  levels: number[] | undefined;
  onTypesChange: (types: string[] | undefined) => void;
  onNationsChange: (nations: string[] | undefined) => void;
  onLevelsChange: (levels: number[] | undefined) => void;
};

function ShipFiltersSkeleton() {
  return (
    <section
      aria-label="Ship filters"
      aria-busy="true"
      className="flex flex-col gap-4"
    >
      <p className="sr-only">Loading ship filters…</p>
      <FilterGroupSkeleton
        label="Class"
        icon={<Icon name="anchor" className="text-fleet-cyan size-4" />}
        count={4}
      />
      <FilterGroupSkeleton
        label="Nation"
        icon={<Icon name="flag" className="text-fleet-gold size-4" />}
        count={10}
      />
      <FilterGroupSkeleton
        label="Ship tier"
        icon={<Icon name="tier" className="text-fleet-cyan size-4" />}
        count={3}
      />
    </section>
  );
}

export function ShipFilters({
  types,
  nations,
  levels,
  onTypesChange,
  onNationsChange,
  onLevelsChange,
}: ShipFiltersProps) {
  const tiersQuery = useShipTiersQuery();
  const nationsQuery = useNationsQuery();
  const vehicleTypesQuery = useVehicleTypesQuery();
  const queries = [tiersQuery, nationsQuery, vehicleTypesQuery];

  if (queries.some((query) => query.isError && query.data === undefined)) {
    return null;
  }

  if (!tiersQuery.data || !nationsQuery.data || !vehicleTypesQuery.data) {
    return <ShipFiltersSkeleton />;
  }

  const tiers = tiersQuery.data;
  const nationCatalogue = nationsQuery.data;
  const vehicleTypes = vehicleTypesQuery.data;

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
            label: type.localization.shortmark.en ?? value,
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
        selected={levels}
        onChange={onLevelsChange}
        options={tiers.map((value) => ({ value, label: tierLabel(value) }))}
      />
    </section>
  );
}
