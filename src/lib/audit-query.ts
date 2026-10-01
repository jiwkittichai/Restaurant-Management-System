import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RequestError } from "@/lib/request-security";
import { auditGroups, quietAuditActions } from "@/lib/audit-groups";

const billActions = ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PICKUP_ORDER"];
function integer(value: string | null, fallback: number, max: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > max) throw new RequestError("ตัวกรองตัวเลขไม่ถูกต้อง");
  return Number(value);
}
function thaiDate(value: string | null, end = false) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < "1000-01-01" || value > "9999-12-31") throw new RequestError("วันที่ไม่ถูกต้อง");
  const date = new Date(`${value}T00:00:00.000+07:00`);
  if (!Number.isFinite(date.getTime()) || new Date(date.getTime() + 7 * 3600000).toISOString().slice(0, 10) !== value) throw new RequestError("วันที่ไม่ถูกต้อง");
  return new Date(date.getTime() + (end ? 86400000 - 1 : 0));
}
function decodeCursor(value: string | null): { id: number; createdAt: Date } | null {
  if (!value) return null;
  try {
    if (value.length > 200 || !/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error();
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString());
    const date = new Date(parsed.at);
    if (!Number.isSafeInteger(parsed.id) || parsed.id < 1 || parsed.id > 2147483647 || typeof parsed.at !== "string" || !/^[1-9]\d{3}-/.test(parsed.at) || !Number.isFinite(date.getTime()) || date.toISOString() !== parsed.at) throw new Error();
    return { id: parsed.id, createdAt: date };
  } catch { throw new RequestError("ตำแหน่งหน้าประวัติไม่ถูกต้อง"); }
}

