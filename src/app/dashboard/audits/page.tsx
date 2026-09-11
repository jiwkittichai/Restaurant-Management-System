import { redirect } from "next/navigation";
import { Prisma, StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Audit } from "../audit-utils";
import AuditsClient from "./AuditsClient";

const INITIAL_LIMIT = 100;
const defaultHiddenActions = ["UPDATE_KITCHEN_STATUS"];
const billActions = ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PAY_ORDER_STRIPE", "PICKUP_ORDER"];


function isJsonObject(value: unknown): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export default async function AuditsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const [audits, totalCount, oldestAudit, latestAudit] = await Promise.all([
    prisma.auditLog.findMany({
      where: { restaurantId: user.restaurantId, action: { notIn: defaultHiddenActions } },
      take: INITIAL_LIMIT,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName: true } } },
    }),
    prisma.auditLog.count({ where: { restaurantId: user.restaurantId, action: { notIn: defaultHiddenActions } } }),
    prisma.auditLog.findFirst({ where: { restaurantId: user.restaurantId, action: { notIn: defaultHiddenActions } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where: { restaurantId: user.restaurantId, action: { notIn: defaultHiddenActions } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
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
        where: { restaurantId: user.restaurantId, id: { in: paymentOrderIds } },
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
        itemsSource: Array.isArray(details.items) ? "snapshot" : "current",
        itemCount: details.itemCount ?? order.items.reduce((sum, item) => sum + item.qty, 0),
      },
    };
  });

  const initial = JSON.parse(JSON.stringify({
    audits: enrichedAudits,
    meta: {
      totalCount,
      oldestAt: oldestAudit?.createdAt,
      latestAt: latestAudit?.createdAt,
      limit: INITIAL_LIMIT,
    },
  })) as {
    audits: Audit[];
    meta: { totalCount: number; oldestAt?: string; latestAt?: string; limit: number };
  };

  return <AuditsClient initialAudits={initial.audits} initialMeta={initial.meta} />;
}
