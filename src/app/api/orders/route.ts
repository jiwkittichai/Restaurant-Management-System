import { submitOrder } from "@/lib/submit-order";
import { lockOrderTable, closeTableSession } from "@/lib/table-session";
import { KitchenStatus, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma, StaffRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApi, writeAudit } from "@/lib/auth";

type CartItem = { menuItemId: number; qty: number; note?: string; modifierIds?: number[] };

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
  return NextResponse.json(orders);
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
      const current = await prisma.orderItem.findFirstOrThrow({ where: { id: Number(body.itemId), order: { restaurantId: auth.user.restaurantId } }, include: { order: true } });
      const item = await prisma.orderItem.update({
        where: { id: current.id },
        data: { status: body.status as KitchenStatus },
      });
      const siblings = await prisma.orderItem.findMany({ where: { orderId: item.orderId } });
      const status = siblings.every((i) => i.status === KitchenStatus.SERVED)
        ? OrderStatus.SERVED
        : siblings.every((i) => i.status === KitchenStatus.READY || i.status === KitchenStatus.SERVED)
        ? OrderStatus.READY
        : siblings.some((i) => i.status === KitchenStatus.PREPARING)
          ? OrderStatus.PREPARING
          : OrderStatus.SENT;
      await prisma.order.update({ where: { id: item.orderId }, data: { status } });
      await writeAudit(auth.user.id,"UPDATE_KITCHEN_STATUS","OrderItem",item.id,{
        orderId:item.orderId,
        orderNumber:current.order.orderNumber,
        itemName:current.name,
        before:{status:current.status},
        after:{status:item.status},
      });
      return NextResponse.json(item);
    }
    if (body.action === "pay") {
      const order = await prisma.$transaction(async (tx) => {
        await lockOrderTable(tx, Number(body.orderId));
        const current = await tx.order.findFirstOrThrow({
          where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
          include: { payment: true, items: { include: { modifiers: true }, orderBy: { id: "asc" } } },
        });
        if (current.payment) throw new Error("ALREADY_PAID");
        if (current.status === OrderStatus.CANCELLED) throw new Error("CANCELLED_ORDER");
        const method = body.method as PaymentMethod;
        if (method !== PaymentMethod.CASH && method !== PaymentMethod.PROMPTPAY) throw new Error("INVALID_PAYMENT_METHOD");
        const receivedAmount = method === PaymentMethod.CASH ? Number(body.receivedAmount ?? current.total) : current.total;
        if (!Number.isFinite(receivedAmount) || receivedAmount < current.total) throw new Error("INSUFFICIENT_PAYMENT");
        const changeAmount = method === PaymentMethod.CASH ? Math.max(0, receivedAmount - current.total) : 0;
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
        return { ...paid, payment, items: current.items };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      await writeAudit(auth.user.id,"PAY_ORDER","Order",order.id,{
        orderNumber:order.orderNumber,
        method:order.payment.method,
        total:order.total,
        receivedAmount:order.payment.receivedAmount,
        changeAmount:order.payment.changeAmount,
        itemCount:order.items.reduce((sum,item)=>sum+item.qty,0),
        items:order.items.map(item=>({
          id:item.id,
          name:item.name,
          qty:item.qty,
          price:item.price,
          note:item.note,
          modifiers:item.modifiers.map(modifier=>({id:modifier.id,name:modifier.name,price:modifier.price})),
        })),
      });
      return NextResponse.json(order);
    }
    if (body.action === "pickup") {
      const current = await prisma.order.findFirstOrThrow({
        where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
        include: { items: { include: { modifiers: true }, orderBy: { id: "asc" } } },
      });
      if (current.type !== OrderType.TAKEAWAY) throw new Error("NOT_TAKEAWAY");
      if (current.paymentStatus !== PaymentStatus.PAID) throw new Error("PAYMENT_REQUIRED");
      if (current.status !== OrderStatus.READY) throw new Error("NOT_READY");
      const order = await prisma.order.update({
        where: { id: current.id }, data: { status: OrderStatus.SERVED, pickedUpAt: new Date() },
      });
      await writeAudit(auth.user.id,"PICKUP_ORDER","Order",order.id,{
        orderNumber:order.orderNumber,
        type:order.type,
        total:order.total,
        queueNumber:order.queueNumber,
        itemCount:current.items.reduce((sum,item)=>sum+item.qty,0),
        items:current.items.map(item=>({
          id:item.id,
          name:item.name,
          qty:item.qty,
          price:item.price,
          note:item.note,
          modifiers:item.modifiers.map(modifier=>({id:modifier.id,name:modifier.name,price:modifier.price})),
        })),
      });
      return NextResponse.json(order);
    }
    if (body.action === "cancel") {
      const order = await prisma.$transaction(async (tx) => {
        await lockOrderTable(tx, Number(body.orderId));
        const current = await tx.order.findFirstOrThrow({
          where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId },
          include: {
            items: {
              include: {
                menuItem: { include: { recipes: true } },
                modifiers: { include: { modifier: { include: { recipes: true } } } },
              },
            },
          },
        });
        if (current.paymentStatus === PaymentStatus.PAID) throw new Error("PAID_ORDER");
        if (current.status === OrderStatus.CANCELLED) throw new Error("CANCELLED_ORDER");
        if (current.stockDeducted) {
          const restore = new Map<number, number>();
          for (const item of current.items) for (const recipe of item.menuItem.recipes) {
            restore.set(recipe.ingredientId, (restore.get(recipe.ingredientId) || 0) + recipe.quantity * item.qty);
          }
          for (const item of current.items) for (const selected of item.modifiers) for (const recipe of selected.modifier?.recipes || []) {
            restore.set(recipe.ingredientId, (restore.get(recipe.ingredientId) || 0) + recipe.quantity * item.qty);
          }
          for (const [ingredientId, quantity] of restore) {
            await tx.ingredient.update({ where: { id: ingredientId }, data: { stock: { increment: quantity } } });
            await tx.stockMovement.create({ data: { restaurantId: auth.user.restaurantId, ingredientId, type: "STOCK_IN", quantity, reference: current.orderNumber, note: "คืนจากการยกเลิกออเดอร์" } });
          }
        }
        const cancelled = await tx.order.update({ where: { id: current.id }, data: { status: OrderStatus.CANCELLED, stockDeducted: false } });
        if (current.tableId) await closeTableSession(tx, current.tableId);
        if (current.tableId) await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
        return cancelled;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
      await writeAudit(auth.user.id,"CANCEL_ORDER","Order",order.id,{orderNumber:order.orderNumber});
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: "ไม่รู้จักคำสั่ง" }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "CANCELLED_ORDER" ? "บิลนี้ยกเลิกแล้ว" : code === "PAYMENT_REQUIRED" ? "กรุณาชำระเงินก่อนส่งมอบอาหาร"
      : code === "NOT_READY" ? "อาหารยังไม่พร้อมรับ"
        : code === "PAID_ORDER" ? "ไม่สามารถยกเลิกบิลที่ชำระแล้ว"
          : code === "ALREADY_PAID" ? "ออเดอร์นี้ชำระเงินแล้ว"
            : code === "INSUFFICIENT_PAYMENT" ? "ยอดรับเงินต้องไม่น้อยกว่ายอดสุทธิ"
              : code === "INVALID_PAYMENT_METHOD" ? "รองรับเฉพาะเงินสดและพร้อมเพย์"
                : "อัปเดตออเดอร์ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
