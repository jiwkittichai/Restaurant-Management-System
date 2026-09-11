import { NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER, StaffRole.KITCHEN, StaffRole.STOCK]);
  if ("response" in auth) return auth.response;
  const { restaurantId, roles } = auth.user;
  const front = roles.some(r => r === "OWNER" || r === "CASHIER");
  const kitchen = roles.some(r => r === "OWNER" || r === "KITCHEN");
  const stock = roles.some(r => r === "OWNER" || r === "STOCK");
  const [orders, sessions, ingredients] = await Promise.all([
    front || kitchen ? prisma.order.findMany({
      where: { restaurantId, status: { notIn: ["CANCELLED", "SERVED"] }, OR: [{ type: "DINE_IN", paymentStatus: "UNPAID" }, { type: "TAKEAWAY", pickedUpAt: null }] },
      select: { id: true, type: true, status: true, tableId: true, queueNumber: true, orderNumber: true, table: { select: { name: true } }, items: { where: { status: { in: ["NEW", "READY"] } }, select: { id: true, qty: true, status: true } } },
      orderBy: { id: "asc" },
    }) : Promise.resolve([]),
    front ? prisma.tableSession.findMany({ where: { table: { restaurantId }, closedAt: null, billRequestedAt: { not: null } }, select: { id: true, tableId: true, table: { select: { name: true } } }, orderBy: { billRequestedAt: "asc" } }) : Promise.resolve([]),
    stock ? prisma.ingredient.findMany({ where: { restaurantId, active: true, stock: { lte: prisma.ingredient.fields.minStock } }, select: { id: true, name: true, stock: true }, orderBy: [{ stock: "asc" }, { id: "asc" }] }) : Promise.resolve([]),
  ]);
  const notifications: Array<{ id: string; text: string; href: string; kind: string; revision: string }> = [];
  for (const s of sessions) notifications.push({ id: `bill-${s.id}`, kind: "bill", text: `${s.table.name} เรียกเก็บเงิน`, href: `/dashboard/tables#bill-${s.tableId}`, revision: String(s.id) });
  for (const o of orders) {
    const ready = o.items.filter(i => i.status === "READY");
    if (front && o.type === "DINE_IN" && o.tableId && ready.length) notifications.push({ id: `ready-${o.id}`, kind: "ready", text: `${o.table?.name} อาหารพร้อมเสิร์ฟ ${ready.reduce((n, i) => n + i.qty, 0)} รายการ`, href: `/dashboard/tables#table-${o.tableId}`, revision: ready.map(i => i.id).join(",") });
    if (front && o.type === "TAKEAWAY" && o.status === "READY") notifications.push({ id: `pickup-${o.id}`, kind: "pickup", text: `คิว ${o.queueNumber || o.orderNumber} พร้อมรับ`, href: `/dashboard/takeaway#order-${o.id}`, revision: String(o.id) });
  }
  for (const o of orders) {
    const pending = o.items.filter(i => i.status === "NEW");
    if (kitchen && pending.length) notifications.push({ id: `new-${o.id}`, kind: "new", text: `${o.table?.name || `คิว ${o.queueNumber || o.orderNumber}`} มีอาหารรอครัว ${pending.reduce((n, i) => n + i.qty, 0)} รายการ`, href: `/dashboard/kitchen#order-${o.id}`, revision: pending.map(i => i.id).join(",") });
  }
  for (const i of ingredients) notifications.push({ id: `stock-${i.id}`, kind: "stock", text: `${i.name} ${i.stock <= 0 ? "หมด" : "ใกล้หมด"}`, href: `/dashboard/inventory#ingredient-${i.id}`, revision: i.stock <= 0 ? "empty" : "low" });
  return NextResponse.json(notifications, { headers: { "Cache-Control": "no-store" } });
}
