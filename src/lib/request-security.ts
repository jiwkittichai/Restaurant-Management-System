import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

// Read incrementally: Content-Length is optional and is not a security boundary.
export async function boundedBody(req: Request, limit: number) {
  if (Number(req.headers.get("content-length")) > limit) throw new RequestError("ข้อมูลมีขนาดใหญ่เกินกำหนด", 413);
  const reader = req.body?.getReader();
  if (!reader) throw new RequestError("ไม่พบข้อมูล");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); throw new RequestError("ข้อมูลมีขนาดใหญ่เกินกำหนด", 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export async function smallJson(req: Request) {
  const bytes = await boundedBody(req, 16 * 1024);
  try {
    const body = JSON.parse(bytes.toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new RequestError("รูปแบบข้อมูลไม่ถูกต้อง"); }
}

export function requestError(error: unknown) {
  if (error instanceof RequestError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Request failed", error);
  return NextResponse.json({ error: "ระบบไม่พร้อมชั่วคราว กรุณาลองใหม่" }, { status: 503 });
}

export function clientKey(req: Request) {
  // Enable only behind a proxy that OVERWRITES this header and blocks direct access.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const value = header ? req.headers.get(header)?.trim() : undefined;
  return value && isIP(value) ? value : "shared";
}

export async function rateLimit(scope: string, identity: string, limit: number, seconds: number) {
  const now = Date.now();
  const start = Math.floor(now / (seconds * 1000)) * seconds * 1000;
  const key = createHash("sha256").update(`${scope}:${identity}:${start}`).digest("hex");
  const expiresAt = new Date(start + seconds * 1000);
  const hits = await prisma.$transaction(async tx => {
    await tx.$executeRaw`INSERT INTO RateLimitBucket (id, hits, expiresAt) VALUES (${key}, 1, ${expiresAt}) ON DUPLICATE KEY UPDATE hits = hits + 1`;
    const rows = await tx.$queryRaw<Array<{ hits: number }>>`SELECT hits FROM RateLimitBucket WHERE id = ${key}`;
    return rows[0].hits;
  });
  await prisma.$executeRaw`DELETE FROM RateLimitBucket WHERE expiresAt < ${new Date(now)} LIMIT 100`;
  if (hits <= limit) return null;
  return NextResponse.json({ error: "ทำรายการบ่อยเกินไป กรุณารอสักครู่" }, {
    status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000))) },
  });
}
