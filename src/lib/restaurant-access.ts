import "server-only";
import { Prisma } from "@prisma/client";

// Financial/session mutations take this lock before table/order/employee locks.
// Suspension takes the exclusive restaurant lock, then revokes access.
export async function lockRestaurantAccess(tx: Prisma.TransactionClient, restaurantId: number, allowUnapprovedAccountRecovery = false) {
  const rows = await tx.$queryRaw<Array<{ active: boolean | number; approvalStatus: string }>>`SELECT active, approvalStatus FROM Restaurant WHERE id = ${restaurantId} LOCK IN SHARE MODE`;
  if (!rows[0]?.active || (!allowUnapprovedAccountRecovery && rows[0].approvalStatus !== "APPROVED")) throw new Error("RESTAURANT_SUSPENDED");
}
