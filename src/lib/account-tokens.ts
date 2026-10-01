import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RequestError } from "@/lib/request-security";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/auth";
import { lockRestaurantAccess } from "@/lib/restaurant-access";

export function normalizedEmail(value: unknown) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)) throw new RequestError("กรุณาระบุอีเมลที่ถูกต้อง");
  return email;
}
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const invalid = () => new RequestError("ลิงก์ไม่ถูกต้อง หมดอายุ หรือใช้แล้ว กรุณาขอลิงก์ใหม่", 400);

export async function issueAccountToken(employeeId: number, purpose: "VERIFY" | "RESET", email: string, expectedPasswordHash?: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction(async tx => {
    const scope = await tx.employee.findUniqueOrThrow({ where: { id: employeeId }, select: { restaurantId: true } });
    await lockRestaurantAccess(tx, scope.restaurantId, true);
    await tx.$queryRaw`SELECT id FROM Employee WHERE id = ${employeeId} FOR UPDATE`;
    const employee = await tx.employee.findUniqueOrThrow({ where: { id: employeeId } });
    if (
      !employee.active ||
      (expectedPasswordHash && employee.passwordHash !== expectedPasswordHash) ||
      (purpose === "VERIFY" && Boolean(employee.emailVerifiedAt) && employee.email === email) ||
      (purpose === "RESET" && (!employee.emailVerifiedAt || employee.email !== email))
    ) throw invalid();
    await tx.accountToken.deleteMany({ where: { employeeId, purpose } });
    await tx.accountToken.create({ data: { employeeId, purpose, email, tokenHash: digest(token), expiresAt: new Date(Date.now() + (purpose === "VERIFY" ? 86400000 : 1800000)) } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  return token;
}

export async function consumeAccountToken(token: unknown, purpose: "VERIFY" | "RESET", password: unknown) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw invalid();
  if (purpose === "RESET" && (typeof password !== "string" || password.length < 8 || password.length > 128)) throw new RequestError("รหัสผ่านต้องมี 8–128 ตัวอักษร");
  const tokenHash = digest(token);
  const initial = await prisma.accountToken.findUnique({ where: { tokenHash } });
  if (!initial || initial.purpose !== purpose || initial.expiresAt <= new Date()) throw invalid();
  const newPasswordHash = purpose === "RESET" ? await hashPassword(String(password)) : undefined;
  return prisma.$transaction(async tx => {
    const scope = await tx.employee.findUniqueOrThrow({ where: { id: initial.employeeId }, select: { restaurantId: true } });
    await lockRestaurantAccess(tx, scope.restaurantId, true);
    await tx.$queryRaw`SELECT id FROM Employee WHERE id = ${initial.employeeId} FOR UPDATE`;
    const current = await tx.accountToken.findUnique({ where: { tokenHash } });
    const employee = await tx.employee.findUniqueOrThrow({ where: { id: initial.employeeId } });
    if (!current || current.purpose !== purpose || current.expiresAt <= new Date() || !employee.active) throw invalid();
    const emailChanged = purpose === "VERIFY" && Boolean(employee.emailVerifiedAt) && employee.email !== current.email;
    if (purpose === "VERIFY") {
      await tx.employee.update({ where: { id: employee.id }, data: { email: current.email, emailVerifiedAt: new Date(), emailVerificationRequired: false } });
    } else {
      if (!employee.emailVerifiedAt || employee.email !== current.email) throw invalid();
      await tx.employee.update({ where: { id: employee.id }, data: { passwordHash: newPasswordHash } });
    }
    await tx.accountToken.deleteMany({ where: { employeeId: employee.id } });
    if (purpose === "RESET") await tx.authSession.deleteMany({ where: { employeeId: employee.id } });
    await writeAudit(employee.id, purpose === "VERIFY" ? "VERIFY_EMAIL" : "RESET_PASSWORD", "Employee", employee.id, undefined, { tx, restaurantId: employee.restaurantId });
    return { emailChanged };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
}
