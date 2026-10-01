import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RequestError } from "@/lib/request-security";

export const PLATFORM_COOKIE = "platform_session";
export const platformHash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function platformSettings() {
  return prisma.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
}
export async function getPlatformAdmin() {
  const token = (await cookies()).get(PLATFORM_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.platformSession.findUnique({ where: { tokenHash: platformHash(token) }, include: { admin: { select: { id: true, username: true, displayName: true, active: true } } } });
  if (!session || session.expiresAt <= new Date() || !session.admin.active) return null;
  return session.admin;
}
export async function authorizePlatform() {
  const admin = await getPlatformAdmin();
  if (!admin) return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบด้วยบัญชีแอดมินแพลตฟอร์ม" }, { status: 401 }) };
  return { admin };
}
export function platformWriteRequest(req: Request) {
  const origin = req.headers.get("origin");
  const expectedOrigin = process.env.AUTH_PUBLIC_URL ? new URL(process.env.AUTH_PUBLIC_URL).origin : new URL(req.url).origin;
  if (req.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expectedOrigin) || !req.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("คำขอไม่ถูกต้อง", 403);
}
export async function createPlatformSession(adminId: number, expectedPasswordHash: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 4 * 3600000);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM PlatformAdmin WHERE id = ${adminId} FOR UPDATE`;
    const admin = await tx.platformAdmin.findUniqueOrThrow({ where: { id: adminId } });
    if (!admin.active || admin.passwordHash !== expectedPasswordHash) throw new RequestError("บัญชีไม่พร้อมใช้งาน", 403);
    await tx.platformSession.create({ data: { tokenHash: platformHash(token), adminId, expiresAt } });
    await platformLog(tx, admin, "PLATFORM_LOGIN");
  });
  (await cookies()).set(PLATFORM_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
}
export async function destroyPlatformSession() {
  const store = await cookies();
  const token = store.get(PLATFORM_COOKIE)?.value;
  if (token) await prisma.platformSession.deleteMany({ where: { tokenHash: platformHash(token) } });
  store.delete(PLATFORM_COOKIE);
}
export async function platformLog(tx: Prisma.TransactionClient, admin: { id: number; displayName: string }, action: string, restaurantId?: number, details?: Prisma.InputJsonObject) {
  await tx.platformLog.create({ data: { adminId: admin.id, actorName: admin.displayName, action, restaurantId, details } });
}
