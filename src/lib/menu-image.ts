const bucket = process.env.MINIO_BUCKET || "products";

/** Only resolve stored URLs belonging to this installation's image bucket. */
export function menuImageObjectKey(image: string | null): string | null {
  if (!image) return null;
  try {
    const url = new URL(image);
    const hosts = new Set(["localhost", "127.0.0.1", process.env.MINIO_ENDPOINT || "127.0.0.1"]);
    const publicUrl = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL;
    if (publicUrl) hosts.add(new URL(publicUrl).hostname);
    if (!["http:", "https:"].includes(url.protocol) || !hosts.has(url.hostname)) return null;
    const prefix = `/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    const key = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!key || key.split("/").some(part => part === ".." || part === ".")) return null;
    return key;
  } catch { return null; }
}
