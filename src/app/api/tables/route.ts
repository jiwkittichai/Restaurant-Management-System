import { moneyJson } from "@/lib/money";
import { lockTable } from "@/lib/table-session";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.CASHIER]);if("response" in auth)return auth.response;
  const tables = await prisma.restaurantTable.findMany({
    where: { restaurantId: auth.user.restaurantId, active: true },
    orderBy: { id: "asc" },
    include: {
      sessions: { where: { closedAt: null }, select: { id: true, paused: true, billRequestedAt: true, createdAt: true } },
      orders: {
        where: { paymentStatus: "UNPAID", status: { not: "CANCELLED" } },
        select: {
          id: true, orderNumber: true, subtotal: true, discount: true, total: true,
          status: true, paymentStatus: true, createdAt: true,
          items: {
            select: {
              id: true,
              source: true,
              name: true,
              qty: true,
              price: true,
              note: true,
              status: true,
              modifiers: { select: { id: true, name: true, price: true } },
            },
          },
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return moneyJson(tables);
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { name, seats = 2 } = await req.json();
    if (!name?.trim()) return moneyJson({ error: "กรุณาระบุชื่อโต๊ะ" }, { status: 400 });
    const seatCount = Number(seats);
    if (!Number.isSafeInteger(seatCount) || seatCount < 1 || seatCount > 100) {
      return moneyJson({ error: "จำนวนที่นั่งต้องเป็นเลข 1–100" }, { status: 400 });
    }
    const normalizedName = name.trim();
    const existing = await prisma.restaurantTable.findFirst({
      where: { restaurantId: auth.user.restaurantId, name: normalizedName },
    });
    if (existing?.active) return moneyJson({ error: "ชื่อโต๊ะนี้มีอยู่แล้ว" }, { status: 409 });
    const table = existing
      ? await prisma.restaurantTable.update({ where: { id: existing.id }, data: { active: true, seats: seatCount, status: "AVAILABLE" } })
      : await prisma.restaurantTable.create({
          data: { restaurantId: auth.user.restaurantId, name: normalizedName, seats: seatCount },
        });
    await writeAudit(auth.user.id,"CREATE_TABLE","RestaurantTable",table.id,{name:table.name,seats:table.seats,restored:Boolean(existing)});
    return moneyJson(table, { status: 201 });
  } catch {
    return moneyJson({ error: "ชื่อโต๊ะนี้มีอยู่แล้ว" }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.CASHIER]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    const { id, status } = body;
    const current = await prisma.restaurantTable.findFirst({ where: { id: Number(id), restaurantId: auth.user.restaurantId, active: true } });
    if (!current) return moneyJson({ error: "ไม่พบโต๊ะ" }, { status: 404 });

    if (body.action === "details") {
      if (!auth.user.roles.includes(StaffRole.OWNER)) {
        return moneyJson({ error: "คุณไม่มีสิทธิ์ดำเนินการนี้" }, { status: 403 });
      }
      const name = body.name?.trim();
      const seats = Number(body.seats);
      if (!name) return moneyJson({ error: "กรุณาระบุชื่อโต๊ะ" }, { status: 400 });
      if (!Number.isSafeInteger(seats) || seats < 1 || seats > 100) {
        return moneyJson({ error: "จำนวนที่นั่งต้องเป็นเลข 1–100" }, { status: 400 });
      }
      const table = await prisma.restaurantTable.update({
        where: { id: current.id },
        data: { name, seats },
      });
      await writeAudit(auth.user.id,"UPDATE_TABLE","RestaurantTable",table.id,{
        name:table.name,
        before:{name:current.name,seats:current.seats},
        after:{name:table.name,seats:table.seats},
      });
      return moneyJson(table);
    }

    const table = await prisma.$transaction(async tx => {
      await lockTable(tx, current.id);
      if (status !== "OCCUPIED" && (await tx.tableSession.count({ where: { tableId: current.id, closedAt: null } }) || await tx.order.count({ where: { tableId: current.id, paymentStatus: "UNPAID", status: { not: "CANCELLED" } } }))) throw new Error("ACTIVE_TABLE");
      return tx.restaurantTable.update({ where: { id: current.id }, data: { status } });
    });
    await writeAudit(auth.user.id,"UPDATE_TABLE_STATUS","RestaurantTable",table.id,{
      name:table.name,
      before:{status:current.status},
      after:{status:table.status},
    });
    return moneyJson(table);
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_TABLE") {
      return moneyJson({ error: "โต๊ะกำลังใช้งาน ไม่สามารถเปลี่ยนสถานะได้" }, { status: 409 });
    }
    return moneyJson({ error: "ชื่อโต๊ะนี้มีอยู่แล้ว หรืออัปเดตโต๊ะไม่สำเร็จ" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    const current = await prisma.restaurantTable.findFirst({
      where: { id: Number(id), restaurantId: auth.user.restaurantId, active: true },
    });
    if (!current) return moneyJson({ error: "ไม่พบโต๊ะ" }, { status: 404 });

    const table = await prisma.$transaction(async tx => {
      await lockTable(tx, current.id);
      const [activeSessions, unpaidOrders] = await Promise.all([
        tx.tableSession.count({ where: { tableId: current.id, closedAt: null } }),
        tx.order.count({ where: { tableId: current.id, paymentStatus: "UNPAID", status: { not: "CANCELLED" } } }),
      ]);
      if (activeSessions || unpaidOrders) throw new Error("ACTIVE_TABLE");
      return tx.restaurantTable.update({
        where: { id: current.id },
        data: { active: false, status: "AVAILABLE" },
      });
    });
    await writeAudit(auth.user.id,"DELETE_TABLE","RestaurantTable",table.id,{name:table.name,seats:table.seats});
    return moneyJson({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_TABLE") {
      return moneyJson({ error: "โต๊ะกำลังมีออเดอร์หรือ QR ที่เปิดใช้งานอยู่ จึงลบไม่ได้" }, { status: 409 });
    }
    return moneyJson({ error: "ลบโต๊ะไม่สำเร็จ" }, { status: 500 });
  }
}
