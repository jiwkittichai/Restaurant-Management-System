import { NextRequest, NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { rateLimit, requestError, RequestError, smallJson } from "@/lib/request-security";

export async function PATCH(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  try {
    const limited = await rateLimit("account-profile", String(auth.user.id), 10, 900);
    if (limited) return limited;

    const body = await smallJson(req);
    const action = body.action;
    if (action !== "profile" && action !== "password") throw new RequestError("คำสั่งไม่ถูกต้อง");

    const employee = await prisma.employee.findFirstOrThrow({
      where: { id: auth.user.id, restaurantId: auth.user.restaurantId },
      select: { id: true, restaurantId: true, username: true, displayName: true, passwordHash: true },
    });
    if (action === "profile") {
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      const username = typeof body.username === "string" ? body.username.trim().toLowerCase().replace(/^@+/, "") : "";
      if (!displayName || displayName.length > 100 || !/^[a-z0-9._-]{3,30}$/.test(username)) {
        throw new RequestError("กรุณากรอกชื่อและชื่อผู้ใช้ให้ถูกต้อง");
      }

      const duplicate = await prisma.employee.findUnique({ where: { username }, select: { id: true } });
      if (duplicate && duplicate.id !== employee.id) throw new RequestError("ชื่อผู้ใช้นี้ถูกใช้แล้ว", 409);

      await prisma.employee.update({ where: { id: employee.id }, data: { displayName, username } });
      await writeAudit(employee.id, "UPDATE_ACCOUNT", "Employee", employee.id, {
        targetName: displayName,
        before: { displayName: employee.displayName, username: employee.username },
        after: { displayName, username },
      });
      return NextResponse.json({ success: true, message: "บันทึกข้อมูลบัญชีแล้ว" });
    }

    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    if (currentPassword.length > 128 || !(await verifyPassword(currentPassword, employee.passwordHash))) {
      throw new RequestError("รหัสผ่านปัจจุบันไม่ถูกต้อง", 403);
    }
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (newPassword.length < 8 || newPassword.length > 128) throw new RequestError("รหัสผ่านใหม่ต้องมี 8–128 ตัวอักษร");
    if (await verifyPassword(newPassword, employee.passwordHash)) throw new RequestError("รหัสผ่านใหม่ต้องต่างจากรหัสผ่านปัจจุบัน");
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM Employee WHERE id = ${employee.id} FOR UPDATE`;
      const current = await tx.employee.findUniqueOrThrow({ where: { id: employee.id }, select: { passwordHash: true } });
      if (current.passwordHash !== employee.passwordHash) throw new RequestError("ข้อมูลบัญชีมีการเปลี่ยนแปลง กรุณาลองใหม่", 409);
      await tx.employee.update({ where: { id: employee.id }, data: { passwordHash } });
      await tx.authSession.deleteMany({ where: { employeeId: employee.id } });
      await tx.accountToken.deleteMany({ where: { employeeId: employee.id } });
      await writeAudit(employee.id, "UPDATE_ACCOUNT", "Employee", employee.id, { targetName: employee.displayName, passwordReset: true }, { tx, restaurantId: employee.restaurantId });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });

    return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านแล้ว กรุณาเข้าสู่ระบบอีกครั้ง", requiresLogin: true });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "บันทึกข้อมูลบัญชีไม่สำเร็จ" }, { status: 500 });
  }
}
