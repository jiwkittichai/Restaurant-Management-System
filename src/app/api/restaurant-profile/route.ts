import { NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brandSelect, publicBrand } from "@/lib/restaurant-brand";
import { menuImageObjectKey } from "@/lib/menu-image";
export async function GET() {
  const auth = await authorizeApi(); if ("response" in auth) return auth.response;
  const restaurant = await prisma.restaurant.findUniqueOrThrow({ where: { id: auth.user.restaurantId }, select: brandSelect });
  return NextResponse.json(publicBrand(restaurant), { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(req: Request) {
  const auth = await authorizeApi([StaffRole.OWNER]); if ("response" in auth) return auth.response;
  try {
    const current = await prisma.restaurant.findUniqueOrThrow({ where: { id: auth.user.restaurantId }, select: brandSelect });
    const body = await req.json();
    const data: Record<string, string | null> = {};
    for (const [field, max] of Object.entries({ name: 100, address: 500, phone: 50, welcomeMessage: 200, receiptFooter: 300 })) {
      if (typeof body[field] !== "string" || body[field].trim().length > max) return NextResponse.json({ error: `ข้อมูล ${field} ไม่ถูกต้องหรือยาวเกิน ${max} ตัวอักษร` }, { status: 400 });
      data[field] = body[field].trim() || null;
    }
    if (!data.name) return NextResponse.json({ error: "กรุณาระบุชื่อร้าน" }, { status: 400 });
    if (body.logoUrl === null) data.logoUrl = null;
    else if (body.logoUrl !== undefined) {
      const key = typeof body.logoUrl === "string" ? menuImageObjectKey(body.logoUrl) : null;
      if (!key?.startsWith(`restaurants/${auth.user.restaurantId}/`)) return NextResponse.json({ error: "กรุณาอัปโหลดโลโก้ของร้านนี้" }, { status: 400 });
      data.logoUrl = body.logoUrl;
    }
    const saved = await prisma.restaurant.update({ where: { id: auth.user.restaurantId }, data: { ...data, name: data.name }, select: brandSelect });
    await writeAudit(auth.user.id, "UPDATE_RESTAURANT_PROFILE", "Restaurant", saved.id, {
      name:saved.name,
      logoChanged:current.logoUrl !== saved.logoUrl,
      before:{name:current.name,address:current.address,phone:current.phone,welcomeMessage:current.welcomeMessage,receiptFooter:current.receiptFooter},
      after:{name:saved.name,address:saved.address,phone:saved.phone,welcomeMessage:saved.welcomeMessage,receiptFooter:saved.receiptFooter},
    });
    return NextResponse.json(publicBrand(saved));
  } catch { return NextResponse.json({ error: "บันทึกข้อมูลร้านไม่สำเร็จ" }, { status: 400 }); }
}
