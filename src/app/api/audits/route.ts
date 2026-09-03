import { NextRequest, NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultHiddenActions = ["UPDATE_KITCHEN_STATUS"];
const billActions = ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PAY_ORDER_STRIPE", "PICKUP_ORDER"];

function isJsonObject(value: unknown): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function dateInThaiTimezone(value: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+07:00`);
}

export async function GET(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  const action = req.nextUrl.searchParams.get("action") || "";
  const scope = req.nextUrl.searchParams.get("scope") || "important";
  const employeeId = Number(req.nextUrl.searchParams.get("employeeId") || 0);
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const take = Math.min(Math.max(Number(req.nextUrl.searchParams.get("take") || 100), 20), 300);

  const where: Prisma.AuditLogWhereInput = { restaurantId: auth.user.restaurantId };
  if (action) {
    where.action = action;
  } else if (scope !== "all") {
    where.action = { notIn: defaultHiddenActions };
  }
  if (employeeId) {
    where.OR = [
      { employeeId },
      { entityType: "Employee", entityId: String(employeeId) },
    ];
  }
  if (from || to) {
    const fromDate = from ? dateInThaiTimezone(from) : undefined;
    const toDate = to ? dateInThaiTimezone(to, true) : undefined;
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  const [audits, totalCount, oldestAudit, latestAudit] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const paymentOrderIds = [
    ...new Set(
      audits
        .filter((audit) => billActions.includes(audit.action))
        .map((audit) => Number(audit.entityId))
        .filter((id) => Number.isInteger(id)),
    ),
  ];
  const billOrders = paymentOrderIds.length
    ? await prisma.order.findMany({
        where: { restaurantId: auth.user.restaurantId, id: { in: paymentOrderIds } },
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          discount: true,
          total: true,
          table: { select: { name: true } },
          queueNumber: true,
          items: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              name: true,
              qty: true,
              price: true,
              note: true,
              modifiers: {
                orderBy: { id: "asc" },
                select: { id: true, name: true, price: true },
              },
            },
          },
        },
      })
    : [];
  const billOrderById = new Map(billOrders.map((order) => [order.id, order]));
  const enrichedAudits = audits.map((audit) => {
    if (!billActions.includes(audit.action)) return audit;
    const order = billOrderById.get(Number(audit.entityId));
    if (!order) return audit;
    const details = isJsonObject(audit.details) ? audit.details : {};
    return {
      ...audit,
      details: {
        ...details,
        orderNumber: details.orderNumber ?? order.orderNumber,
        subtotal: details.subtotal ?? order.subtotal,
        discount: details.discount ?? order.discount,
        total: details.total ?? order.total,
        tableName: details.tableName ?? order.table?.name,
        queueNumber: details.queueNumber ?? order.queueNumber,
        items: details.items ?? order.items,
        itemCount: details.itemCount ?? order.items.reduce((sum, item) => sum + item.qty, 0),
      },
    };
  });

  const filtered = q
    ? enrichedAudits.filter((audit) =>
        [
          audit.employee?.displayName,
          audit.action,
          audit.entityType,
          audit.entityId,
          JSON.stringify(audit.details || {}),
        ].some((value) => String(value || "").toLowerCase().includes(q)),
      )
    : enrichedAudits;

  return NextResponse.json({
    audits: filtered,
    meta: {
      totalCount,
      oldestAt: oldestAudit?.createdAt,
      latestAt: latestAudit?.createdAt,
      limit: take,
    },
  });
}
