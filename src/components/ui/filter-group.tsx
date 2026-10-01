import clsx from "clsx";
import type { ReactNode } from "react";
import { useId } from "react";

type FilterGroupLayoutProps = {
  label: string;
  icon: ReactNode;
};

type Props<T extends string | number> = FilterGroupLayoutProps & {
  allLabel?: string;
  selectionMode?: "multiple" | "single";
  options: {
    value: T;
    label: string;
    icon?: ReactNode;
    tone?: "gold";
  }[];
  selected: T[] | undefined;
  onChange: (value: T[] | undefined) => void;
};

function FilterGroupFrame({
  label,
  icon,
  children,
}: FilterGroupLayoutProps & { children: ReactNode }) {
  const labelId = useId();

  return (
    <div role="group" aria-labelledby={labelId} className="min-w-0">
      <div
        id={labelId}
        className="text-fleet-muted mb-2 flex items-center gap-2 font-mono text-xs uppercase"
      >
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
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
  selectionMode = "multiple",
  options,
  selected,
  onChange,
}: Props<T>) {
  const isAllOptionSelected = !selected?.length;

  return (
    <FilterGroupFrame label={label} icon={icon}>
      <FilterButton
        selected={isAllOptionSelected}
        onClick={() => onChange(undefined)}
      >
        {allLabel}
      </FilterButton>
      {options.map((option) => {
        const isOptionSelected = !!selected?.includes(option.value);
        return (
          <FilterButton
            key={option.value}
            selected={isOptionSelected}
            tone={option.tone}
            onClick={() => {
              if (selectionMode === "single") {
                onChange(isOptionSelected ? undefined : [option.value]);
                return;
              }
              const next = selected?.includes(option.value)
                ? selected.filter((value) => value !== option.value)
                : [...(selected ?? []), option.value];
              onChange(next.length ? next : undefined);
            }}
          >
            {option.icon && <span aria-hidden="true">{option.icon}</span>}
            {option.label}
          </FilterButton>
        );
      })}
    </FilterGroupFrame>
  );
}

function FilterButton({
  selected,
  tone,
  onClick,
  children,
}: {
  selected: boolean;
  tone?: "gold";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={clsx(
        "bg-fleet-deep text-fleet-secondary inline-flex min-w-10 items-center justify-center gap-2 border border-transparent p-2 text-xs uppercase transition-[background-color] duration-700 ease-out aria-pressed:duration-0",
        tone === "gold"
          ? "hover:border-fleet-gold hover:bg-fleet-gold/10 aria-pressed:border-fleet-gold aria-pressed:bg-fleet-gold/20 aria-pressed:text-fleet-gold hover:duration-0"
          : "hover:border-fleet-cyan aria-pressed:border-fleet-cyan aria-pressed:bg-fleet-line aria-pressed:text-fleet-highlight",
      )}
    >
      {children}
    </button>
  );
}
