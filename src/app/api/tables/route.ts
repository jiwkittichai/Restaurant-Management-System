import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.CASHIER]);if("response" in auth)return auth.response;
  const tables = await prisma.restaurantTable.findMany({
    orderBy: { id: "asc" },
    include: {
      orders: {
        where: { paymentStatus: "UNPAID", status: { not: "CANCELLED" } },
        select: {
          id: true, orderNumber: true, subtotal: true, discount: true, total: true,
          status: true, paymentStatus: true,
          items: { select: { id: true, name: true, qty: true, price: true, status: true } },
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json(tables);
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { name, seats = 2 } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "กรุณาระบุชื่อโต๊ะ" }, { status: 400 });
    const table = await prisma.restaurantTable.create({
      data: { name: name.trim(), seats: Math.max(1, Number(seats)) },
    });
    await writeAudit(auth.user.id,"CREATE_TABLE","RestaurantTable",table.id,{name:table.name,seats:table.seats});
    return NextResponse.json(table, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ชื่อโต๊ะนี้มีอยู่แล้ว" }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.CASHIER]);if("response" in auth)return auth.response;
  try {
    const { id, status } = await req.json();
    const table = await prisma.restaurantTable.update({
      where: { id: Number(id) },
      data: { status },
    });
    await writeAudit(auth.user.id,"UPDATE_TABLE_STATUS","RestaurantTable",table.id,{status:table.status});
    return NextResponse.json(table);
  } catch {
    return NextResponse.json({ error: "อัปเดตโต๊ะไม่สำเร็จ" }, { status: 500 });
  }
}
