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
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.CASHIER]);if("response" in auth)return auth.response;
  try {
    const { tableId, type, customerName, customerPhone, items, note, discount = 0 } = await req.json() as {
      tableId?: number; type?: OrderType; customerName?: string; customerPhone?: string;
      items: CartItem[]; note?: string; discount?: number;
    };
    if (!items?.length) return NextResponse.json({ error: "ยังไม่มีรายการอาหาร" }, { status: 400 });

    const ids = [...new Set(items.map((item) => Number(item.menuItemId)))];
    if (tableId) {
      const table = await prisma.restaurantTable.findFirst({ where: { id: Number(tableId), restaurantId: auth.user.restaurantId } });
      if (!table) return NextResponse.json({ error: "ไม่พบโต๊ะ" }, { status: 404 });
    }
    const menu = await prisma.menuItem.findMany({
      where: { restaurantId: auth.user.restaurantId, id: { in: ids }, available: true },
      include: {
        recipes: { include: { ingredient: true } },
        modifierGroups: {
          include: {
            options: {
              where: { active: true },
              include: { recipes: { include: { ingredient: true } } },
            },
          },
        },
        modifiers: {
          where: { active: true },
          include: { recipes: { include: { ingredient: true } } },
        },
      },
    });
    if (menu.length !== ids.length) return NextResponse.json({ error: "มีเมนูที่ไม่พร้อมขาย" }, { status: 400 });

    const menuMap = new Map(menu.map((item) => [item.id, item]));
    const normalized = items.map((item) => {
      const source = menuMap.get(Number(item.menuItemId))!;
      const requestedModifierIds = [...new Set((item.modifierIds || []).map(Number).filter(Boolean))];
      const modifierById = new Map(source.modifiers.map((modifier) => [modifier.id, modifier]));
      for (const group of source.modifierGroups) {
        const selectedInGroup = group.options.filter((option) => requestedModifierIds.includes(option.id));
        if (selectedInGroup.length < group.minSelect) throw new Error(`REQUIRED_MODIFIER:${group.name}`);
        if (selectedInGroup.length > group.maxSelect) throw new Error(`TOO_MANY_MODIFIERS:${group.name}`);
      }
      const modifiers = requestedModifierIds.map((modifierId) => {
        const modifier = modifierById.get(modifierId);
        if (!modifier) throw new Error("INVALID_MODIFIER");
        return modifier;
      });
      const modifierTotal = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);
      return {
        source,
        modifiers,
        qty: Math.max(1, Number(item.qty)),
        note: item.note?.trim() || null,
        unitPrice: source.price + modifierTotal,
      };
    });
    const subtotal = normalized.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const safeDiscount = Math.min(Math.max(0, Number(discount)), subtotal);
    const orderType = tableId ? OrderType.DINE_IN : (type || OrderType.TAKEAWAY);
    const queueNumber = orderType === OrderType.TAKEAWAY ? `Q${Date.now().toString().slice(-6)}` : null;
    const required = new Map<number, { name: string; quantity: number }>();
    for (const item of normalized) for (const recipe of item.source.recipes) {
      const current = required.get(recipe.ingredientId) || { name: recipe.ingredient.name, quantity: 0 };
      current.quantity += recipe.quantity * item.qty;
      required.set(recipe.ingredientId, current);
    }
    for (const item of normalized) for (const modifier of item.modifiers) for (const recipe of modifier.recipes) {
      const current = required.get(recipe.ingredientId) || { name: recipe.ingredient.name, quantity: 0 };
      current.quantity += recipe.quantity * item.qty;
      required.set(recipe.ingredientId, current);
    }

    const result = await prisma.$transaction(async (tx) => {
      const active = tableId
        ? await tx.order.findFirst({
          where: {
            tableId: Number(tableId),
            restaurantId: auth.user.restaurantId,
            paymentStatus: PaymentStatus.UNPAID,
            status: { not: OrderStatus.CANCELLED },
          },
        })
        : null;
      const itemData = normalized.map(({ source, modifiers, qty, note: itemNote, unitPrice }) => ({
        menuItemId: source.id,
        name: source.name,
        price: unitPrice,
        qty,
        note: itemNote,
        modifiers: {
          create: modifiers.map((modifier) => ({
            modifierId: modifier.id,
            name: modifier.name,
            price: modifier.price,
          })),
        },
      }));
      const saved = active
        ? await tx.order.update({
          where: { id: active.id },
          data: {
            subtotal: { increment: subtotal },
            total: { increment: subtotal },
            status: OrderStatus.SENT,
            stockDeducted: active.stockDeducted || required.size > 0,
            note: note?.trim() ? [active.note, note.trim()].filter(Boolean).join("\n") : active.note,
            items: { create: itemData },
          },
          include: { table: true, items: true },
        })
        : await tx.order.create({
          data: {
            restaurantId: auth.user.restaurantId,
            orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
            tableId: orderType === OrderType.DINE_IN && tableId ? Number(tableId) : null,
            type: orderType,
            queueNumber,
            customerName: customerName?.trim() || null,
            customerPhone: customerPhone?.trim() || null,
            subtotal,
            discount: safeDiscount,
            total: subtotal - safeDiscount,
            note: note?.trim() || null,
            stockDeducted: required.size > 0,
            items: { create: itemData },
          },
          include: { table: true, items: true },
        });
      for (const [ingredientId, requirement] of required) {
        const result = await tx.ingredient.updateMany({
          where: { id: ingredientId, restaurantId: auth.user.restaurantId, stock: { gte: requirement.quantity } },
          data: { stock: { decrement: requirement.quantity } },
        });
        if (!result.count) throw new Error(`OUT_OF_STOCK:${requirement.name}`);
        await tx.stockMovement.create({
          data: { restaurantId: auth.user.restaurantId, ingredientId, type: "STOCK_OUT", quantity: requirement.quantity, reference: saved.orderNumber, note: active ? "ตัดจากรายการที่สั่งเพิ่ม" : "ตัดจากออเดอร์" },
        });
      }
      if (orderType === OrderType.DINE_IN && tableId) await tx.restaurantTable.update({ where: { id: Number(tableId) }, data: { status: "OCCUPIED" } });
      return { order: saved, isAdditional: Boolean(active) };
    });
    await writeAudit(auth.user.id,result.isAdditional?"ADD_ORDER_ITEMS":"CREATE_ORDER","Order",result.order.id,{
      orderNumber:result.order.orderNumber,
      type:result.order.type,
      total:result.order.total,
      itemCount:normalized.reduce((sum,item)=>sum+item.qty,0),
      items:normalized.map(item=>({name:item.source.name,qty:item.qty,price:item.source.price})),
      modifiers:normalized.flatMap(item=>item.modifiers.map(modifier=>({itemName:item.source.name,name:modifier.name,price:modifier.price}))),
      tableName:result.order.table?.name,
      queueNumber:result.order.queueNumber,
    });
    return NextResponse.json({ ...result.order, isAdditional: result.isAdditional }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("OUT_OF_STOCK:")
        ? `วัตถุดิบไม่เพียงพอ: ${error.message.split(":")[1]}`
        : error instanceof Error && error.message.startsWith("REQUIRED_MODIFIER:")
          ? `กรุณาเลือก ${error.message.split(":")[1]}`
          : error instanceof Error && error.message.startsWith("TOO_MANY_MODIFIERS:")
            ? `เลือก ${error.message.split(":")[1]} เกินจำนวนที่กำหนด`
            : error instanceof Error && error.message === "INVALID_MODIFIER"
              ? "ตัวเลือกเสริมไม่ถูกต้อง"
        : "เปิดออเดอร์ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 409 });
  }
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
        const current = await tx.order.findFirstOrThrow({ where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId }, include: { payment: true } });
        if (current.payment) throw new Error("ALREADY_PAID");
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
        if (current.tableId) await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
        return { ...paid, payment };
      });
      await writeAudit(auth.user.id,"PAY_ORDER","Order",order.id,{orderNumber:order.orderNumber,method:order.payment.method,total:order.total,receivedAmount:order.payment.receivedAmount,changeAmount:order.payment.changeAmount});
      return NextResponse.json(order);
    }
    if (body.action === "pickup") {
      const current = await prisma.order.findFirstOrThrow({ where: { id: Number(body.orderId), restaurantId: auth.user.restaurantId } });
      if (current.type !== OrderType.TAKEAWAY) throw new Error("NOT_TAKEAWAY");
      if (current.paymentStatus !== PaymentStatus.PAID) throw new Error("PAYMENT_REQUIRED");
      if (current.status !== OrderStatus.READY) throw new Error("NOT_READY");
      const order = await prisma.order.update({
        where: { id: current.id }, data: { status: OrderStatus.SERVED, pickedUpAt: new Date() },
      });
      await writeAudit(auth.user.id,"PICKUP_ORDER","Order",order.id,{orderNumber:order.orderNumber});
      return NextResponse.json(order);
    }
    if (body.action === "cancel") {
      const order = await prisma.$transaction(async (tx) => {
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
        if (current.tableId) await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
        return cancelled;
      });
      await writeAudit(auth.user.id,"CANCEL_ORDER","Order",order.id,{orderNumber:order.orderNumber});
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: "ไม่รู้จักคำสั่ง" }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "PAYMENT_REQUIRED" ? "กรุณาชำระเงินก่อนส่งมอบอาหาร"
      : code === "NOT_READY" ? "อาหารยังไม่พร้อมรับ"
        : code === "PAID_ORDER" ? "ไม่สามารถยกเลิกบิลที่ชำระแล้ว"
          : code === "ALREADY_PAID" ? "ออเดอร์นี้ชำระเงินแล้ว"
            : code === "INSUFFICIENT_PAYMENT" ? "ยอดรับเงินต้องไม่น้อยกว่ายอดสุทธิ"
              : code === "INVALID_PAYMENT_METHOD" ? "รองรับเฉพาะเงินสดและพร้อมเพย์"
                : "อัปเดตออเดอร์ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
