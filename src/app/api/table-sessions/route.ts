import { brandSelect, publicBrand } from "@/lib/restaurant-brand";
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { networkInterfaces } from "node:os";
import QRCode from "qrcode";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { lockTable, closeTableSession } from "@/lib/table-session";

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;
  try {
    const { tableId, action } = await req.json();
    if (!["open", "show", "rotate", "pause", "resume", "close", "clear-bill"].includes(action)) throw new Error("คำสั่งไม่ถูกต้อง");
    const table = await prisma.restaurantTable.findFirst({ where: { id: Number(tableId), restaurantId: auth.user.restaurantId }, include: { restaurant: { select: brandSelect } } });
    if (!table) return NextResponse.json({ error: "ไม่พบโต๊ะ" }, { status: 404 });
    const session = await prisma.$transaction(async tx => {
      await lockTable(tx, table.id);
      let current = await tx.tableSession.findFirst({ where: { tableId: table.id, closedAt: null } });
      if (action === "open" && !current) {
        const order = await tx.order.findFirst({ where: { tableId: table.id, paymentStatus: "UNPAID", status: { not: "CANCELLED" } } });
        current = await tx.tableSession.create({ data: { tableId: table.id, orderId: order?.id, token: randomBytes(32).toString("hex") } });
        await tx.restaurantTable.update({ where: { id: table.id }, data: { status: "OCCUPIED" } });
      }
      if (!current) throw new Error("ยังไม่ได้เปิดรอบโต๊ะ");
      if (action === "close") {
        const unpaid = await tx.order.count({ where: { tableId: table.id, paymentStatus: "UNPAID", status: { not: "CANCELLED" } } });
        if (unpaid) throw new Error("กรุณาชำระหรือยกเลิกบิลก่อนปิดรอบ");
        await closeTableSession(tx, table.id);
        await tx.restaurantTable.update({ where: { id: table.id }, data: { status: "AVAILABLE" } });
      }
      if (action === "rotate") current = await tx.tableSession.update({ where: { id: current.id }, data: { token: randomBytes(32).toString("hex") } });
      if (["pause", "resume", "clear-bill"].includes(action)) current = await tx.tableSession.update({ where: { id: current.id }, data: action === "clear-bill" ? { billRequestedAt: null, paused: false } : { paused: action === "pause" } });
      return current;
    });
    if (action === "rotate") await writeAudit(auth.user.id, "QR_TABLE_ROTATE", "RestaurantTable", table.id, { tableName: table.name });
    let origin = process.env.QR_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const address = new URL(origin);
    if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1", "0.0.0.0"].includes(address.hostname)) {
      const lan = Object.values(networkInterfaces()).flat().find(i => i?.family === "IPv4" && !i.internal);
      if (lan) { address.hostname = lan.address; origin = address.origin; }
    }
    const url = `${origin.replace(/\/$/, "")}/order/${session.token}`;
    return NextResponse.json({ brand: publicBrand(table.restaurant), id: session.id, url, qr: await QRCode.toDataURL(url, { width: 360, margin: 3 }), tableName: table.name, restaurantName: table.restaurant.name, createdAt: session.createdAt, paused: session.paused }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ทำรายการไม่สำเร็จ" }, { status: 400 });
  }
}
