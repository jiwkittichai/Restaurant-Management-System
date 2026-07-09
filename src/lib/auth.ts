import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "restaurant_session";
const SESSION_HOURS = 12;

export type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
  roles: StaffRole[];
};

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(employeeId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { tokenHash: tokenHash(token), employeeId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.authSession.deleteMany({ where: { tokenHash: tokenHash(token) } });
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: { employee: { include: { roles: true } } },
  });
  if (!session || session.expiresAt <= new Date() || !session.employee.active) {
    if (session) await prisma.authSession.deleteMany({ where: { tokenHash: session.tokenHash } });
    return null;
  }
  return {
    id: session.employee.id,
    username: session.employee.username,
    displayName: session.employee.displayName,
    roles: session.employee.roles.map((item) => item.role),
  };
}

export async function authorizeApi(allowedRoles?: StaffRole[]) {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  if (allowedRoles?.length && !user.roles.some((role) => allowedRoles.includes(role))) {
    return { response: NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 }) };
  }
  return { user };
}

export async function writeAudit(
  employeeId: number,
  action: string,
  entityType: string,
  entityId?: string | number | null,
  details?: Prisma.InputJsonObject,
) {
  await prisma.auditLog.create({
    data: {
      employeeId,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      details: details || undefined,
    },
  });
}
