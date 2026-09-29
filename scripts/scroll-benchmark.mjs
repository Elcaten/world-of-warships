import { chromium } from "playwright";
import { build } from "vite";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { resolve, join } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";
import { benchmarkVariant, variants } from "./scroll-benchmark/variants.mjs";
import { snapshot, serveBuild } from "./scroll-benchmark/server.mjs";
import { analyze } from "./scroll-benchmark/report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({
  options: {
    variants: { type: "string", default: "baseline,seek" },
    runs: { type: "string", default: "3" },
    speed: { type: "string", default: "20000" },
    distance: { type: "string", default: "18000" },
    cpu: { type: "string", default: "1" },
    width: { type: "string", default: "1000" },
    height: { type: "string", default: "684" },
    browser: { type: "string" },
    "browser-arg": { type: "string", multiple: true, default: [] },
    headed: { type: "boolean", default: false },
    cold: { type: "boolean", default: false },
    probe: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});
if (values.help) {
  console.log(`Usage: npm run perf:scroll -- [options]
  --variants=${variants.join(",")}
  --runs=3 --speed=20000 --distance=18000 --cpu=1
  --width=1000 --height=684 --headed --browser=/path/to/chrome
  --browser-arg=--some-chromium-flag  Repeatable; applies only to the test browser
  --cold  Skip browser image-cache warmup (local asset snapshot is still reused)
  --probe Add a diagnostic RAF/DOM coverage probe; it adds measurement overhead

Creates isolated production builds and Chrome traces in .scroll-benchmark/.
First use fetches and caches the public API, images, and fonts. Subsequent runs
replay that snapshot. No application source or dist/ files are changed.`);
  process.exit(0);
}
const selected = [...new Set(values.variants.split(","))];
for (const variant of selected)
  if (!variants.includes(variant))
    throw new Error(`Unknown variant ${variant}`);
const positive = (key) => {
  const value = Number(values[key]);
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`Invalid --${key}`);
  return value;
};
const options = {
  ...values,
  runs: positive("runs"),
  speed: positive("speed"),
  distance: positive("distance"),
  cpu: positive("cpu"),
  width: positive("width"),
  height: positive("height"),
};
if (!Number.isInteger(options.runs))
  throw new Error("--runs must be an integer");
const timestamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");
const output = join(root, ".scroll-benchmark", timestamp);
const cache = join(root, ".scroll-benchmark", "cache");
await mkdir(output, { recursive: true });

async function executable() {
  if (values.browser || process.env.SCROLL_BENCHMARK_BROWSER)
    return values.browser || process.env.SCROLL_BENCHMARK_BROWSER;
  for (const path of [
    chromium.executablePath(),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Helium.app/Contents/MacOS/Helium",
  ]) {
    try {
      await access(path);
      return path;
    } catch {
      /* Try the next installed browser. */
    }
  }
  throw new Error(
    "Install a browser with npx playwright install chromium, or pass --browser=/path/to/chrome",
  );
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    await Promise.all(
      [...document.images].map((image) => image.decode().catch(() => {})),
    );
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}

async function warmup(page, startY) {
  // Warm identical image URLs for every variant. Programmatic scrolling alone
  // can leave seek mode active, so it does not reliably warm the image cache.
  const paths = [
    ...new Set([
      ...Object.values(data.vehicles.json.data).map(
        (ship) => ship.icons.contour_alive,
      ),
      ...data.nations.json.data.map((nation) => nation.icons.small),
      ...Object.values(data.vehicle_types_common.json.data).map(
        (type) => type.icons.default,
      ),
    ]),
  ];
  await page.evaluate(async (paths) => {
    let next = 0;
    await Promise.all(
      Array.from({ length: 8 }, async () => {
        while (next < paths.length) {
          const image = new Image();
          image.src = new URL(
            paths[next++],
            `${location.origin}/__media/`,
          ).href;
          await image.decode();
        }
      }),
    );
  }, paths);
  const max = Math.min(
    startY + options.distance * 2 + options.height * 2,
    await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight,
    ),
  );
  for (let y = startY; y <= max; y += 1000) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(40);
    await waitForImages(page);
  }
  await page.evaluate((y) => scrollTo(0, y), startY);
  await page.waitForTimeout(250);
  await waitForImages(page);
}

