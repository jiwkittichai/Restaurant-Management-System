/**
 * จัดการการล็อกโต๊ะ ล็อกออเดอร์ และปิดช่วงใช้งานของโต๊ะ
 * ใช้ป้องกันคำขอที่เข้ามาพร้อมกันทำให้สถานะโต๊ะหรือบิลไม่ตรงกัน
 */

import { Prisma } from "@prisma/client";

export async function lockTable(tx: Prisma.TransactionClient, tableId: number) {
  await tx.$queryRaw`SELECT id FROM RestaurantTable WHERE id = ${tableId} FOR UPDATE`;
}
export async function lockOrderTable(tx: Prisma.TransactionClient, orderId: number) {
  const order = await tx.order.findUnique({ where: { id: orderId }, select: { tableId: true } });
  if (order?.tableId) await lockTable(tx, order.tableId);
  await tx.$queryRaw`SELECT id FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
}
export async function closeTableSession(tx: Prisma.TransactionClient, tableId: number) {
  await tx.tableSession.updateMany({ where: { tableId, closedAt: null }, data: { closedAt: new Date(), paused: true } });
}
