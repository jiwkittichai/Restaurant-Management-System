import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  const range = req.nextUrl.searchParams.get("range");
  const fromText = req.nextUrl.searchParams.get("from");
  const toText = req.nextUrl.searchParams.get("to");
  const now = new Date();
  const from = range === "all" ? undefined : fromText ? new Date(`${fromText}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = range === "all" ? undefined : toText ? new Date(`${toText}T23:59:59.999`) : now;

  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID", payment: range === "all" ? { isNot: null } : { paidAt: { gte: from, lte: to } } },
    include: { items: true, payment: true, table: true },
    orderBy: { payment: { paidAt: "desc" } },
  });

  const topMap = new Map<string, { name: string; qty: number; sales: number }>();
  const paymentMap = new Map<string, number>();
  const dailyMap = new Map<string, number>();
  for (const order of orders) {
    if (order.payment) {
      paymentMap.set(order.payment.method, (paymentMap.get(order.payment.method) || 0) + order.payment.amount);
      const day = order.payment.paidAt.toISOString().slice(0, 10);
      dailyMap.set(day, (dailyMap.get(day) || 0) + order.total);
    }
    for (const item of order.items) {
      const current = topMap.get(item.name) || { name: item.name, qty: 0, sales: 0 };
      current.qty += item.qty; current.sales += item.price * item.qty; topMap.set(item.name, current);
    }
  }
  const sales = orders.reduce((sum, order) => sum + order.total, 0);
  const discounts = orders.reduce((sum, order) => sum + order.discount, 0);
  const paidDates = orders.flatMap((order) => order.payment?.paidAt ? [order.payment.paidAt] : []);
  const oldestPaidAt = paidDates.length ? new Date(Math.min(...paidDates.map((date) => date.getTime()))) : null;
  const latestPaidAt = paidDates.length ? new Date(Math.max(...paidDates.map((date) => date.getTime()))) : null;
  return NextResponse.json({
    summary: { sales, discounts, orders: orders.length, average: orders.length ? sales / orders.length : 0 },
    meta: { oldestPaidAt, latestPaidAt },
    topItems: [...topMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 10),
    payments: [...paymentMap.entries()].map(([method, amount]) => ({ method, amount })),
    daily: [...dailyMap.entries()].map(([date, amount]) => ({ date, amount })).sort((a, b) => a.date.localeCompare(b.date)),
    recent: orders.slice(0, 20).map((order) => ({
      id: order.id, orderNumber: order.orderNumber, table: order.table?.name || "ซื้อกลับบ้าน",
      total: order.total, method: order.payment?.method, paidAt: order.payment?.paidAt,
    })),
  });
}