export async function queryAudits(restaurantId: number, params = new URLSearchParams()) {
  const take = integer(params.get("take"), 100, 100);
  const employeeId = integer(params.get("employeeId"), 0, 2147483647);
  const groupId = params.get("group") || "";
  const scope = params.get("scope") || "important";
  const action = params.get("action") || "";
  const q = (params.get("q") || "").trim();
  if (q.length > 100 || !["important", "all"].includes(scope)) throw new RequestError("ตัวกรองไม่ถูกต้อง");
  const group = auditGroups.find(item => item.id === groupId);
  if ((groupId && !group) || (groupId && action) || action.length > 2000 || (action && !/^[A-Z_-]+(?:,[A-Z_-]+){0,39}$/.test(action))) throw new RequestError("หมวดกิจกรรมไม่ถูกต้อง");
  const from = thaiDate(params.get("from"));
  const to = thaiDate(params.get("to"), true);
  if (from && to && from > to) throw new RequestError("วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด");
  const cursor = decodeCursor(params.get("before"));
  // Tenant scope is ANDed with every OR condition, including employee and search.
  const clauses = [Prisma.sql`a.restaurantId = ${restaurantId}`, Prisma.sql`a.action <> 'REGISTER_RESTAURANT'`];
  if (group || action) clauses.push(Prisma.sql`a.action IN (${Prisma.join(group ? [...group.actions] : action.split(","))})`);
  else if (scope !== "all") clauses.push(Prisma.sql`a.action NOT IN (${Prisma.join(quietAuditActions)})`);
  if (employeeId) clauses.push(Prisma.sql`(a.employeeId = ${employeeId} OR (a.entityType = 'Employee' AND a.entityId = ${String(employeeId)}))`);
  if (from) clauses.push(Prisma.sql`a.createdAt >= ${from}`);
  if (to) clauses.push(Prisma.sql`a.createdAt <= ${to}`);
  if (q) {
    // Literal substring, not LIKE wildcards; searches saved snapshots, not mutable bill data.
    const needle = q.toLowerCase();
    clauses.push(Prisma.sql`(LOCATE(${needle}, LOWER(COALESCE(e.displayName, ''))) > 0 OR LOCATE(${needle}, LOWER(a.action)) > 0 OR LOCATE(${needle}, LOWER(a.entityType)) > 0 OR LOCATE(${needle}, LOWER(COALESCE(a.entityId, ''))) > 0 OR LOCATE(${needle}, LOWER(COALESCE(CAST(a.details AS CHAR CHARACTER SET utf8mb4), ''))) > 0)`);
  }
  const where = Prisma.join(clauses, " AND ");
  const pageWhere = cursor ? Prisma.sql`${where} AND (a.createdAt < ${cursor.createdAt} OR (a.createdAt = ${cursor.createdAt} AND a.id < ${cursor.id}))` : where;
  const result = await prisma.$transaction(async tx => {
    const ids = await tx.$queryRaw<Array<{ id: number }>>(Prisma.sql`SELECT a.id FROM AuditLog a LEFT JOIN Employee e ON e.id = a.employeeId WHERE ${pageWhere} ORDER BY a.createdAt DESC, a.id DESC LIMIT ${take + 1}`);
    const [stats] = await tx.$queryRaw<Array<{ totalCount: bigint; oldestAt: Date | null; latestAt: Date | null }>>(Prisma.sql`SELECT COUNT(*) AS totalCount, MIN(a.createdAt) AS oldestAt, MAX(a.createdAt) AS latestAt FROM AuditLog a LEFT JOIN Employee e ON e.id = a.employeeId WHERE ${where}`);
    const audits = await tx.auditLog.findMany({ where: { restaurantId, id: { in: ids.slice(0, take).map(row => row.id) } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: { employee: { select: { displayName: true } } } });
    return { audits, stats, more: ids.length > take };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead });

  // Only old entries without snapshots need the existing bill drawer fallback.
  const orderIds = [...new Set(result.audits.filter(a => billActions.includes(a.action) && !Array.isArray((a.details as Prisma.JsonObject | null)?.items)).map(a => Number(a.entityId)).filter(id => Number.isSafeInteger(id) && id > 0))];
  const orders = orderIds.length ? await prisma.order.findMany({ where: { restaurantId, id: { in: orderIds } }, select: { id: true, orderNumber: true, subtotal: true, discount: true, total: true, table: { select: { name: true } }, queueNumber: true, items: { orderBy: { id: "asc" }, select: { id: true, name: true, qty: true, price: true, note: true, modifiers: { orderBy: { id: "asc" }, select: { id: true, name: true, price: true } } } } } }) : [];
  const byId = new Map(orders.map(order => [order.id, order]));
  const audits = result.audits.map(audit => {
    if (!billActions.includes(audit.action)) return audit;
    const details = audit.details && typeof audit.details === "object" && !Array.isArray(audit.details) ? audit.details : {};
    if (Array.isArray(details.items)) return { ...audit, details: { ...details, itemsSource: "snapshot" } };
    const order = byId.get(Number(audit.entityId));
    if (!order) return audit;
    return { ...audit, details: { ...details, orderNumber: details.orderNumber ?? order.orderNumber, subtotal: details.subtotal ?? order.subtotal, discount: details.discount ?? order.discount, total: details.total ?? order.total, tableName: details.tableName ?? order.table?.name, queueNumber: details.queueNumber ?? order.queueNumber, items: details.items ?? order.items, itemsSource: "current", itemCount: details.itemCount ?? order.items.reduce((sum, item) => sum + item.qty, 0) } };
  });
  const last = result.audits.at(-1);
  return { audits, meta: { totalCount: Number(result.stats.totalCount), oldestAt: result.stats.oldestAt, latestAt: result.stats.latestAt, limit: take, nextCursor: result.more && last ? Buffer.from(JSON.stringify({ id: last.id, at: last.createdAt.toISOString() })).toString("base64url") : null } };
}

export async function queryAuditById(restaurantId: number, id: number) {
  const audit = await prisma.auditLog.findFirst({
    where: { id, restaurantId },
    include: { employee: { select: { displayName: true } } },
  });
  if (!audit || !billActions.includes(audit.action)) return audit;
  const details = audit.details && typeof audit.details === "object" && !Array.isArray(audit.details) ? audit.details : {};
  if (Array.isArray(details.items)) return { ...audit, details: { ...details, itemsSource: "snapshot" } };
  const orderId = Number(audit.entityId);
  if (!Number.isSafeInteger(orderId) || orderId < 1) return audit;
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: { orderNumber: true, subtotal: true, discount: true, total: true, table: { select: { name: true } }, queueNumber: true, items: { orderBy: { id: "asc" }, select: { id: true, name: true, qty: true, price: true, note: true, modifiers: { orderBy: { id: "asc" }, select: { id: true, name: true, price: true } } } } },
  });
  if (!order) return audit;
  return { ...audit, details: { ...details, orderNumber: details.orderNumber ?? order.orderNumber, subtotal: details.subtotal ?? order.subtotal, discount: details.discount ?? order.discount, total: details.total ?? order.total, tableName: details.tableName ?? order.table?.name, queueNumber: details.queueNumber ?? order.queueNumber, items: details.items ?? order.items, itemsSource: "current", itemCount: details.itemCount ?? order.items.reduce((sum, item) => sum + item.qty, 0) } };
}
