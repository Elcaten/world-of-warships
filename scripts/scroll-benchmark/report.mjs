import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import jpeg from "jpeg-js";

const sum = (xs) => xs.reduce((s, x) => s + x, 0);
const ms = (us) => Math.round(us / 100) / 10;

function pipelineStage(events, name, pid, start, end) {
  const pending = new Map();
  const spans = [];
  for (const event of events) {
    if (event.name !== name || event.pid !== pid) continue;
    const key = `${event.tid}:${JSON.stringify(event.id2 ?? event.id)}`;
    if (event.ph === "b") pending.set(key, event);
    if (event.ph === "e" && pending.has(key)) {
      const begin = pending.get(key);
      pending.delete(key);
      if (begin.ts >= start && begin.ts < end)
        spans.push({
          atMs: ms(begin.ts - start),
          durationMs: ms(event.ts - begin.ts),
        });
    }
  }
  spans.sort((a, b) => a.durationMs - b.durationMs);
  return {
    count: spans.length,
    p95Ms: spans[Math.floor((spans.length - 1) * 0.95)]?.durationMs ?? 0,
    maxMs: spans.at(-1)?.durationMs ?? 0,
    slowest: spans.slice(-3).reverse(),
  };
}

export async function analyze(trace, directory) {
  const events = trace.traceEvents;
  const startMarker = events.find(
    (e) =>
      e.name === "TimeStamp" &&
      e.args.data?.message === "scroll-benchmark:start",
  );
  const mainThread = events.find(
    (e) =>
      e.ph === "M" &&
      e.name === "thread_name" &&
      e.args.name === "CrRendererMain" &&
      e.pid === startMarker?.pid &&
      e.tid === startMarker?.tid,
  );
  if (!mainThread) throw new Error("Trace is missing renderer main thread");
  const main = events.filter(
    (e) => e.pid === mainThread.pid && e.tid === mainThread.tid,
  );
  const markers = main.filter(
    (e) =>
      e.name === "TimeStamp" &&
      e.args.data?.message?.startsWith("scroll-benchmark:"),
  );
  const start = markers.find(
    (e) => e.args.data.message === "scroll-benchmark:start",
  )?.ts;
  const end = markers.find(
    (e) => e.args.data.message === "scroll-benchmark:end",
  )?.ts;
  if (!start || !end) throw new Error("Trace is missing benchmark markers");
  const active = main.filter((e) => e.ts >= start && e.ts < end);
  const tasks = active.filter((e) => e.name === "RunTask" && e.ph === "X");
  const scrolls = active.filter(
    (e) => e.name === "EventDispatch" && e.args.data?.type === "scroll",
  );
  const durations = scrolls.map((e) => e.dur).sort((a, b) => a - b);
  const eventTime = (name) =>
    ms(
      sum(
        active
          .filter((e) => e.name === name && e.ph === "X")
          .map((e) => e.dur || 0),
      ),
    );
  const reporters = events
    .filter(
      (e) =>
        e.name === "PipelineReporter" &&
        e.ph === "b" &&
        e.ts >= start &&
        e.ts < end,
    )
    .map((e) => e.args.frame_reporter);
  const shots = events.filter(
    (e) => e.name === "Screenshot" && e.ts >= start && e.ts <= end,
  );
  await mkdir(join(directory, "frames"), { recursive: true });
  const frames = [];
  for (let i = 0; i < shots.length; i++) {
    const e = shots[i];
    const bytes = Buffer.from(e.args.snapshot, "base64");
    const { data, width, height } = jpeg.decode(bytes, { useTArray: true });
    let bright = 0;
    // App-specific: all text/skeletons/icons are brighter than the dark panel.
    // Ignore the edges/scrollbar. This detects wholly blank frames, not partial gaps.
    for (let y = 0; y < height; y++)
      for (let x = Math.ceil(width * 0.04); x < width * 0.96; x++) {
        const p = (y * width + x) * 4;
        if (Math.max(data[p], data[p + 1], data[p + 2]) > 90) bright++;
      }
    const path = `frames/${String(i).padStart(4, "0")}.jpg`;
    await writeFile(join(directory, path), bytes);
    frames.push({
      index: i,
      atMs: ms((e.args.expected_display_time ?? e.ts) - start),
      blank: bright < 10,
      brightPixels: bright,
      path,
    });
  }
  const gaps = [];
  let gap;
  for (const frame of frames) {
    if (frame.blank) {
      if (!gap)
        gap = { startMs: frame.atMs, firstFrame: frame.index, frameCount: 0 };
      gap.frameCount++;
    } else if (gap) {
      gaps.push({
        ...gap,
        endMs: frame.atMs,
        durationMs: Math.round((frame.atMs - gap.startMs) * 10) / 10,
      });
      gap = undefined;
    }
  }
  if (gap) gaps.push({ ...gap, endMs: null, durationMs: null });
  for (const gap of gaps) {
    if (gap.endMs === null) continue;
    const a = start + gap.startMs * 1000,
      b = start + gap.endMs * 1000;
    gap.mainBusyPct =
      Math.round(
        (sum(
          tasks.map((t) =>
            Math.max(0, Math.min(b, t.ts + t.dur) - Math.max(a, t.ts)),
          ),
        ) /
          (b - a)) *
          1000,
      ) / 10;
    gap.scrollEvents = scrolls.filter((e) => e.ts >= a && e.ts < b).length;
  }
  const stats = {
    durationMs: ms(end - start),
    mainBusyMs: eventTime("RunTask"),
    mainBusyPct:
      Math.round((eventTime("RunTask") / ms(end - start)) * 1000) / 10,
    scrollEvents: durations.length,
    scrollTotalMs: ms(sum(durations)),
    scrollAvgMs: ms(sum(durations) / (durations.length || 1)),
    scrollP95Ms: ms(durations[Math.floor((durations.length - 1) * 0.95)] || 0),
    longTasks: tasks.filter((e) => e.dur > 50_000).length,
    longestTaskMs: ms(Math.max(0, ...tasks.map((e) => e.dur))),
    styleMs: eventTime("UpdateLayoutTree"),
    layoutMs: eventTime("Layout"),
    paintMs: eventTime("Paint"),
    mainFrameToCommit: pipelineStage(
      events,
      "SendBeginMainFrameToCommit",
      mainThread.pid,
      start,
      end,
    ),
    commitToActivation: pipelineStage(
      events,
      "EndCommitToActivation",
      mainThread.pid,
      start,
      end,
    ),
    resourceResponses: active.filter(
      (e) => e.name === "ResourceReceiveResponse",
    ).length,
    cachedResourceResponses: active.filter(
      (e) => e.name === "ResourceReceiveResponse" && e.args.data?.fromCache,
    ).length,
    imageLoadEvents: active.filter(
      (e) => e.name === "EventDispatch" && e.args.data?.type === "load",
    ).length,
    pipelineMissingContent: reporters.filter((e) => e?.has_missing_content)
      .length,
    pipelineNeedsRaster: reporters.filter((e) => e?.checkerboarded_needs_raster)
      .length,
    pipelineNeedsRecord: reporters.filter((e) => e?.checkerboarded_needs_record)
      .length,
    screenshotFrames: frames.length,
    screenshotLastMs: frames.at(-1)?.atMs,
    blankFrames: frames.filter((f) => f.blank).length,
    totalBlankMs: Math.round(sum(gaps.map((g) => g.durationMs || 0)) * 10) / 10,
    longestBlankMs: Math.max(0, ...gaps.map((g) => g.durationMs || 0)),
    gaps,
  };
  await writeFile(
    join(directory, "frames.json"),
    JSON.stringify(frames, null, 2),
  );
  await writeFile(
    join(directory, "filmstrip.html"),
    `<!doctype html><meta charset="utf-8"><title>Scroll benchmark frames</title><style>body{background:#182028;color:#eee;font:14px monospace}main{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}figure{margin:0}img{width:100%}.blank{outline:3px solid coral}</style><h1>Scroll benchmark: ${frames.length} captured frames</h1><p>Orange outlines indicate completely blank frames. Timestamps are relative to the measured scroll.</p><main>${frames.map((f) => `<figure class="${f.blank ? "blank" : ""}"><figcaption>${f.index}: ${f.atMs} ms</figcaption><img loading="lazy" src="${f.path}"></figure>`).join("")}</main>`,
  );
  return stats;
}
