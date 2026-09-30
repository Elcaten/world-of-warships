import { afterEach, expect, it, vi } from "vitest";
import currentTable from "../../src/components/features/ShipTable/ShipsTable.tsx?raw";
import { benchmarkVariant } from "./variants.mjs";

const tableId = "/src/components/features/ShipTable/ShipsTable.tsx";

afterEach(() => vi.restoreAllMocks());

it("accepts the current synchronous baseline and points to a distinct comparison", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(benchmarkVariant("baseline").transform(currentTable, tableId)).toBe(
    currentTable,
  );
  expect(
    benchmarkVariant("sync-measure").transform(currentTable, tableId),
  ).toBe(currentTable);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining("use raf-measure"));
  const raf = benchmarkVariant("raf-measure").transform(currentTable, tableId);
  expect(raf).toContain("skipAnimationFrameInResizeObserver={false}");
  expect(raf.match(/skipAnimationFrameInResizeObserver/g)).toHaveLength(1);
});

it.each([
  ["", false],
  ["skipAnimationFrameInResizeObserver", true],
  ["skipAnimationFrameInResizeObserver={true}", true],
  ["skipAnimationFrameInResizeObserver = { false }", false],
])(
  "sets both measurement modes for prop %j without duplicates",
  (prop, baselineSkipsRaf) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const source = `const table = <TableVirtuoso ${prop} data={rows} />;`;

    for (const [variant, skipRaf] of [
      ["sync-measure", true],
      ["raf-measure", false],
    ]) {
      warn.mockClear();
      const result = benchmarkVariant(variant).transform(source, tableId);
      if (baselineSkipsRaf === skipRaf) {
        expect(result).toBe(source);
        expect(warn).toHaveBeenCalledOnce();
      } else {
        expect(result).toContain(
          `skipAnimationFrameInResizeObserver={${skipRaf}}`,
        );
        expect(
          result.match(/skipAnimationFrameInResizeObserver/g),
        ).toHaveLength(1);
        expect(warn).not.toHaveBeenCalled();
      }
      expect(result).toContain("data={rows}");
    }
  },
);

it.each(["sync-measure", "raf-measure"])(
  "fails on unsupported measurement structure for %s",
  (variant) => {
    const plugin = benchmarkVariant(variant);
    expect(() => plugin.transform("const table = null;", tableId)).toThrow(
      "measurement",
    );
    expect(() =>
      plugin.transform(
        "const table = <TableVirtuoso skipAnimationFrameInResizeObserver={dynamic} />;",
        tableId,
      ),
    ).toThrow("measurement");
  },
);
