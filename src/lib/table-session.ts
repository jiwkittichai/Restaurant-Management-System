import { Prisma } from "@prisma/client";

// All order/session mutations lock the table first, including payment and cancellation.
export async function lockTable(tx: Prisma.TransactionClient, tableId: number) {
  await tx.$queryRaw`SELECT id FROM RestaurantTable WHERE id = ${tableId} FOR UPDATE`;
}
export async function lockOrderTable(tx: Prisma.TransactionClient, orderId: number) {
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { tableId: true } });
  if (order?.tableId) await lockTable(tx, order.tableId);
}
export async function closeTableSession(tx: Prisma.TransactionClient, tableId: number) {
  await tx.tableSession.updateMany({ where: { tableId, closedAt: null }, data: { closedAt: new Date(), paused: true } });
}
