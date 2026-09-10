import { NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER, StaffRole.KITCHEN]);
  if ("response" in auth) return auth.response;
  const canBill = auth.user.roles.some(r => r === "OWNER" || r === "CASHIER");
  const [orders, sessions] = await Promise.all([
    prisma.order.findMany({ where: { restaurantId: auth.user.restaurantId, status: { not: "CANCELLED" }, items: { some: { source: "QR", status: "NEW" } } }, select: { id: true, table: { select: { name: true } }, items: { where: { source: "QR", status: "NEW" }, select: { qty: true } } } }),
    canBill ? prisma.tableSession.findMany({ where: { table: { restaurantId: auth.user.restaurantId }, closedAt: null, billRequestedAt: { not: null } }, select: { id: true, table: { select: { name: true } } } }) : Promise.resolve([]),
  ]);
  return NextResponse.json([
    ...sessions.map(s => ({ id: `bill-${s.id}`, text: `${s.table.name} เรียกเก็บเงิน`, href: "/dashboard/tables" })),
    ...orders.map(o => ({ id: `order-${o.id}`, text: `${o.table?.name} สั่งผ่าน QR · รอครัว ${o.items.reduce((n, i) => n + i.qty, 0)} รายการ`, href: canBill ? "/dashboard/orders" : "/dashboard/kitchen" })),
  ], { headers: { "Cache-Control": "no-store" } });
}
