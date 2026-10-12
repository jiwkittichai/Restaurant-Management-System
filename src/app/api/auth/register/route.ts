import { NextRequest, NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { writeAudit } from "@/lib/auth";
import { normalizedEmail } from "@/lib/account-tokens";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { platformSettings } from "@/lib/platform";
import { uniqueRestaurantSlug } from "@/lib/restaurant-registration";
import { clientKey, rateLimit, smallJson, RequestError, requestError } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit("register", clientKey(req), 5, 3600);
    if (limited) return limited;
    if (!(await platformSettings()).registrationOpen) throw new RequestError("ระบบปิดรับสมัครร้านใหม่ชั่วคราว", 403);
    const body = await smallJson(req);
    const restaurantName = String(body.restaurantName || "").trim();
    const displayName = String(body.displayName || "").trim();
    const username = String(body.username || "").trim().toLowerCase().replace(/^@+/, "");
    const password = String(body.password || "");

    if (!restaurantName || restaurantName.length > 100 || !displayName || displayName.length > 100) throw new RequestError("กรุณาระบุชื่อร้านและชื่อเจ้าของร้านไม่เกิน 100 ตัวอักษร");
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new RequestError("ชื่อผู้ใช้ต้องมี 3–30 ตัว และใช้ได้เฉพาะ a-z, 0-9, จุด, ขีดกลาง หรือขีดล่าง");
    if (password.length < 8 || password.length > 128) throw new RequestError("รหัสผ่านต้องมี 8–128 ตัวอักษร");
    const email = normalizedEmail(body.email);
    const [employeeExists, adminExists] = await Promise.all([
      prisma.employee.findUnique({ where: { username }, select: { id: true } }),
      prisma.platformAdmin.findUnique({ where: { username }, select: { id: true } }),
    ]);
    if (employeeExists || adminExists) throw new RequestError("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว", 409);

    const passwordHash = await hashPassword(password);
    const slug = await uniqueRestaurantSlug(restaurantName);
    await prisma.$transaction(async (tx) => {
      const settings = await tx.$queryRaw<Array<{ registrationOpen: boolean | number }>>`SELECT registrationOpen FROM PlatformSettings WHERE id = 1 LOCK IN SHARE MODE`;
      if (!settings[0]?.registrationOpen) throw new RequestError("ระบบปิดรับสมัครร้านใหม่ชั่วคราว", 403);
      const restaurant = await tx.restaurant.create({
        data: { name: restaurantName, slug, approvalStatus: "PENDING" },
      });
      const employee = await tx.employee.create({
        data: {
          restaurantId: restaurant.id,
          username,
          displayName,
          passwordHash,
          email,
          emailVerificationRequired: true,
          roles: { create: { role: StaffRole.OWNER } },
        },
      });
      await tx.restaurant.update({ where: { id: restaurant.id }, data: { ownerId: employee.id } });
      await writeAudit(employee.id, "REGISTER_RESTAURANT", "Restaurant", restaurant.id, { restaurantName, username, displayName }, { tx, restaurantId: restaurant.id });
    });

    return NextResponse.json({ success: true, redirectTo: "/login?registered=pending", message: "สมัครใช้งานเรียบร้อย กรุณารอการอนุมัติเพื่อเริ่มใช้งาน" }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 });
    }
    if (error instanceof RequestError) return requestError(error);
    return NextResponse.json({ error: "สมัครใช้งานไม่สำเร็จ" }, { status: 500 });
  }
}
