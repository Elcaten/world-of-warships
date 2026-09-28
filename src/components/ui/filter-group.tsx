import clsx from "clsx";
import type { ReactNode } from "react";

type FilterGroupLayoutProps = {
  label: string;
  icon: ReactNode;
};

type Props<T extends string | number> = FilterGroupLayoutProps & {
  allLabel?: string;
  options: { value: T; label: string; icon?: ReactNode }[];
  selected: T[] | undefined;
  onChange: (value: T[] | undefined) => void;
};

function FilterGroupFrame({
  label,
  icon,
  children,
}: FilterGroupLayoutProps & { children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-fleet-muted mb-2 flex items-center gap-2 font-mono text-xs uppercase">
        {icon}
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function FilterGroupSkeleton({
  label,
  icon,
  count,
}: FilterGroupLayoutProps & { count: number }) {
  const widths = ["w-24", "w-28", "w-32"];

  return (
    <FilterGroupFrame label={label} icon={icon}>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={clsx("bg-fleet-line shrink-0 motion-safe:animate-pulse", [
            "h-8.5",
            widths[index % widths.length],
          ])}
        />
      ))}
    </FilterGroupFrame>
  );
}

export function FilterGroup<T extends string | number>({
  label,
  icon,
  allLabel = "All",
  options,
  selected,
  onChange,
}: Props<T>) {
  return (
    <FilterGroupFrame label={label} icon={icon}>
      <FilterButton
        selected={!selected?.length}
        onClick={() => onChange(undefined)}
      >
        {allLabel}
      </FilterButton>
      {options.map((option) => (
        <FilterButton
          key={option.value}
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
    </FilterGroupFrame>
  );
}

function FilterButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        "bg-fleet-deep text-fleet-secondary hover:border-fleet-cyan aria-pressed:border-fleet-cyan aria-pressed:bg-fleet-line aria-pressed:text-fleet-highlight inline-flex min-w-10 items-center justify-center gap-2 border border-transparent p-2 text-xs uppercase"
      }
    >
      {children}
    </button>
  );
}
