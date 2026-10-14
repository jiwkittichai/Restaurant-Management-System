/**
 * สร้างเลขออเดอร์และเลขคิวประจำวันโดยไม่ให้ซ้ำกัน
 * ใช้แยกลำดับของออเดอร์ในร้านและออเดอร์กลับบ้านตามวันทำการ
 */

import type { Prisma } from "@prisma/client";

export function orderBusinessDate(now: Date) {
  return new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function allocateOrderNumbers(tx: Prisma.TransactionClient, restaurantId: number, takeaway: boolean, now?: Date) {
  await tx.$executeRaw`INSERT INTO OrderNumberCounter (restaurantId, businessDate, orderSequence, queueSequence)
    VALUES (${restaurantId}, '', 0, 0)
    ON DUPLICATE KEY UPDATE restaurantId = VALUES(restaurantId)`;
  const [counter] = await tx.$queryRaw<Array<{ businessDate: string; orderSequence: number; queueSequence: number }>>`
    SELECT businessDate, orderSequence, queueSequence FROM OrderNumberCounter
    WHERE restaurantId = ${restaurantId} FOR UPDATE`;
  const businessDate = orderBusinessDate(now ?? new Date());
  const prefix = `ORD-${businessDate.slice(2).replaceAll("-", "")}-`;
  let orderSequence = counter.businessDate === businessDate ? counter.orderSequence : 0;
  let queueSequence = counter.businessDate === businessDate ? counter.queueSequence : 0;

  if (orderSequence === 0) {
    
    const existing = await tx.$queryRaw<Array<{ orderNumber: string }>>`
      SELECT orderNumber FROM \`Order\` WHERE restaurantId = ${restaurantId}
      AND orderNumber LIKE ${`${prefix}%`} FOR UPDATE`;
    for (const row of existing) {
      const suffix = row.orderNumber.slice(prefix.length);
      if (/^\d+$/.test(suffix) && Number.isSafeInteger(Number(suffix))) orderSequence = Math.max(orderSequence, Number(suffix));
    }
  }
  orderSequence += 1;
  let queueNumber: string | null = null;
  if (takeaway) {
    let occupied: Array<{ id: number }>;
    do {
      queueSequence += 1;
      queueNumber = `Q${String(queueSequence).padStart(3, "0")}`;
      
      occupied = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT id FROM \`Order\` WHERE restaurantId = ${restaurantId} AND queueNumber = ${queueNumber}
        AND (queueDate = ${businessDate} OR status NOT IN ('SERVED', 'CANCELLED')) LIMIT 1 FOR UPDATE`;
    } while (occupied.length);
  }
  await tx.orderNumberCounter.update({
    where: { restaurantId }, data: { businessDate, orderSequence, queueSequence },
  });
  return {
    orderNumber: `${prefix}${String(orderSequence).padStart(4, "0")}`,
    queueNumber,
    queueDate: takeaway ? businessDate : null,
  };
}
