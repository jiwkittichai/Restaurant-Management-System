import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { Client } from "minio";
import { prisma } from "@/lib/prisma";
import { menuImageObjectKey } from "@/lib/menu-image";

const client = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});
const types: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", gif: "image/gif" };
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) return new NextResponse(null, { status: 404 });
  const restaurant = await prisma.restaurant.findUnique({ where: { id: Number(id) }, select: { logoUrl: true } });
  const key = menuImageObjectKey(restaurant?.logoUrl || null);
  if (!key) return new NextResponse(null, { status: 404 });
  try {
    const bucket = process.env.MINIO_BUCKET || "products";
    const stat = await client.statObject(bucket, key);
    const contentType = types[key.split(".").at(-1)?.toLowerCase() || ""] || stat.metaData["content-type"];
    if (!Object.values(types).includes(contentType)) return new NextResponse(null, { status: 415 });
    const stream = await client.getObject(bucket, key);
    return new NextResponse(Readable.toWeb(stream) as ReadableStream<Uint8Array>, { headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
