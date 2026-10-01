import { NextResponse } from "next/server";
import { Client } from "@/lib/storage-client";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { boundedBody, rateLimit, RequestError, requestError } from "@/lib/request-security";

const bucketName = process.env.MINIO_BUCKET || "products";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

function publicObjectUrl(objectName: string) {
  const configuredBase =
    process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ||
    `http://${process.env.MINIO_ENDPOINT || "127.0.0.1"}:${process.env.MINIO_PORT || 9000}/${bucketName}`;
  const base = configuredBase.replace(/\/+$/, "");
  const configuredUrl = new URL(base);
  const bucketBase = configuredUrl.pathname.endsWith(`/${bucketName}`) ? base : `${configuredUrl.origin}/${bucketName}`;
  return `${bucketBase}/${objectName.split("/").map(encodeURIComponent).join("/")}`;
}

export async function POST(req: Request) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const limited = await rateLimit("upload", String(auth.user.restaurantId), 60, 900);
    if (limited) return limited;
    const bytes = await boundedBody(req, 6 * 1024 * 1024);
    let data: FormData;
    try {
      data = await new Response(new Uint8Array(bytes), { headers: { "Content-Type": req.headers.get("content-type") || "" } }).formData();
    } catch { throw new RequestError("รูปแบบข้อมูลไฟล์ไม่ถูกต้อง"); }
    const file = data.get("file");
    const purpose = String(data.get("purpose") || "");

    if (!(file instanceof File) || !["", "menu_image", "restaurant_logo", "promptpay_qr"].includes(purpose)) throw new RequestError("ข้อมูลไฟล์ไม่ถูกต้อง");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || !file.size || file.size > 5 * 1024 * 1024) throw new RequestError("รูปต้องเป็น PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB");
    let buffer: Buffer;
    let extension: string;
    let contentType: string;
    try {
      const input = Buffer.from(await file.arrayBuffer());
      const decoder = sharp(input, { limitInputPixels: 16000000, failOn: "warning" });
      const metadata = await decoder.metadata();
      const types: Record<string, string> = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };
      if (!metadata.format || types[metadata.format] !== file.type || (metadata.pages || 1) > 1 || !metadata.width || !metadata.height || metadata.width > 8000 || metadata.height > 8000) throw new Error();
      extension = metadata.format;
      contentType = types[extension];
      buffer = await decoder.rotate().toFormat(metadata.format as "png" | "jpeg" | "webp").toBuffer();
      if (buffer.length > 5 * 1024 * 1024) throw new Error();
    } catch { throw new RequestError("รูปภาพไม่ถูกต้อง ใหญ่เกินกำหนด หรือเป็นภาพเคลื่อนไหว"); }
    const filename = `restaurants/${auth.user.restaurantId}/${randomUUID()}.${extension}`;

    await minioClient.putObject(bucketName, filename, buffer, buffer.length, {
      "Content-Type": contentType,
    });
    return NextResponse.json({ url: publicObjectUrl(filename) });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
