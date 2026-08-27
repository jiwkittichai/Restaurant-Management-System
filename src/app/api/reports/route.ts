import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";

const monthText = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yearKey(date: Date) {
  return String(date.getFullYear());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function daysBetween(from?: Date, to?: Date) {
  if (!from || !to) return 0;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.max(0, Math.round((end - start) / 86400000));
}

export async function GET(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  const range = req.nextUrl.searchParams.get("range");
  const mode = req.nextUrl.searchParams.get("mode");
  const fromText = req.nextUrl.searchParams.get("from");
  const toText = req.nextUrl.searchParams.get("to");
  const now = new Date();
  const from = range === "all" ? undefined : fromText ? new Date(`${fromText}T00:00:00`) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = range === "all" ? undefined : toText ? new Date(`${toText}T23:59:59.999`) : now;

  const orders = await prisma.order.findMany({
    where: { restaurantId: auth.user.restaurantId, paymentStatus: "PAID", payment: range === "all" ? { isNot: null } : { paidAt: { gte: from, lte: to } } },
    include: { items: { include: { menuItem: true, modifiers: true } }, payment: true, table: true },
    orderBy: { payment: { paidAt: "desc" } },
  });

  const bucketMode = mode === "TODAY"
    ? "hour"
    : range === "all" || (mode === "CUSTOM" && daysBetween(from, to) > 366)
      ? "year"
      : mode === "YEAR" || (mode === "CUSTOM" && daysBetween(from, to) > 62)
      ? "month"
      : "day";
  const topMap = new Map<string, { name: string; qty: number; sales: number }>();
  const paymentMap = new Map<string, number>();
  const dailyMap = new Map<string, { amount: number; orders: number }>();
  const chartMap = new Map<string, { label: string; amount: number; orders: number; sort: string }>();
  for (const order of orders) {
    if (order.payment) {
      paymentMap.set(order.payment.method, (paymentMap.get(order.payment.method) || 0) + order.payment.amount);
      const paidAt = order.payment.paidAt;
      const day = dateKey(paidAt);
      const current = dailyMap.get(day) || { amount: 0, orders: 0 };
      current.amount += order.total;
      current.orders += 1;
      dailyMap.set(day, current);
      const chartKey = bucketMode === "hour"
        ? `${day}-${String(paidAt.getHours()).padStart(2, "0")}`
        : bucketMode === "year"
          ? yearKey(paidAt)
        : bucketMode === "month"
          ? monthKey(paidAt)
          : day;
      const chartLabel = bucketMode === "hour"
        ? `${String(paidAt.getHours()).padStart(2, "0")}:00`
        : bucketMode === "year"
          ? yearKey(paidAt)
        : bucketMode === "month"
          ? monthText[paidAt.getMonth()]
          : `${paidAt.getDate()} ${monthText[paidAt.getMonth()]}`;
      const chartCurrent = chartMap.get(chartKey) || { label: chartLabel, amount: 0, orders: 0, sort: chartKey };
      chartCurrent.amount += order.total;
      chartCurrent.orders += 1;
      chartMap.set(chartKey, chartCurrent);
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
  const chartRows = [...chartMap.values()].sort((a, b) => a.sort.localeCompare(b.sort));
  const filledChartRows: Array<{ label: string; amount: number; orders: number; sort: string }> = [];
  if (bucketMode === "hour" && from) {
    const rowsByKey = new Map(chartRows.map((row) => [row.sort, row]));
    for (let hour = 10; hour <= 22; hour += 1) {
      const key = `${dateKey(from)}-${String(hour).padStart(2, "0")}`;
      filledChartRows.push(rowsByKey.get(key) || { label: `${String(hour).padStart(2, "0")}:00`, amount: 0, orders: 0, sort: key });
    }
  } else if (bucketMode === "day" && from && to) {
    const rowsByKey = new Map(chartRows.map((row) => [row.sort, row]));
    for (let date = new Date(from.getFullYear(), from.getMonth(), from.getDate()); date <= to; date = addDays(date, 1)) {
      const key = dateKey(date);
      filledChartRows.push(rowsByKey.get(key) || { label: `${date.getDate()} ${monthText[date.getMonth()]}`, amount: 0, orders: 0, sort: key });
    }
  } else if (bucketMode === "month") {
    const rowsByKey = new Map(chartRows.map((row) => [row.sort, row]));
    const start = from || oldestPaidAt || new Date(now.getFullYear(), 0, 1);
    const end = to || now;
    for (let date = new Date(start.getFullYear(), start.getMonth(), 1); date <= end; date = new Date(date.getFullYear(), date.getMonth() + 1, 1)) {
      const key = monthKey(date);
      filledChartRows.push(rowsByKey.get(key) || { label: monthText[date.getMonth()], amount: 0, orders: 0, sort: key });
    }
  } else if (bucketMode === "year") {
    const rowsByKey = new Map(chartRows.map((row) => [row.sort, row]));
    const start = from || oldestPaidAt || new Date(now.getFullYear(), 0, 1);
    const end = to || latestPaidAt || now;
    for (let year = start.getFullYear(); year <= end.getFullYear(); year += 1) {
      const key = String(year);
      filledChartRows.push(rowsByKey.get(key) || { label: key, amount: 0, orders: 0, sort: key });
    }
  }
  const chart = filledChartRows.length ? filledChartRows : chartRows;
  return NextResponse.json({
    summary: { sales, discounts, orders: orders.length, average: orders.length ? sales / orders.length : 0 },
    meta: { oldestPaidAt, latestPaidAt },
    topItems: [...topMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 10),
    payments: [...paymentMap.entries()].map(([method, amount]) => ({ method, amount })),
    daily: [...dailyMap.entries()]
      .map(([date, value]) => ({
        date,
        amount: value.amount,
        orders: value.orders,
        average: value.orders ? value.amount / value.orders : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    chart: chart
      .map(({ label, amount, orders, sort }) => ({
        key: sort,
        label,
        amount,
        orders,
        average: orders ? amount / orders : 0,
      })),
    chartMode: bucketMode,
    recent: orders.slice(0, 20).map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      table: order.table?.name || "ซื้อกลับบ้าน",
      type: order.type,
      status: order.status,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      note: order.note,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      method: order.payment?.method,
      paidAt: order.payment?.paidAt,
      receivedAmount: order.payment?.receivedAmount,
      changeAmount: order.payment?.changeAmount,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
        saleUnit: item.menuItem.saleUnit || "หน่วย",
        note: item.note,
        status: item.status,
        modifiers: item.modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.name,
          price: modifier.price,
        })),
      })),
    })),
  });
}
