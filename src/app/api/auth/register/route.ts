import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { createSession, writeAudit } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `restaurant-${Date.now().toString().slice(-6)}`;
}

async function uniqueSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const restaurantName = String(body.restaurantName || "").trim();
    const displayName = String(body.displayName || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!restaurantName || !displayName || !/^[a-z0-9._-]{3,30}$/.test(username) || password.length < 8) {
      return NextResponse.json({ error: "กรุณากรอกชื่อร้าน ชื่อเจ้าของ ชื่อผู้ใช้ และรหัสผ่านอย่างน้อย 8 ตัว" }, { status: 400 });
    }

    const existing = await prisma.employee.findUnique({ where: { username }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const slug = await uniqueSlug(restaurantName);
    const owner = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: { name: restaurantName, slug },
      });
      const employee = await tx.employee.create({
        data: {
          restaurantId: restaurant.id,
          username,
          displayName,
          passwordHash,
          roles: { create: { role: StaffRole.OWNER } },
        },
      });
      await tx.restaurant.update({ where: { id: restaurant.id }, data: { ownerId: employee.id } });
      return employee;
    });

    await createSession(owner.id);
    await writeAudit(owner.id, "REGISTER_RESTAURANT", "Restaurant", owner.restaurantId, { restaurantName, username, displayName });
    return NextResponse.json({ success: true, redirectTo: "/dashboard" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "สมัครใช้งานไม่สำเร็จ" }, { status: 500 });
  }
}
