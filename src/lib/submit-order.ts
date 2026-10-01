import { moneyJson } from "@/lib/money";
import { OrderStatus, OrderType, PaymentStatus, Prisma } from "@prisma/client";
import { money } from "@/lib/money";
import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/auth";
import { lockTable } from "@/lib/table-session";
import { lockRestaurantAccess } from "@/lib/restaurant-access";
type CartItem = { menuItemId: number; qty: number; note?: string; modifierIds?: number[] };

export async function submitOrder(req: NextRequest, restaurantId: number, employeeId?: number, qr?: { token: string; guestId: string; requestId: string }) {
  try {
    const { tableId, type, customerName, customerPhone, items, note, discount = 0 } = await req.json() as {
      tableId?: number; type?: OrderType; customerName?: string; customerPhone?: string;
      items: CartItem[]; note?: string; discount?: number;
    };
    if (!Array.isArray(items) || items.length > 50 || items.some(i => !Number.isInteger(i.menuItemId) || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 50 || (i.note && (typeof i.note !== "string" || i.note.length > 500)) || (i.modifierIds && (!Array.isArray(i.modifierIds) || i.modifierIds.length > 50 || i.modifierIds.some(id => !Number.isInteger(id))))) || items.reduce((n, i) => n + i.qty, 0) > 100) return moneyJson({ error: "จำนวนอาหารหรือตัวเลือกไม่ถูกต้อง (ไม่เกิน 100 จานต่อครั้ง)" }, { status: 400 });
    if (!items?.length) return moneyJson({ error: "ยังไม่มีรายการอาหาร" }, { status: 400 });

    const ids = [...new Set(items.map((item) => Number(item.menuItemId)))];
    if (tableId) {
      const table = await prisma.restaurantTable.findFirst({ where: { id: Number(tableId), restaurantId: restaurantId } });
      if (!table) return moneyJson({ error: "ไม่พบโต๊ะ" }, { status: 404 });
    }
    const menu = await prisma.menuItem.findMany({
      where: { restaurantId, id: { in: ids }, available: true, category: { active: true } },
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
    if (menu.length !== ids.length) return moneyJson({ error: "มีเมนูที่ไม่พร้อมขาย" }, { status: 400 });

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
      const modifierTotal = modifiers.reduce((sum, modifier) => sum.plus(modifier.price), new Prisma.Decimal(0));
      return {
        source,
        modifiers,
        qty: Math.max(1, Number(item.qty)),
        note: item.note?.trim() || null,
        unitPrice: source.price.plus(modifierTotal),
      };
    });
    const subtotal = money(normalized.reduce((sum, item) => sum.plus(item.unitPrice.times(item.qty)), new Prisma.Decimal(0)));
    const safeDiscount = Prisma.Decimal.min(money(discount), subtotal);
    const orderType = tableId ? OrderType.DINE_IN : (type || OrderType.TAKEAWAY);
    const queueNumber = orderType === OrderType.TAKEAWAY ? `Q${Date.now()}-${randomBytes(4).toString("hex")}` : null;
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
      await lockRestaurantAccess(tx, restaurantId);
      if (tableId) await lockTable(tx, Number(tableId));
      const session = qr ? await tx.tableSession.findUnique({ where: { token: qr.token } }) : null;
      if (qr) {
        if (!session || session.closedAt || session.tableId !== Number(tableId)) throw new Error("QR_CLOSED");
        const duplicate = await tx.qrSubmission.findUnique({ where: { sessionId_requestId: { sessionId: session.id, requestId: qr.requestId } } });
        if (duplicate) return { order: (await tx.order.findUniqueOrThrow({ where: { id: session.orderId! }, include: { table: true, items: true } })), isAdditional: true };
        if (session.paused || session.billRequestedAt) throw new Error("QR_PAUSED");
        const recent = await tx.qrSubmission.count({ where: { sessionId: session.id, createdAt: { gt: new Date(Date.now() - 10000) } } });
        const ownRecent = await tx.qrSubmission.count({ where: { sessionId: session.id, guestId: qr.guestId, createdAt: { gt: new Date(Date.now() - 3000) } } });
        if (recent >= 20 || ownRecent > 0) throw new Error("QR_RATE");
      }
      const active = tableId
        ? await tx.order.findFirst({
          where: {
            tableId: Number(tableId),
            restaurantId: restaurantId,
            paymentStatus: PaymentStatus.UNPAID,
            status: { not: OrderStatus.CANCELLED },
          },
        })
        : null;
      const itemData = normalized.map(({ source, modifiers, qty, note: itemNote, unitPrice }) => ({
        source: qr ? "QR" : "STAFF",
        guestId: qr?.guestId,
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
            subtotal: money(active.subtotal.plus(subtotal)),
            total: money(active.total.plus(subtotal)),
            status: OrderStatus.SENT,
            stockDeducted: active.stockDeducted || required.size > 0,
            note: note?.trim() ? [active.note, note.trim()].filter(Boolean).join("\n") : active.note,
            items: { create: itemData },
          },
          include: { table: true, items: true },
        })
        : await tx.order.create({
          data: {
            restaurantId: restaurantId,
            orderNumber: `ORD-${Date.now()}-${randomBytes(3).toString("hex")}`,
            tableId: orderType === OrderType.DINE_IN && tableId ? Number(tableId) : null,
            type: orderType,
            queueNumber,
            customerName: customerName?.trim() || null,
            customerPhone: customerPhone?.trim() || null,
            subtotal,
            discount: safeDiscount,
            total: subtotal.minus(safeDiscount),
            note: note?.trim() || null,
            stockDeducted: required.size > 0,
            items: { create: itemData },
          },
          include: { table: true, items: true },
        });
      for (const [ingredientId, requirement] of [...required].sort(([a], [b]) => a - b)) {
        const result = await tx.ingredient.updateMany({
          where: { id: ingredientId, restaurantId: restaurantId, stock: { gte: requirement.quantity } },
          data: { stock: { decrement: requirement.quantity } },
        });
        if (!result.count) throw new Error(`OUT_OF_STOCK:${requirement.name}`);
        await tx.stockMovement.create({
          data: { restaurantId: restaurantId, ingredientId, type: "STOCK_OUT", quantity: requirement.quantity, reference: saved.orderNumber, note: active ? "ตัดจากรายการที่สั่งเพิ่ม" : "ตัดจากออเดอร์" },
        });
      }
      if (orderType === OrderType.DINE_IN && tableId) await tx.restaurantTable.update({ where: { id: Number(tableId) }, data: { status: "OCCUPIED" } });
      if (tableId) await tx.tableSession.updateMany({ where: { tableId: Number(tableId), closedAt: null }, data: { orderId: saved.id } });
      if (qr && session) await tx.qrSubmission.create({ data: { sessionId: session.id, requestId: qr.requestId, guestId: qr.guestId } });
      await writeAudit(employeeId ?? null, active ? "ADD_ORDER_ITEMS" : "CREATE_ORDER", "Order", saved.id, {
        snapshotVersion: 1,
        orderNumber: saved.orderNumber, type: saved.type,
        subtotal: saved.subtotal, discount: saved.discount, total: saved.total,
        itemCount: normalized.reduce((sum, item) => sum + item.qty, 0),
        items: normalized.map(item => ({
          name: item.source.name, qty: item.qty, price: item.unitPrice, note: item.note ?? null,
          modifiers: item.modifiers.map(m => ({ name: m.name, price: m.price })),
        })),
        tableName: saved.table?.name ?? null, queueNumber: saved.queueNumber,
      }, { tx, restaurantId });
      return { order: saved, isAdditional: Boolean(active) };
    });
    return moneyJson({ ...result.order, isAdditional: result.isAdditional }, { status: 201 });
  } catch (error) {
    const qrErrors: Record<string, string> = { QR_CLOSED: "รอบโต๊ะนี้สิ้นสุดแล้ว กรุณาติดต่อพนักงาน", QR_PAUSED: "โต๊ะนี้พักรับออเดอร์ กรุณาติดต่อพนักงาน", QR_RATE: "กรุณารอสักครู่ก่อนส่งรายการถัดไป" };
    if (error instanceof Error && qrErrors[error.message]) return moneyJson({ error: qrErrors[error.message] }, { status: error.message === "QR_CLOSED" ? 410 : 429 });
    const message = error instanceof Error && error.message.startsWith("OUT_OF_STOCK:")
        ? `วัตถุดิบไม่เพียงพอ: ${error.message.split(":")[1]}`
        : error instanceof Error && error.message.startsWith("REQUIRED_MODIFIER:")
          ? `กรุณาเลือก ${error.message.split(":")[1]}`
          : error instanceof Error && error.message.startsWith("TOO_MANY_MODIFIERS:")
            ? `เลือก ${error.message.split(":")[1]} เกินจำนวนที่กำหนด`
            : error instanceof Error && error.message === "INVALID_MODIFIER"
              ? "ตัวเลือกเสริมไม่ถูกต้อง"
        : "เปิดออเดอร์ไม่สำเร็จ";
    return moneyJson({ error: message }, { status: 409 });
  }
}
