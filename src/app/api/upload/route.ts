import { NextResponse } from "next/server";
import { Client } from "minio";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

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
    const data = await req.formData();
    const file = data.get("file") as File;
    const purpose = String(data.get("purpose") || "");

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `restaurants/${auth.user.restaurantId}/${Date.now()}-${file.name}`;

    await minioClient.putObject(bucketName, filename, buffer, buffer.length, {
      "Content-Type": file.type || "application/octet-stream",
    });
    await writeAudit(auth.user.id,purpose==="promptpay_qr"?"UPLOAD_PROMPTPAY_QR":"UPLOAD_MENU_IMAGE","MinioObject",filename);

    return NextResponse.json({ url: publicObjectUrl(filename) });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
