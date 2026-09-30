// Applied only to isolated benchmark builds. Application files are never edited.
export const variants = [
  "baseline",
  "seek",
  "light",
  "static-images",
  "no-clip",
  "large-buffer",
  "sync-measure",
  "raf-measure",
];

function replaceOnce(source, pattern, replacement, label) {
  if (!pattern.test(source))
    throw new Error(`Benchmark transform no longer matches: ${label}`);
  return source.replace(pattern, replacement);
}

export function benchmarkVariant(variant) {
  if (!variants.includes(variant))
    throw new Error(`Unknown variant: ${variant}`);
  return {
    name: `scroll-benchmark-${variant}`,
    enforce: "pre",
    transform(source, id) {
      if (id.endsWith("/ShipTable/ShipsTable.tsx")) {
        if (variant === "seek") {
          source = replaceOnce(
            source,
            /const tableComponents[^=]*= \{/,
            `$&
  ScrollSeekPlaceholder: ({ height, index }) => (
    <tr data-benchmark-placeholder={index} style={{ height, background: index % 2 ? '#15232c' : '#0c141b' }}>
      <td colSpan={4} style={{ height, padding: '0 16px' }}>
        <div style={{ height: 4, width: '70%', background: '#87989f' }} />
      </td>
    </tr>
  ),`,
            "seek placeholder",
          );
          source = replaceOnce(
            source,
            /<TableVirtuoso\b/,
            "$& scrollSeekConfiguration={benchmarkScrollSeek}",
            "seek prop",
          );
          source +=
            "\nconst benchmarkScrollSeek = { enter: (velocity: number) => globalThis.__scrollBenchmarkMeasuring === true && Math.abs(velocity) > 200, exit: (velocity: number) => Math.abs(velocity) < 60 };\n";
        }
        if (variant === "light") {
          source = replaceOnce(
            source,
            /import \{ ShipTableCells \} from "\.\/ShipTableCells";/,
            "",
            "light import",
          );
          source += `
function ShipTableCells({ ship, nation, vehicleType }: { ship: Ship; nation?: Nations[number]; vehicleType?: VehicleTypes[string]; [key: string]: unknown }) {
  return <>
    <td style={{ padding: 16, height: 69 }}><div style={{ height: 32, display: 'flex', alignItems: 'center' }}><span style={{ width: 96, height: 4, background: '#87989f', marginRight: 12 }} />{ship.localization.mark.en ?? ship.name}</div></td>
    <td style={{ padding: 16 }}>{nation?.localization.mark.en ?? ship.nation}</td>
    <td style={{ padding: 16 }}>{vehicleType?.localization.mark.en ?? ship.vehicleType}</td>
    <td style={{ padding: 16 }}>{ship.level}</td>
  </>;
}
`;
        }
        if (variant === "no-clip") {
          source = replaceOnce(
            source,
            /overflow-x-auto overflow-y-hidden/,
            "",
            "scroll wrapper",
          );
        }
        if (variant === "large-buffer") {
          source = replaceOnce(
            source,
            /increaseViewportBy=\{\{[^}]+\}\}/,
            "increaseViewportBy={{ top: 2400, bottom: 2400 }}",
            "buffer",
          );
        }
        if (variant === "sync-measure" || variant === "raf-measure") {
          const skipRaf = variant === "sync-measure";
          const prop =
            /\bskipAnimationFrameInResizeObserver\b(?:\s*=\s*\{\s*(true|false)\s*\})?(?!\s*=)/;
          const existing = source.match(prop);
          if (
            !/<TableVirtuoso\b/.test(source) ||
            (!existing && source.includes("skipAnimationFrameInResizeObserver"))
          )
            throw new Error(
              "Benchmark transform no longer matches: measurement",
            );
          const baselineSkipsRaf = existing ? existing[1] !== "false" : false;
          if (baselineSkipsRaf === skipRaf) {
            const alternative = skipRaf ? "raf-measure" : "sync-measure";
            // Vite's logLevel is "error", so this notice must bypass its logger.
            console.warn(
              `[scroll-benchmark] ${variant} matches baseline measurement; use ${alternative} to compare measurement modes.`,
            );
          } else {
            const replacement = `skipAnimationFrameInResizeObserver={${skipRaf}}`;
            source = existing
              ? source.replace(prop, replacement)
              : replaceOnce(
                  source,
                  /<TableVirtuoso\b/,
                  `$& ${replacement}`,
                  "measurement",
                );
          }
        }
        return source;
      }
      if (
        variant === "static-images" &&
        id.endsWith("/ShipTable/ShipTableCells.tsx")
      ) {
        source = replaceOnce(
          source,
          /const \[isImageLoaded, setIsImageLoaded\] = useState\(false\);/,
          "",
          "image state",
        );
        source = replaceOnce(
          source,
          /<div className="relative h-8 w-24 shrink-0">[\s\S]*?<\/div>/,
          `<img src={resolveMediaUrl(mediaPath, ship.icons.contour_alive)} alt="" className="h-8 w-24 shrink-0 object-contain" />`,
          "image loading markup",
        );
        return source;
      }
    },
  };
}
