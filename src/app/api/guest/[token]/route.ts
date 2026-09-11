import { brandSelect, publicBrand } from "@/lib/restaurant-brand";
import { menuImageObjectKey } from "@/lib/menu-image";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitOrder } from "@/lib/submit-order";
import { lockTable } from "@/lib/table-session";

type Context = { params: Promise<{ token: string }> };
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
async function findSession(token: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return prisma.tableSession.findUnique({ where: { token }, include: { table: { include: { restaurant: { select: brandSelect } } } } });
}
const closed = () => NextResponse.json({ error: "QR นี้สิ้นสุดการใช้งานแล้ว กรุณาติดต่อพนักงาน" }, { status: 410, headers });
export async function GET(req: NextRequest, context: Context) {
  const { token } = await context.params;
  const session = await findSession(token);
  if (!session || session.closedAt) return closed();
  const guestId = req.nextUrl.searchParams.get("guestId");
  const menu = await prisma.menuItem.findMany({
    where: { restaurantId: session.table.restaurantId, category: { active: true } },
    select: { id: true, name: true, description: true, price: true, image: true, available: true, category: { select: { id: true, name: true } },
      recipes: { select: { quantity: true, ingredient: { select: { stock: true } } } },
      modifierGroups: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, minSelect: true, maxSelect: true, options: { where: { active: true }, select: { id: true, name: true, price: true } } } },
      modifiers: { where: { active: true, groupId: null }, select: { id: true, name: true, price: true } },
    }, orderBy: { id: "asc" },
  });
  const order = session.orderId ? await prisma.order.findUnique({ where: { id: session.orderId }, select: { total: true, subtotal: true, discount: true, items: { orderBy: { id: "desc" }, select: { id: true, name: true, qty: true, price: true, note: true, status: true, guestId: true, createdAt: true, modifiers: { select: { name: true } } } } } }) : null;
  return NextResponse.json({ brand: publicBrand(session.table.restaurant), restaurantName: session.table.restaurant.name, tableName: session.table.name, paused: session.paused, billRequestedAt: session.billRequestedAt,
    menu: menu.map(({ recipes, modifiers, ...item }) => ({ ...item, image: menuImageObjectKey(item.image) ? `/api/guest/${token}/images/${item.id}` : item.image, available: item.available && recipes.every(r => r.quantity <= r.ingredient.stock), modifierGroups: [...item.modifierGroups, ...(modifiers.length ? [{ id: 0, name: "ตัวเลือกเพิ่มเติม", minSelect: 0, maxSelect: modifiers.length, options: modifiers }] : [])] })),
    order: order ? { ...order, items: order.items.map(({ guestId: owner, ...item }) => ({ ...item, mine: Boolean(guestId && owner === guestId) })) } : null,
  }, { headers });
}
export async function POST(req: NextRequest, context: Context) {
  try {
    const { token } = await context.params;
    const session = await findSession(token);
    if (!session || session.closedAt) return closed();
    const body = await req.json();
    if (body.action === "bill") {
      await prisma.$transaction(async tx => {
        await lockTable(tx, session.tableId);
        const current = await tx.tableSession.findUnique({ where: { token } });
        if (!current || current.closedAt) throw new Error("CLOSED");
        if (!current.orderId) throw new Error("ยังไม่มีรายการอาหาร");
        await tx.tableSession.update({ where: { id: current.id }, data: { billRequestedAt: current.billRequestedAt || new Date() } });
      });
      return NextResponse.json({ ok: true }, { headers });
    }
    if (typeof body.guestId !== "string" || !/^[a-zA-Z0-9-]{16,64}$/.test(body.guestId) || typeof body.requestId !== "string" || !/^[a-zA-Z0-9-]{16,64}$/.test(body.requestId)) return NextResponse.json({ error: "ข้อมูลการส่งไม่ถูกต้อง" }, { status: 400 });
    const safeRequest = new NextRequest(req.url, { method: "POST", body: JSON.stringify({ tableId: session.tableId, items: body.items }) });
    const result = await submitOrder(safeRequest, session.table.restaurantId, undefined, { token, guestId: body.guestId, requestId: body.requestId });
    if (!result.ok) return result;
    return NextResponse.json({ ok: true }, { status: 201, headers });
  } catch (error) {
    if (error instanceof Error && error.message === "CLOSED") return closed();
    return NextResponse.json({ error: "ทำรายการไม่สำเร็จ กรุณาลองใหม่" }, { status: 400, headers });
  }
}
