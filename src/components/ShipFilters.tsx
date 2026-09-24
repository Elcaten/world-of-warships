import { Field, Label } from "@headlessui/react";
import { useNations, useVehicleTypes } from "../api/encyclopedia";
import { Checkbox } from "./ui/checkbox";

type ShipFiltersProps = {
  types: string[] | undefined;
  nations: string[] | undefined;
  onTypesChange: (types: string[] | undefined) => void;
  onNationsChange: (nations: string[] | undefined) => void;
};

export function ShipFilters({
  types,
  nations,
  onTypesChange,
  onNationsChange,
}: ShipFiltersProps) {
  const vehicleTypes = useVehicleTypes();
  const nationCatalogue = useNations();
  const groups = [
    {
      label: "Vehicle type",
      selected: types,
      onChange: onTypesChange,
      query: vehicleTypes,
      options: Object.entries(vehicleTypes.data ?? {})
        .sort(([, a], [, b]) => a.sort_order - b.sort_order)
        .map(([value, type]) => ({
          value,
          label: type.localization.mark.en ?? value,
        })),
    },
    {
      label: "Nation",
      selected: nations,
      onChange: onNationsChange,
      query: nationCatalogue,
      options: (nationCatalogue.data ?? []).map((nation) => ({
        value: nation.name,
        label: nation.localization.mark.en ?? nation.name,
      })),
    },
  ];

  return (
    <section
      aria-label="Ship filters"
      className="space-y-4 rounded-lg bg-white p-4 text-sm dark:bg-slate-800 dark:text-white"
    >
      {groups.map(({ label, selected, onChange, query, options }) => {
        const selectedValues = selected ?? options.map((option) => option.value);

        return (
          <fieldset key={label}>
            <legend className="mb-2 font-medium">{label}</legend>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  className="cursor-pointer rounded border border-current/20 px-2 py-0.5 hover:bg-blue-500/10"
                  onClick={() => onChange(undefined)}
                >
                  All
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded border border-current/20 px-2 py-0.5 hover:bg-blue-500/10"
                  onClick={() => onChange([])}
                >
                  None
                </button>
              </div>
              {query.isError ? (
                <p>Could not load filter options.</p>
              ) : query.isPending ? (
                <p>Loading options…</p>
              ) : (
                options.map((option) => (
                  <Field key={option.value} className="flex items-center gap-2">
                    <Checkbox
                      color="blue"
                      checked={selectedValues.includes(option.value)}
                      onChange={(checked) =>
                        onChange(
                          checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter((value) => value !== option.value),
                        )
                      }
                    />
                    <Label className="cursor-pointer">{option.label}</Label>
                  </Field>
                ))
              )}
            </div>
          </fieldset>
        );
      })}
    </section>
  );
}
