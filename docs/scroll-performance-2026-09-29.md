# Fast-scroll blank frames: September 29, 2026

The repeatable test reproduces the blank page and the improvement from scroll
seek placeholders. The strongest evidence points to Chromium's rendering and
activation pipeline falling behind compositor scrolling. Faster React handlers
alone do not explain or eliminate the gaps.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run perf:scroll -- --variants=baseline,seek --runs=3
```

The desktop confirmation used the installed Helium browser:

```sh
npm run perf:scroll -- --variants=baseline,seek,sync-measure --runs=2 --headed --browser=/Applications/Helium.app/Contents/MacOS/Helium
```

That command describes the September 29 comparison. The current application
already enables synchronous measurement, so `baseline` and `sync-measure` now
use identical code. To compare measurement modes on the current working tree,
use `--variants=baseline,seek,raf-measure`; the historical timings below describe
the earlier source, not the current baseline.

The test uses a 1000×684 viewport, 1× device scale and CPU, and the cached real
1,049-ship catalogue. It preloads all table image URLs, warms the rendered rows,
and generates four 18,000 px gestures at 20,000 px/s: down, down, up, up. This
deliberately stresses fast scrolling; these totals are not estimates of ordinary
browsing. Scroll seek is disabled during warmup. Every endpoint matched the
expected position in the desktop confirmation.

Traces, screenshots, filmstrips, environment metadata, and JSON summaries live
under `.scroll-benchmark/`. The harness builds variants separately; it does not
change application source or the normal production build.

## Desktop confirmation

Run directory: `.scroll-benchmark/2026-09-29T16-16-10-657Z/`.

| Variant                              | Fully blank time, run 1 / run 2 | Longest blank, run 1 / run 2 |
| ------------------------------------ | ------------------------------- | ---------------------------- |
| Current rows                         | 2,672.5 / 367.4 ms              | 725.5 / 315.5 ms             |
| Scroll seek skeletons                | 111.7 / 0 ms                    | 66.8 / 0 ms                  |
| Synchronous ResizeObserver reporting | 609.0 / 440.7 ms                | 125.5 / 163.2 ms             |

There is substantial run-to-run variance. Placeholders reduced blank time in
both confirmation runs. Synchronous measurement shortened the worst gaps, but
did not consistently reduce total blank time. None of these is a guarantee of
zero blank frames across hardware or input speeds.

## What the trace shows

- Image responses during the two normal-row recordings were entirely cached:
  417/417 and 513/513. Remote network latency is not required to reproduce this.
- The longest `EndCommitToActivation` delays were 360.8 and 154.8 ms with normal
  rows, versus 115.9 and 19.0 ms with placeholders. `PendingTree:waiting` spans
  match those waits. Blank intervals also have compositor missing-content /
  needs-raster flags.
- A separate diagnostic DOM/RAF recording found 10–11 visible rows at every
  sampled frame, including samples during visually blank intervals. There were
  nevertheless gaps of up to 299.5 ms between RAF callbacks. The probe adds
  overhead, so it is supporting evidence, not a timing comparison.
- That diagnostic trace contains a 252.2 ms activation wait beginning 273.6 ms
  after measurement starts, inside a 332.1 ms blank interval. The main thread is
  only 36.7% busy across that blank interval.
- The existing 800 px buffer buys only 40 ms at the tested speed. It cannot
  cover these much longer delays. A larger buffer can help, but also increases
  DOM and painting work.

The probe recording is
`.scroll-benchmark/2026-09-29T16-18-54-799Z/1-baseline/`.

Chromium commits new content to a pending tree, rasterizes it, then activates
it for display. The old active tree can continue scrolling while that work is
pending. This explains how DOM rows can exist while the displayed viewport is
blank. See the primary [Chromium compositor documentation](https://github.com/chromium/chromium/blob/main/docs/how_cc_works.md).

This identifies the delayed pipeline stage; it does not establish a particular
GPU-driver bug. The checked browser uses hardware rasterization/compositing on
Intel Iris Plus via ANGLE Metal with Skia Graphite enabled.

A further isolated-browser check disabled `SkiaGraphite` for two normal-row
runs. The GPU metadata confirmed the flag took effect. Activation waits were
shorter (maximum 51.3 / 45.6 ms), but blank time remained 1,907.7 / 1,354.6 ms,
with more time spent before commit. Switching that backend did not solve the
problem and is not a recommended application fix. Those recordings are under
`.scroll-benchmark/2026-09-29T16-22-48-291Z/`.

## Other experiments and limits

An initial headless screening tried lighter text rows, removal of image-load
state, removal of overflow clipping, a 2,400 px buffer, and synchronous
measurement. Lighter rows consistently reduced CPU/painting; removing image
state helped modestly; a larger buffer increased painting substantially.
These are diagnostic variants, not production fixes.

The initial screening exposed a harness problem: seek mode could activate while
warming up, preventing equivalent row measurement and image caching. One seek
run also drifted from the requested scroll path. Treat that screening as
exploratory; the desktop confirmation uses the corrected warmup and validates
all four endpoints.

The blank detector counts only completely empty screenshots, excluding the
scrollbar. It does not count partially blank viewports. Tracing changes timing,
and headless Chromium differed substantially from the visible browser. Inspect
the saved filmstrips rather than relying solely on a CPU percentage.

For an application-level mitigation, scroll-seek placeholders have the strongest
direct evidence here: they substantially reduce work before both commit and
activation. A modest buffer adjustment can complement that. Fixed item heights
need a separate layout change: the current heading measures 49 px and ordinary
rows measure 69 px, with wrapping still permitted.
