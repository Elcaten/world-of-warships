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
import type { FleetQueryState } from "@/lib/useFleetQueryState";

type FilterValue = Pick<
  FleetQueryState,
  "types" | "premium" | "nations" | "levels"
>;

type ShipFiltersProps = {
  value: FilterValue;
  onChange: (patch: Partial<FilterValue>) => void;
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
        label="Premium"
        icon={<Icon name="tier" className="text-fleet-gold size-4" />}
        count={3}
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

export function ShipFilters({ value, onChange }: ShipFiltersProps) {
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
  const nations = nationsQuery.data;
  const vehicleTypes = vehicleTypesQuery.data;

  return (
    <section aria-label="Ship filters" className="flex flex-col gap-4">
      <FilterGroup
        label="Class"
        icon={<Icon name="anchor" className="text-fleet-cyan size-4" />}
        allLabel="All hulls"
        selected={value.types}
        onChange={(types) => onChange({ types })}
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
        label="Premium"
        icon={<Icon name="tier" className="text-fleet-gold size-4" />}
        selectionMode="single"
        selected={
          value.premium === undefined
            ? undefined
            : [value.premium ? "premium" : "regular"]
        }
        onChange={(selected) =>
          onChange({
            premium: selected?.length ? selected[0] === "premium" : undefined,
          })
        }
        options={[
          { value: "premium", label: "Premium", tone: "gold" },
          { value: "regular", label: "Regular" },
        ]}
      />
      <FilterGroup
        label="Nation"
        icon={<Icon name="flag" className="text-fleet-gold size-4" />}
        allLabel="All nations"
        selected={value.nations}
        onChange={(nations) => onChange({ nations })}
        options={nations.map((nation) => ({
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
        selected={value.levels}
        onChange={(levels) => onChange({ levels })}
        options={tiers.map((value) => ({ value, label: tierLabel(value) }))}
      />
    </section>
  );
}
