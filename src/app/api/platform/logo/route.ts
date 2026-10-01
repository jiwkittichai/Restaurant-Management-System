import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { Client } from "@/lib/storage-client";
import { menuImageObjectKey } from "@/lib/menu-image";
import { prisma } from "@/lib/prisma";
import { authorizePlatform, platformLog, platformSettings } from "@/lib/platform";
import { boundedBody, rateLimit, RequestError, requestError } from "@/lib/request-security";

const bucketName = process.env.MINIO_BUCKET || "products";
const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});
const imageTypes: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

function publicObjectUrl(objectName: string) {
  const configuredBase = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT || "127.0.0.1"}:${process.env.MINIO_PORT || 9000}/${bucketName}`;
  const base = configuredBase.replace(/\/+$/, "");
  const configuredUrl = new URL(base);
  const bucketBase = configuredUrl.pathname.endsWith(`/${bucketName}`) ? base : `${configuredUrl.origin}/${bucketName}`;
  return `${bucketBase}/${objectName.split("/").map(encodeURIComponent).join("/")}`;
}

function validateOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const expectedOrigin = process.env.AUTH_PUBLIC_URL ? new URL(process.env.AUTH_PUBLIC_URL).origin : new URL(req.url).origin;
  if (req.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expectedOrigin)) throw new RequestError("คำขอไม่ถูกต้อง", 403);
}

async function removeStoredLogo(value: string | null) {
  const key = menuImageObjectKey(value);
  if (!key?.startsWith("platform/")) return;
  try { await client.removeObject(bucketName, key); } catch { /* The saved setting is already authoritative. */ }
}

export async function GET() {
  const settings = await platformSettings();
  const key = menuImageObjectKey(settings.logoUrl);
  if (!key?.startsWith("platform/")) return new NextResponse(null, { status: 404 });
  try {
    const stat = await client.statObject(bucketName, key);
    const contentType = imageTypes[key.split(".").at(-1)?.toLowerCase() || ""] || stat.metaData["content-type"];
    if (!Object.values(imageTypes).includes(contentType)) return new NextResponse(null, { status: 415 });
    const stream = await client.getObject(bucketName, key);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch { return new NextResponse(null, { status: 404 }); }
}

export async function POST(req: Request) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  try {
    validateOrigin(req);
    const limited = await rateLimit("platform-logo", String(auth.admin.id), 20, 900);
    if (limited) return limited;
    const bytes = await boundedBody(req, 6 * 1024 * 1024);
    let data: FormData;
    try {
      data = await new Response(new Uint8Array(bytes), { headers: { "Content-Type": req.headers.get("content-type") || "" } }).formData();
    } catch { throw new RequestError("รูปแบบข้อมูลไฟล์ไม่ถูกต้อง"); }
    const file = data.get("file");
    if (!(file instanceof File) || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw new RequestError("รูปต้องเป็น PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB");

    let buffer: Buffer;
    let extension: string;
    let contentType: string;
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const decoder = sharp(input, { limitInputPixels: 16000000, failOn: "warning" });
      const metadata = await decoder.metadata();
      if (!metadata.format || imageTypes[metadata.format] !== file.type || (metadata.pages || 1) > 1 || !metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000) throw new Error();
      extension = metadata.format;
      contentType = imageTypes[extension];
      buffer = await decoder.rotate().resize(1024, 1024, { fit: "inside", withoutEnlargement: true }).toFormat(metadata.format as "png" | "jpeg" | "webp").toBuffer();
      if (buffer.length > 5 * 1024 * 1024) throw new Error();
    } catch { throw new RequestError("รูปภาพไม่ถูกต้อง ใหญ่เกินกำหนด หรือเป็นภาพเคลื่อนไหว"); }

    const objectName = `platform/${randomUUID()}.${extension}`;
    await client.putObject(bucketName, objectName, buffer, buffer.length, { "Content-Type": contentType });
    const storedUrl = publicObjectUrl(objectName);
    let previousLogo: string | null = null;
    try {
      const updated = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM PlatformSettings WHERE id = 1 FOR UPDATE`;
        const before = await tx.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
        previousLogo = before.logoUrl;
        const saved = await tx.platformSettings.update({ where: { id: 1 }, data: { logoUrl: storedUrl } });
        await platformLog(tx, auth.admin, "PLATFORM_LOGO_UPDATED", undefined, { before: { logo: Boolean(before.logoUrl) }, after: { logo: true } });
        return saved;
      });
      await removeStoredLogo(previousLogo);
      return NextResponse.json({ logoUrl: `/api/platform/logo?v=${updated.updatedAt.getTime()}` });
    } catch (error) {
      await removeStoredLogo(storedUrl);
      throw error;
    }
  } catch (error) {
    if (!(error instanceof RequestError)) console.error("Platform logo upload error:", error);
    return requestError(error);
  }
}

export async function DELETE(req: Request) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  try {
    validateOrigin(req);
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM PlatformSettings WHERE id = 1 FOR UPDATE`;
      const before = await tx.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
      const updated = await tx.platformSettings.update({ where: { id: 1 }, data: { logoUrl: null } });
      await platformLog(tx, auth.admin, "PLATFORM_LOGO_REMOVED", undefined, { before: { logo: Boolean(before.logoUrl) }, after: { logo: false } });
      return { previousLogo: before.logoUrl, updated };
    });
    await removeStoredLogo(result.previousLogo);
    return NextResponse.json({ logoUrl: null });
  } catch (error) { return requestError(error); }
}
