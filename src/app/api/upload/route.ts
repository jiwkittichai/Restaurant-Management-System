import { NextResponse } from "next/server";
import { Client } from "minio";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

export async function POST(req: Request) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${file.name}`;

    await minioClient.putObject("products", filename, buffer);
    await writeAudit(auth.user.id,"UPLOAD_MENU_IMAGE","MinioObject",filename);

    const url = `${process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL}/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
