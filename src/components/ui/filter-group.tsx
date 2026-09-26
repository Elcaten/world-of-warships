import clsx from "clsx";
import type { ReactNode } from "react";

type Props<T extends string | number> = {
  label: string;
  icon: ReactNode;
  allLabel?: string;
  compact?: boolean;
  options: { value: T; label: string; icon?: ReactNode }[];
  selected: T[] | undefined;
  onChange: (value: T[] | undefined) => void;
};

export function FilterGroup<T extends string | number>({
  label,
  icon,
  allLabel = "All",
  compact = false,
  options,
  selected,
  onChange,
}: Props<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 flex items-center gap-2 font-mono text-xs text-fleet-muted uppercase">
        {icon}
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        <FilterButton
          compact={compact}
          selected={!selected?.length}
          onClick={() => onChange(undefined)}
        >
          {allLabel}
        </FilterButton>
        {options.map((option) => (
          <FilterButton
            key={option.value}
            compact={compact}
            selected={selected?.includes(option.value) ?? false}
            onClick={() => {
              const next = selected?.includes(option.value)
                ? selected.filter((value) => value !== option.value)
                : [...(selected ?? []), option.value];
              onChange(next.length ? next : undefined);
            }}
          >
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            {option.label}
          </FilterButton>
        ))}
      </div>
    </fieldset>
  );
}

function FilterButton({
  compact,
  selected,
  onClick,
  children,
}: {
  compact: boolean;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center justify-center gap-2 border border-transparent bg-fleet-deep p-2 text-fleet-secondary uppercase hover:border-fleet-cyan aria-pressed:border-fleet-cyan aria-pressed:bg-fleet-line aria-pressed:text-fleet-highlight",
        compact ? "min-w-9 font-heading text-sm font-bold" : "font-mono text-xs",
      )}
    >
      {children}
    </button>
  );
}
