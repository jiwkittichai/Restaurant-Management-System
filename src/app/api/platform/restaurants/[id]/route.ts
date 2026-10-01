import { NextRequest, NextResponse } from "next/server";
import { authorizePlatform } from "@/lib/platform";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizePlatform();
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "รหัสร้านไม่ถูกต้อง" }, { status: 400 });
  const restaurant = await prisma.restaurant.findUnique({ where: { id }, select: {
    id: true, name: true, slug: true, active: true, createdAt: true, suspendedAt: true, approvalStatus: true, reviewedAt: true, reviewReason: true,
    owner: { select: { displayName: true, username: true, email: true, emailVerifiedAt: true } },
    _count: { select: { employees: true, menuItems: true, orders: true } },
  } });
  if (!restaurant) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  const logs = await prisma.platformLog.findMany({ where: { restaurantId: id, action: { in: ["RESTAURANT_SUSPENDED", "RESTAURANT_RESUMED", "RESTAURANT_APPROVED", "RESTAURANT_REJECTED"] } }, orderBy: { id: "desc" }, take: 20,
    select: { id: true, action: true, actorName: true, details: true, createdAt: true } });
  return NextResponse.json({ restaurant, logs }, { headers: { "Cache-Control": "no-store" } });
}