async function record(browser, host, variant, repeat) {
  const directory = join(output, `${repeat}-${variant}`);
  await mkdir(directory);
  const context = await browser.newContext({
    viewport: { width: options.width, height: options.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  try {
    await page.goto(`${host.url}/?view=table`);
    await page.getByRole("table").waitFor({ timeout: 60_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await waitForImages(page);
    const startY = await page
      .locator("table")
      .evaluate((el) => el.getBoundingClientRect().top + scrollY + 150);
    if (!values.cold) await warmup(page, startY);
    else {
      await page.evaluate((y) => scrollTo(0, y), startY);
      await page.waitForTimeout(250);
    }
    const geometry = await page.locator("table").evaluate((table) => ({
      tableWidth: table.getBoundingClientRect().width,
      wrapperOverflow: [
        getComputedStyle(
          table.closest(".overflow-x-auto") ?? table.parentElement,
        ).overflowX,
        getComputedStyle(
          table.closest(".overflow-x-auto") ?? table.parentElement,
        ).overflowY,
      ],
      rowHeights: [
        ...new Set(
          [...table.querySelectorAll("tr[data-index]")].map(
            (row) => row.getBoundingClientRect().height,
          ),
        ),
      ],
      rows: table.querySelectorAll("tr[data-index]").length,
    }));
    await page.mouse.move(options.width / 2, options.height / 2);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: options.cpu });
    await cdp.send("Tracing.start", {
      categories: [
        "devtools.timeline",
        "disabled-by-default-devtools.timeline",
        "disabled-by-default-devtools.timeline.frame",
        "disabled-by-default-devtools.screenshot",
        "blink.user_timing",
        "benchmark",
        "cc",
        "input",
        "latencyInfo",
        "toplevel",
      ].join(","),
      transferMode: "ReturnAsStream",
    });
    if (values.probe) {
      await page.evaluate(() => {
        window.__scrollBenchmarkFrames = [];
        window.__scrollBenchmarkRecording = true;
        const tick = (now) => {
          if (!window.__scrollBenchmarkRecording) return;
          const rows = [
            ...document.querySelectorAll(
              "tbody tr[data-index], tbody tr[data-benchmark-placeholder]",
            ),
          ];
          const rects = rows.map((row) => row.getBoundingClientRect());
          const visible = rects.filter(
            (rect) => rect.bottom > 0 && rect.top < innerHeight,
          );
          window.__scrollBenchmarkFrames.push({
            now,
            scrollY,
            mounted: rows.length,
            visible: visible.length,
            top: rects[0]?.top,
            bottom: rects.at(-1)?.bottom,
          });
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
    const startClock = await page.evaluate(() => {
      window.__scrollBenchmarkMeasuring = true;
      console.timeStamp("scroll-benchmark:start");
      return performance.now();
    });
    const positions = [];
    // The browser generates input at a fixed speed; Node and React do not pace it.
    for (const [index, direction] of [1, 1, -1, -1].entries()) {
      await cdp.send("Input.synthesizeScrollGesture", {
        x: options.width / 2,
        y: options.height / 2,
        yDistance: -direction * options.distance,
        speed: options.speed,
        preventFling: true,
        gestureSourceType: "mouse",
        interactionMarkerName: `scroll-benchmark-${index}`,
      });
      await page.waitForTimeout(200);
      positions.push(await page.evaluate(() => scrollY));
    }
    await page.evaluate(() => console.timeStamp("scroll-benchmark:end"));
    const completed = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    const { stream, dataLossOccurred } = await completed;
    if (dataLossOccurred) throw new Error("Chrome reported trace data loss");
    let raw = "";
    for (;;) {
      const chunk = await cdp.send("IO.read", {
        handle: stream,
        size: 1024 * 1024,
      });
      raw += chunk.base64Encoded
        ? Buffer.from(chunk.data, "base64").toString()
        : chunk.data;
      if (chunk.eof) break;
    }
    await cdp.send("IO.close", { handle: stream });
    if (values.probe) {
      const probe = await page.evaluate(() => {
        window.__scrollBenchmarkRecording = false;
        return window.__scrollBenchmarkFrames;
      });
      await writeFile(
        join(directory, "dom-probe.json"),
        JSON.stringify({ startClock, frames: probe }, null, 2),
      );
    }
    await page.screenshot({ path: join(directory, "final.png") });
    await writeFile(join(directory, "trace.json.gz"), gzipSync(raw));
    const stats = await analyze(JSON.parse(raw), directory);
    const result = {
      variant,
      repeat,
      ...stats,
      startY,
      positions,
      geometry,
      errors,
      serverErrors: [...host.errors],
      positionErrors: positions.map(
        (position, index) =>
          position - (startY + [1, 2, 1, 0][index] * options.distance),
      ),
    };
    if (!stats.screenshotFrames)
      throw new Error("No screenshots captured; cannot check visual gaps");
    if (host.errors.length)
      throw new Error(`Asset replay failed: ${host.errors.join("; ")}`);
    result.validScrollPath = result.positionErrors.every(
      (error) => Math.abs(error) <= 200,
    );
    await writeFile(
      join(directory, "summary.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(
      JSON.stringify({
        variant,
        repeat,
        busyPct: stats.mainBusyPct,
        scrollP95: stats.scrollP95Ms,
        blankMs: stats.totalBlankMs,
        longestBlankMs: stats.longestBlankMs,
        frames: stats.screenshotFrames,
        missingContent: stats.pipelineMissingContent,
        validScrollPath: result.validScrollPath,
      }),
    );
    return result;
  } finally {
    await context.close();
  }
}

console.log(`Output: ${output}`);
console.log("Loading cached catalogue snapshot...");
const data = await snapshot(cache);
const hosts = new Map();
let browser;
try {
  for (const variant of selected) {
    const directory = join(output, "builds", variant);
    await build({
      root,
      logLevel: "error",
      plugins: [benchmarkVariant(variant)],
      build: { outDir: directory, emptyOutDir: true },
    });
    hosts.set(variant, await serveBuild(directory, cache, data));
  }
  const browserPath = await executable();
  browser = await chromium.launch({
    executablePath: browserPath,
    headless: !values.headed,
    args: ["--disable-extensions", ...values["browser-arg"]],
  });
  const browserSession = await browser.newBrowserCDPSession();
  const system = await browserSession.send("SystemInfo.getInfo");
  const sourceFiles = [
    "src/components/features/ShipTable/ShipsTable.tsx",
    "src/components/features/ShipTable/ShipTableCells.tsx",
    "src/components/ui/table.tsx",
    "src/index.css",
    "scripts/scroll-benchmark.mjs",
    "scripts/scroll-benchmark/variants.mjs",
    "scripts/scroll-benchmark/report.mjs",
    "scripts/scroll-benchmark/server.mjs",
    "package-lock.json",
  ];
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (path) => [
        path,
        createHash("sha256")
          .update(await readFile(join(root, path)))
          .digest("hex"),
      ]),
    ),
  );
  await writeFile(
    join(output, "environment.json"),
    JSON.stringify(
      {
        options,
        browser: browser.version(),
        browserPath,
        gpu: {
          devices: system.gpu.devices,
          featureStatus: system.gpu.featureStatus,
          glRenderer: system.gpu.auxAttributes?.glRenderer,
        },
        platform: process.platform,
        arch: process.arch,
        node: process.version,
        catalogueShips: Object.keys(data.vehicles.json.data).length,
        apiHashes: Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value.sha256]),
        ),
        sourceHashes,
      },
      null,
      2,
    ),
  );
  const results = [];
  // Rotate order to reduce systematic warmup/thermal bias.
  for (let repeat = 1; repeat <= options.runs; repeat++) {
    const order = [
      ...selected.slice((repeat - 1) % selected.length),
      ...selected.slice(0, (repeat - 1) % selected.length),
    ];
    for (const variant of order) {
      results.push(await record(browser, hosts.get(variant), variant, repeat));
      await writeFile(
        join(output, "results.json"),
        JSON.stringify(results, null, 2),
      );
    }
  }
  console.log(
    `Done. Open a run's filmstrip.html or import trace.json.gz into Chrome Performance.\n${output}`,
  );
  if (results.some((result) => !result.validScrollPath)) {
    console.error(
      "Some runs did not follow the expected scroll path. Inspect positionErrors before comparing their timings.",
    );
    process.exitCode = 1;
  }
} finally {
  await browser?.close();
  await Promise.all([...hosts.values()].map((host) => host.close()));
}
