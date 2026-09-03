import { redirect } from "next/navigation";
import { Prisma, StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Audit, roleText } from "../../../audit-utils";
import AuditsClient from "../../../audits/AuditsClient";

const INITIAL_LIMIT = 100;
const defaultHiddenActions = ["UPDATE_KITCHEN_STATUS"];
const billActions = ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PAY_ORDER_STRIPE", "PICKUP_ORDER"];


function isJsonObject(value: unknown): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function formatLogin(value?: Date | null) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  return value.toLocaleString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default async function EmployeeHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId)) redirect("/dashboard/employees");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, restaurantId: user.restaurantId },
    select: {
      id: true,
      username: true,
      displayName: true,
      active: true,
      lastLoginAt: true,
      roles: { select: { role: true } },
    },
  });
  if (!employee) redirect("/dashboard/employees");

  const where: Prisma.AuditLogWhereInput = {
    restaurantId: user.restaurantId,
    action: { notIn: defaultHiddenActions },
    OR: [
      { employeeId },
      { entityType: "Employee", entityId: String(employeeId) },
    ],
  };

  const [audits, totalCount, oldestAudit, latestAudit] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: INITIAL_LIMIT,
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
        .filter((orderId) => Number.isInteger(orderId)),
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
  const roles = employee.roles.map((item) => roleText[item.role]).join(", ");

  return (
    <AuditsClient
      initialAudits={initial.audits}
      initialMeta={initial.meta}
      employeeId={employee.id}
      title={`ประวัติกิจกรรมของ ${employee.displayName}`}
      description="ค้นหาและกรองประวัติรายบุคคลด้วยเงื่อนไขเดียวกับหน้าประวัติทั้งหมด"
      backHref="/dashboard/employees"
      backLabel="กลับหน้าจัดการพนักงาน"
      employeeSummary={[
        { label: "พนักงาน", value: `${employee.displayName} @${employee.username}` },
        { label: "สถานะ", value: employee.active ? "ใช้งาน" : "ปิดใช้งาน", accent: employee.active ? "text-emerald-600" : "text-gray-500" },
        { label: "บทบาท", value: roles || "พนักงาน" },
        { label: "เข้าสู่ระบบล่าสุด", value: formatLogin(employee.lastLoginAt) },
      ]}
    />
  );
}
