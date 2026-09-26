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
    <fieldset className="relative m-0 min-w-0 border-0 p-0 md:pl-32">
      <legend className="mb-2.5 flex items-center gap-2 font-mono text-xs font-medium text-fleet-muted uppercase md:absolute md:top-[7px] md:left-0 md:mb-0">
        {icon}
        {label}
      </legend>
      <div
        className={`flex flex-wrap gap-1.5 ${compact ? "[&_button]:min-w-8.5 [&_button]:font-heading [&_button]:text-sm [&_button]:font-bold" : ""}`}
      >
        <button
          className="inline-flex min-h-9 items-center justify-center gap-1.5 border border-transparent bg-fleet-deep px-2.5 py-1.25 font-mono text-[11px]/[1.4] font-medium text-fleet-secondary uppercase hover:border-fleet-cyan/45 hover:text-white aria-pressed:border-fleet-cyan aria-pressed:bg-fleet-cyan aria-pressed:text-fleet-on-cyan md:min-h-8 aria-pressed:[&_img]:brightness-35"
          aria-pressed={!selected?.length}
          onClick={() => onChange(undefined)}
        >
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 border border-transparent bg-fleet-deep px-2.5 py-1.25 font-mono text-[11px]/[1.4] font-medium text-fleet-secondary uppercase hover:border-fleet-cyan/45 hover:text-white aria-pressed:border-fleet-cyan aria-pressed:bg-fleet-cyan aria-pressed:text-fleet-on-cyan md:min-h-8 aria-pressed:[&_img]:brightness-35"
            aria-pressed={selected?.includes(option.value) ?? false}
            onClick={() => {
              const next = selected?.includes(option.value)
                ? selected.filter((value) => value !== option.value)
                : [...(selected ?? []), option.value];
              onChange(next.length ? next : undefined);
            }}
          >
            <span aria-hidden="true">{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
