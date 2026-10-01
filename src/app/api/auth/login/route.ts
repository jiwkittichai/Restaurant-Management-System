import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, writeAudit } from "@/lib/auth";
import { createPlatformSession, destroyPlatformSession, platformWriteRequest } from "@/lib/platform";
import { verifyPassword } from "@/lib/password";
import { clientKey, rateLimit, smallJson, requestError } from "@/lib/request-security";

function landing(roles: string[]) {
  if (roles.includes("OWNER")) return "/dashboard";
  if (roles.includes("CASHIER")) return "/dashboard/orders";
  if (roles.includes("KITCHEN")) return "/dashboard/kitchen";
  return "/dashboard/inventory";
}

export async function POST(req: NextRequest) {
  try {
  platformWriteRequest(req);
  const limited = await rateLimit("login-ip", clientKey(req), 60, 900);
  if (limited) return limited;
  const body = await smallJson(req);
  const username = String(body.username || "").trim().toLowerCase().replace(/^@+/, "");
  const password = String(body.password || "");
  if (!/^[a-z0-9._-]{3,30}$/.test(username) || password.length > 128) return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  const accountLimited = await rateLimit("login-account", username, 15, 900);
  if (accountLimited) return accountLimited;
  const employee = await prisma.employee.findUnique({ where: { username }, include: { roles: true, restaurant: { select: { active: true, approvalStatus: true } } } });
  const admin = await prisma.platformAdmin.findUnique({ where: { username } });
  if (admin) {
    const ipLimit = await rateLimit("platform-login-ip", clientKey(req), 20, 900);
    if (ipLimit) return ipLimit;
    const adminLimit = await rateLimit("platform-login-account", username, 10, 900);
    if (adminLimit) return adminLimit;
  }
  const employeeMatches = employee ? await verifyPassword(password, employee.passwordHash) : false;
  const adminMatches = admin ? await verifyPassword(password, admin.passwordHash) : false;
  // Never guess a role when legacy accounts share both username and password.
  if (employeeMatches && adminMatches) return NextResponse.json({ error: "บัญชีซ้ำกัน กรุณาติดต่อผู้ดูแลเพื่อตั้งชื่อผู้ใช้หรือรหัสผ่านให้แตกต่างกัน" }, { status: 409 });
  if (adminMatches && admin?.active) {
    await destroyPlatformSession();
    await createPlatformSession(admin.id, admin.passwordHash);
    await destroySession();
    return NextResponse.json({ success: true, redirectTo: "/platform" });
  }
  if (admin) await prisma.platformLog.create({ data: { adminId: admin.id, actorName: admin.displayName, action: "PLATFORM_LOGIN_FAILED" } });
  if (!employee || !employeeMatches) {
    await writeAudit(employee?.id ?? null, "LOGIN_FAILED", "Employee", employee?.id, { username });
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  if (!employee.active) {
    await writeAudit(employee.id, "LOGIN_INACTIVE", "Employee", employee.id);
    return NextResponse.json({ error: "บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อเจ้าของร้านหรือผู้จัดการ" }, { status: 403 });
  }
  if (employee.restaurant.approvalStatus !== "APPROVED") return NextResponse.json({ error: employee.restaurant.approvalStatus === "PENDING" ? "ร้านของคุณอยู่ระหว่างรอแอดมินตรวจสอบและอนุมัติ" : "คำขอสมัครร้านไม่ได้รับการอนุมัติ กรุณาติดต่อผู้ดูแลแพลตฟอร์ม", code: `RESTAURANT_${employee.restaurant.approvalStatus}` }, { status: 403 });
  if (!employee.restaurant.active) return NextResponse.json({ error: "ร้านนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลแพลตฟอร์ม" }, { status: 403 });
  await destroySession();
  await createSession(employee.id, employee.passwordHash);
  await destroyPlatformSession();
  await prisma.employee.update({ where: { id: employee.id }, data: { lastLoginAt: new Date() } });
  await writeAudit(employee.id, "LOGIN", "Employee", employee.id);
  const roles = employee.roles.map(item => item.role);
  const needsSetup = roles.includes("OWNER") && !(await prisma.menuItem.count({ where: { restaurantId: employee.restaurantId } }));
  return NextResponse.json({ success: true, redirectTo: needsSetup ? "/dashboard/onboarding" : landing(roles) });
  } catch (error) { return requestError(error); }
}
