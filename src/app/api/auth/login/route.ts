import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, writeAudit } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

function landing(roles: string[]) {
  if (roles.includes("OWNER")) return "/dashboard";
  if (roles.includes("CASHIER")) return "/dashboard/orders";
  if (roles.includes("KITCHEN")) return "/dashboard/kitchen";
  return "/dashboard/inventory";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const username = String(body.username || "").trim().toLowerCase();
  const employee = await prisma.employee.findUnique({ where: { username }, include: { roles: true } });
  if (!employee || !employee.active || !(await verifyPassword(String(body.password || ""), employee.passwordHash))) {
    return NextResponse.json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await prisma.employee.update({ where: { id: employee.id }, data: { lastLoginAt: new Date() } });
  await createSession(employee.id);
  await writeAudit(employee.id, "LOGIN", "Employee", employee.id);
  return NextResponse.json({ success: true, redirectTo: landing(employee.roles.map(item => item.role)) });
}
