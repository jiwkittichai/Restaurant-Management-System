import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "restaurant_session";
const SESSION_HOURS = 12;
const RETAINED_AUDIT_ACTIONS = new Set([
  "LOGIN", "LOGIN_FAILED", "LOGIN_INACTIVE", "REGISTER_RESTAURANT",
  "CREATE_EMPLOYEE", "UPDATE_EMPLOYEE",
  "CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PAY_ORDER_STRIPE", "PICKUP_ORDER", "CANCEL_ORDER",
  "CREATE_TABLE", "UPDATE_TABLE_STATUS", "QR_TABLE_ROTATE",
  "CREATE_CATEGORY", "UPDATE_CATEGORY", "DELETE_CATEGORY",
  "CREATE_MENU", "UPDATE_MENU", "TOGGLE_MENU", "DELETE_MENU",
  "CREATE_INGREDIENT", "UPDATE_INGREDIENT", "DELETE_INGREDIENT", "STOCK_IN", "ADJUST_STOCK", "UPDATE_RECIPE",
  "UPDATE_RESTAURANT_PROFILE", "UPDATE_PAYMENT_SETTINGS", "CONNECT_STRIPE_ACCOUNT",
]);

export type CurrentUser = {
  id: number;
  restaurantId: number;
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
    restaurantId: session.employee.restaurantId,
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
  employeeId: number | null,
  action: string,
  entityType: string,
  entityId?: string | number | null,
  details?: Prisma.InputJsonObject,
  context?: { tx?: Prisma.TransactionClient; restaurantId: number },
) {
  // Keep only events that are useful for financial, stock, security, or
  // administrative investigations. High-frequency workflow state belongs in
  // its source table, not in the audit trail.
  if (!RETAINED_AUDIT_ACTIONS.has(action)) return;

  const compactDetails = details ? compactAuditDetails(details) : undefined;
  const db = context?.tx ?? prisma;
  const employee = employeeId
    ? await db.employee.findUnique({ where: { id: employeeId }, select: { restaurantId: true, displayName: true } })
    : null;
  const restaurantId = context?.restaurantId ?? employee?.restaurantId;
  if (!restaurantId) return;
  if (employee && employee.restaurantId !== restaurantId) throw new Error("AUDIT_TENANT_MISMATCH");
  await db.auditLog.create({
    data: {
      restaurantId,
      employeeId,
      action,
      entityType,
      entityId: entityId == null ? null : String(entityId),
      requestId: randomUUID(),
      details: { ...compactDetails, actorName: employee?.displayName ?? (details?.provider === "stripe" ? "ระบบ Stripe" : "ลูกค้าผ่าน QR") },
    },
  });
}

function compactAuditDetails(details: Prisma.InputJsonObject): Prisma.InputJsonObject | undefined {
  const blockedKeys = new Set(["password", "passwordHash", "token", "tokenHash", "accessToken", "sessionSecret", "cardNumber"]);
  const result: Record<string, Prisma.InputJsonValue> = {};
  const before = isJsonObject(details.before) ? details.before : null;
  const after = isJsonObject(details.after) ? details.after : null;

  for (const [key, value] of Object.entries(details)) {
    if (blockedKeys.has(key) || key === "before" || key === "after" || value === undefined) continue;
    result[key] = value as Prisma.InputJsonValue;
  }

  if (before && after) {
    const changedBefore: Record<string, Prisma.InputJsonValue> = {};
    const changedAfter: Record<string, Prisma.InputJsonValue> = {};
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (blockedKeys.has(key) || JSON.stringify(before[key]) === JSON.stringify(after[key])) continue;
      if (before[key] !== undefined) changedBefore[key] = before[key] as Prisma.InputJsonValue;
      if (after[key] !== undefined) changedAfter[key] = after[key] as Prisma.InputJsonValue;
    }
    if (Object.keys(changedBefore).length) result.before = changedBefore;
    if (Object.keys(changedAfter).length) result.after = changedAfter;
  }

  return Object.keys(result).length ? result : undefined;
}

function isJsonObject(value: Prisma.InputJsonValue | null | undefined): value is Prisma.InputJsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
