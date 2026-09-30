import { Icon } from "@/components/ui/icon";
import * as Headless from "@headlessui/react";
import clsx from "clsx";
import { Fragment, type ReactNode } from "react";

export function Listbox<T>({
  className,
  "aria-label": ariaLabel,
  children: options,
  ...props
}: {
  className?: string;
  "aria-label": string;
  children: ReactNode;
} & Omit<
  Headless.ListboxProps<typeof Fragment, T>,
  "as" | "multiple" | "children"
>) {
  return (
    <Headless.Listbox {...props} multiple={false}>
      <Headless.ListboxButton
        aria-label={ariaLabel}
        className={clsx(
          "group bg-fleet-deep text-fleet-secondary hover:text-fleet-highlight data-focus:ring-fleet-cyan data-open:text-fleet-highlight flex min-w-0 items-center justify-between gap-3 p-3 text-left font-mono text-xs outline-none data-disabled:opacity-50 data-focus:ring-1",
          className,
        )}
      >
        <Headless.ListboxSelectedOption
          as="span"
          options={options}
          className="truncate"
        />
        <Icon
          name="down"
          className="text-fleet-muted size-4 shrink-0 group-data-open:rotate-180"
        />
      </Headless.ListboxButton>
      <Headless.ListboxOptions
        anchor="bottom start"
        modal={false}
        className="border-fleet-line bg-fleet-deep z-40 w-max max-w-[calc(100vw-2rem)] min-w-(--button-width) overflow-y-auto overscroll-contain border p-1 font-mono text-xs shadow-xl outline-none [--anchor-gap:4px] [--anchor-padding:16px]"
      >
        {options}
      </Headless.ListboxOptions>
    </Headless.Listbox>
  );
}

export function ListboxOption<T>({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & Omit<
  Headless.ListboxOptionProps<"div", T>,
  "as" | "className" | "children"
>) {
  return (
    <Headless.ListboxOption as={Fragment} {...props}>
      {({ selectedOption }) =>
        selectedOption ? (
          <span className={className}>{children}</span>
        ) : (
          <div className="group text-fleet-secondary data-focus:bg-fleet-line data-focus:text-fleet-highlight data-selected:text-fleet-highlight flex cursor-default items-center gap-2 p-3 outline-none select-none data-disabled:opacity-50">
            <Icon
              name="check"
              className="invisible size-4 shrink-0 group-data-selected:visible"
            />
            <span className={clsx("min-w-0 truncate", className)}>
              {children}
            </span>
          </div>
        )
      }
    </Headless.ListboxOption>
  );
}
