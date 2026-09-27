import { lookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

export function publicAddress(ip: string): boolean {
  // IPv4 only: deliberately reject IPv6 and ambiguous address encodings.
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0));
}

export async function readPublicHtml(input: string, signal: AbortSignal, redirects = 0): Promise<{ html: string; url: string }> {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      (url.port && !["80", "443"].includes(url.port)) || redirects > 3) throw new Error("URL no permitida");
  const addresses = await lookup(url.hostname, { family: 4, all: true });
  if (!addresses.length || addresses.some((item) => !publicAddress(item.address))) throw new Error("Dirección no pública");
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    // Pin the validated address; never resolve again during connection.
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      signal,
      family: 4,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4),
      headers: { "User-Agent": "ProductionIntelligenceResearch/1.0", Accept: "text/html" },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        readPublicHtml(new URL(res.headers.location, url).href, signal, redirects + 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200 || !/text\/html/i.test(res.headers["content-type"] || "")) {
        res.resume(); reject(new Error(`Página no disponible: ${res.statusCode}`)); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 1_000_000) { req.destroy(new Error("Página demasiado grande")); return; }
        chunks.push(chunk);
      });
      res.on("error", reject);
      res.on("end", () => resolve({ html: Buffer.concat(chunks).toString("utf8"), url: url.href }));
    });
    req.on("error", reject);
    req.setTimeout(5000, () => req.destroy(new Error("Tiempo agotado")));
    req.end();
  });
}
