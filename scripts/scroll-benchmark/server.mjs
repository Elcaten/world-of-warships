import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve, extname } from "node:path";

const api = "https://vortex.worldofwarships.eu/api/encyclopedia/en/";
const allowedHosts = new Set([
  "vortex.worldofwarships.eu",
  "wows-gloss-icons.wgcdn.co",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
]);
const pending = new Map();

// First use downloads public assets. Later runs replay the same bytes locally.
export async function cachedFetch(url, cache) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname))
    throw new Error(`Unexpected asset URL: ${url}`);
  const key = createHash("sha256").update(url).digest("hex");
  const path = join(cache, key);
  try {
    return {
      body: await readFile(`${path}.bin`),
      ...JSON.parse(await readFile(`${path}.json`, "utf8")),
    };
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!pending.has(key)) {
    pending.set(
      key,
      (async () => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(60_000),
          headers: {
            "user-agent": "Mozilla/5.0 Chrome/149.0.0.0 Safari/537.36",
          },
        });
        if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
        const body = Buffer.from(await response.arrayBuffer());
        const meta = {
          url,
          contentType:
            response.headers.get("content-type") || "application/octet-stream",
          sha256: createHash("sha256").update(body).digest("hex"),
        };
        await mkdir(cache, { recursive: true });
        await writeFile(`${path}.bin`, body);
        await writeFile(`${path}.json`, JSON.stringify(meta));
        return { body, ...meta };
      })().finally(() => pending.delete(key)),
    );
  }
  return pending.get(key);
}

export async function snapshot(cache) {
  const entries = await Promise.all(
    ["vehicles", "nations", "vehicle_types_common", "media_path"].map(
      async (name) => {
        const response = await cachedFetch(`${api}${name}/`, cache);
        return [name, { ...response, json: JSON.parse(response.body) }];
      },
    ),
  );
  return Object.fromEntries(entries);
}

export async function serveBuild(directory, cache, data) {
  const errors = [];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      let body, contentType;
      const apiMatch = url.pathname.match(
        /^\/api\/encyclopedia\/en\/([^/]+)\/$/,
      );
      if (apiMatch) {
        const name = apiMatch[1];
        if (!data[name]) {
          res.writeHead(404).end();
          return;
        }
        body =
          name === "media_path"
            ? JSON.stringify({ status: "ok", data: `${url.origin}/__media/` })
            : data[name].body;
        contentType = "application/json";
      } else if (
        url.pathname.startsWith("/__media/") ||
        url.pathname === "/__remote"
      ) {
        const remote =
          url.pathname === "/__remote"
            ? url.searchParams.get("url")
            : new URL(
                url.pathname.slice("/__media/".length),
                data.media_path.json.data,
              ).href;
        ({ body, contentType } = await cachedFetch(remote, cache));
        if (contentType.includes("text/css")) {
          body = body
            .toString()
            .replace(
              /https:\/\/fonts\.gstatic\.com\/[^)\s]+/g,
              (asset) => `/__remote?url=${encodeURIComponent(asset)}`,
            );
        }
      } else {
        const path = resolve(
          directory,
          "." +
            decodeURIComponent(
              url.pathname === "/" ? "/index.html" : url.pathname,
            ),
        );
        if (!path.startsWith(resolve(directory) + "/")) {
          res.writeHead(403).end();
          return;
        }
        body = await readFile(path);
        contentType =
          {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".svg": "image/svg+xml",
          }[extname(path)] || "application/octet-stream";
        if (path.endsWith("index.html")) {
          body = body
            .toString()
            .replace(
              /https:\/\/fonts\.googleapis\.com\/css2\?[^"\s]+/g,
              (asset) => `/__remote?url=${encodeURIComponent(asset)}`,
            );
        }
      }
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      });
      res.end(body);
    } catch (error) {
      if (error.code !== "ENOENT") errors.push(String(error));
      res.writeHead(error.code === "ENOENT" ? 404 : 500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    errors,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
