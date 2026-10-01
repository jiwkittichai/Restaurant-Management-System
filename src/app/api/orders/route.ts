import { moneyJson } from "@/lib/money";
import { submitOrder } from "@/lib/submit-order";
import { lockOrderTable, closeTableSession } from "@/lib/table-session";
import { KitchenStatus, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma, StaffRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { money } from "@/lib/money";
import { lockRestaurantAccess } from "@/lib/restaurant-access";

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view");
  const allowed=view==="history"?[StaffRole.OWNER]:view==="takeaway"?[StaffRole.OWNER,StaffRole.CASHIER]:[StaffRole.OWNER,StaffRole.CASHIER,StaffRole.KITCHEN];
  const auth=await authorizeApi(allowed);if("response" in auth)return auth.response;
  const where: Prisma.OrderWhereInput = view === "history"
    ? { restaurantId: auth.user.restaurantId }
    : view === "takeaway"
      ? { restaurantId: auth.user.restaurantId, type: OrderType.TAKEAWAY, status: { notIn: [OrderStatus.SERVED, OrderStatus.CANCELLED] } }
      : { restaurantId: auth.user.restaurantId, status: { in: [OrderStatus.SENT, OrderStatus.PREPARING, OrderStatus.READY] } };
  const orderBy: Prisma.OrderOrderByWithRelationInput = view === "history" || view === "takeaway"
    ? { createdAt: "desc" }
    : { createdAt: "asc" };
  const orders = await prisma.order.findMany({
    where,
    include: {
      table: true,
      items: {
        include: {
          menuItem: { include: { recipes: { include: { ingredient: true } } } },
          modifiers: {
            include: {
              modifier: { include: { recipes: { include: { ingredient: true } } } },
            },
          },
        },
      },
      payment: true,
    },
    orderBy,
  });
  return moneyJson(orders);
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;
  return submitOrder(req, auth.user.restaurantId, auth.user.id);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const allowed=body.action==="item-status"?[StaffRole.OWNER,StaffRole.KITCHEN]:[StaffRole.OWNER,StaffRole.CASHIER];
    const auth=await authorizeApi(allowed);if("response" in auth)return auth.response;
    if (body.action === "item-status") {
      const item = await prisma.$transaction(async tx => {
      await lockRestaurantAccess(tx, auth.user.restaurantId);
      const target = await tx.orderItem.findFirstOrThrow({ where: { id: Number(body.itemId), order: { restaurantId: auth.user.restaurantId } } });
      await lockOrderTable(tx, target.orderId);
      const current = await tx.orderItem.findUniqueOrThrow({ where: { id: target.id }, include: { order: true } });
      if (current.order.status === OrderStatus.CANCELLED || current.order.pickedUpAt || (current.order.type === OrderType.DINE_IN && current.order.paymentStatus === PaymentStatus.PAID)) throw new Error("CLOSED_ORDER");
      const next: Partial<Record<KitchenStatus, KitchenStatus>> = { NEW: KitchenStatus.PREPARING, PREPARING: KitchenStatus.READY, READY: KitchenStatus.SERVED };
      if (body.status !== current.status && (next[current.status] !== body.status || (current.order.type === OrderType.TAKEAWAY && body.status === KitchenStatus.SERVED))) throw new Error("INVALID_TRANSITION");
      const item = await tx.orderItem.update({
        where: { id: current.id },
        data: { status: body.status as KitchenStatus },
      });
      const siblings = await tx.orderItem.findMany({ where: { orderId: item.orderId } });
      const status = siblings.every((i) => i.status === KitchenStatus.SERVED)
        ? OrderStatus.SERVED
        : siblings.every((i) => i.status === KitchenStatus.READY || i.status === KitchenStatus.SERVED)
        ? OrderStatus.READY
        : siblings.some((i) => i.status === KitchenStatus.PREPARING)
          ? OrderStatus.PREPARING
          : OrderStatus.SENT;
      await tx.order.update({ where: { id: item.orderId }, data: { status } });
      return item;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      return moneyJson(item);
    }
    if (body.action === "pay") {
      const order = await prisma.$transaction(async (tx) => {
        await lockRestaurantAccess(tx, auth.user.restaurantId);
        await lockOrderTable(tx, Number(body.orderId));
        const current = await tx.order.findFirstOrThrow({
          where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
          include: { payment: true, items: { include: { modifiers: true }, orderBy: { id: "asc" } } },
        });
        if (current.payment) throw new Error("ALREADY_PAID");
        if (current.status === OrderStatus.CANCELLED) throw new Error("CANCELLED_ORDER");
        const method = body.method as PaymentMethod;
        if (method !== PaymentMethod.CASH && method !== PaymentMethod.PROMPTPAY) throw new Error("INVALID_PAYMENT_METHOD");
        const receivedAmount = method === PaymentMethod.CASH ? money(body.receivedAmount ?? current.total) : current.total;
        if (receivedAmount.lessThan(current.total)) throw new Error("INSUFFICIENT_PAYMENT");
        const changeAmount = receivedAmount.minus(current.total);
        const payment = await tx.payment.create({
          data: { restaurantId: auth.user.restaurantId, orderId: current.id, method, amount: current.total, receivedAmount, changeAmount },
        });
        const paid = await tx.order.update({
          where: { id: current.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: current.type === OrderType.DINE_IN ? OrderStatus.SERVED : current.status,
          },
        });
        if (current.tableId) await closeTableSession(tx, current.tableId);
        if (current.tableId) await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
        await writeAudit(auth.user.id, "PAY_ORDER", "Order", paid.id, {
          snapshotVersion: 1,
          paymentId: payment.id,
          orderNumber: paid.orderNumber,
          type: paid.type,
          subtotal: paid.subtotal,
          discount: paid.discount,
          total: paid.total,
          method: payment.method,
          receivedAmount: payment.receivedAmount,
          changeAmount: payment.changeAmount,
          itemCount: current.items.reduce((sum, item) => sum + item.qty, 0),
          items: current.items.map(item => ({
            id: item.id, name: item.name, qty: item.qty, price: item.price, note: item.note,
            modifiers: item.modifiers.map(m => ({ name: m.name, price: m.price })),
          })),
        }, { tx, restaurantId: auth.user.restaurantId });
        return { ...paid, payment, items: current.items };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      return moneyJson(order);
    }
    if (body.action === "pickup") {
      const order = await prisma.$transaction(async tx => {
      await lockRestaurantAccess(tx, auth.user.restaurantId);
      await lockOrderTable(tx, Number(body.orderId));
      const current = await tx.order.findFirstOrThrow({
        where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
        include: { items: { include: { modifiers: true }, orderBy: { id: "asc" } } },
      });
      if (current.type !== OrderType.TAKEAWAY) throw new Error("NOT_TAKEAWAY");
      if (current.paymentStatus !== PaymentStatus.PAID) throw new Error("PAYMENT_REQUIRED");
      if (current.status !== OrderStatus.READY) throw new Error("NOT_READY");
      const order = await tx.order.update({
        where: { id: current.id }, data: { status: OrderStatus.SERVED, pickedUpAt: new Date() },
      });
      await writeAudit(auth.user.id,"PICKUP_ORDER","Order",order.id,{
        orderNumber:order.orderNumber,
        type:order.type,
        total:order.total,
        queueNumber:order.queueNumber,
        itemCount:current.items.reduce((sum,item)=>sum+item.qty,0),
      }, { tx, restaurantId: auth.user.restaurantId });
      return order;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      return moneyJson(order);
    }
    if (body.action === "cancel") {
      const order = await prisma.$transaction(async (tx) => {
        await lockRestaurantAccess(tx, auth.user.restaurantId);
        await lockOrderTable(tx, Number(body.orderId));
        const current = await tx.order.findFirstOrThrow({
          where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
        });
        if (current.paymentStatus === PaymentStatus.PAID) throw new Error("PAID_ORDER");
        if (current.status === OrderStatus.CANCELLED) throw new Error("CANCELLED_ORDER");
        if (current.stockDeducted) {
          const restore = new Map<number, number>();
          const movements = await tx.stockMovement.findMany({ where: { restaurantId: auth.user.restaurantId, reference: current.orderNumber, type: "STOCK_OUT" } });
          if (!movements.length) throw new Error("STOCK_HISTORY_MISSING");
          for (const movement of movements) {
            restore.set(movement.ingredientId, (restore.get(movement.ingredientId) || 0) + movement.quantity);
          }
          for (const [ingredientId, quantity] of [...restore].sort(([a], [b]) => a - b)) {
            await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: { increment: quantity } } });
            await tx.stockMovement.create({ data: { restaurantId: auth.user.restaurantId, ingredientId, type: "STOCK_IN", quantity, reference: current.orderNumber, note: "คืนจากการยกเลิกออเดอร์" } });
          }
        }
        const cancelled = await tx.order.update({ where: { id: current.id }, data: { status: OrderStatus.CANCELLED, stockDeducted: false } });
        if (current.tableId) await closeTableSession(tx, current.tableId);
        if (current.tableId) await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
        await writeAudit(auth.user.id,"CANCEL_ORDER","Order",cancelled.id,{orderNumber:cancelled.orderNumber}, { tx, restaurantId: auth.user.restaurantId });
        return cancelled;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      return moneyJson(order);
    }
    return moneyJson({ error: "ไม่รู้จักคำสั่ง" }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "INVALID_AMOUNT" ? "ยอดเงินต้องไม่ติดลบและมีทศนิยมไม่เกิน 2 ตำแหน่ง" : code === "CLOSED_ORDER" ? "บิลนี้สิ้นสุดแล้ว" : code === "INVALID_TRANSITION" ? "ไม่สามารถเปลี่ยนสถานะอาหารตามที่ระบุ" : code === "STOCK_HISTORY_MISSING" ? "ไม่พบประวัติตัดสต็อก กรุณาตรวจสอบก่อนยกเลิก" : code === "CANCELLED_ORDER" ? "บิลนี้ยกเลิกแล้ว" : code === "PAYMENT_REQUIRED" ? "กรุณาชำระเงินก่อนส่งมอบอาหาร"
      : code === "NOT_READY" ? "อาหารยังไม่พร้อมรับ"
        : code === "PAID_ORDER" ? "ไม่สามารถยกเลิกบิลที่ชำระแล้ว"
          : code === "ALREADY_PAID" ? "ออเดอร์นี้ชำระเงินแล้ว"
            : code === "INSUFFICIENT_PAYMENT" ? "ยอดรับเงินต้องไม่น้อยกว่ายอดสุทธิ"
              : code === "INVALID_PAYMENT_METHOD" ? "รองรับเฉพาะเงินสดและพร้อมเพย์"
                : "อัปเดตออเดอร์ไม่สำเร็จ";
    return moneyJson({ error: message }, { status: 500 });
  }
}
