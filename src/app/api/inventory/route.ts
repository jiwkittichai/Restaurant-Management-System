import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  const ingredients = await prisma.ingredient.findMany({
    where: { active: true },
    include: {
      _count: { select: { recipes: true } },
      movements: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(ingredients);
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.unit?.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อและหน่วยวัตถุดิบ" }, { status: 400 });
    }
    const stock = Math.max(0, Number(body.stock || 0));
    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: {
          name: body.name.trim(), unit: body.unit.trim(), stock,
          minStock: Math.max(0, Number(body.minStock || 0)),
          costPerUnit: Math.max(0, Number(body.costPerUnit || 0)),
        },
      });
      if (stock > 0) await tx.stockMovement.create({
        data: { ingredientId: created.id, type: "STOCK_IN", quantity: stock, note: "ยอดตั้งต้น" },
      });
      return created;
    });
    await writeAudit(auth.user.id,"CREATE_INGREDIENT","Ingredient",ingredient.id,{name:ingredient.name,stock});
    return NextResponse.json(ingredient, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ชื่อวัตถุดิบนี้มีอยู่แล้ว" }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (body.action === "stock-in") {
      const quantity = Number(body.quantity);
      if (!(quantity > 0)) return NextResponse.json({ error: "จำนวนรับเข้าต้องมากกว่า 0" }, { status: 400 });
      const ingredient = await prisma.$transaction(async (tx) => {
        const updated = await tx.ingredient.update({ where: { id }, data: { stock: { increment: quantity } } });
        await tx.stockMovement.create({ data: { ingredientId: id, type: "STOCK_IN", quantity, note: body.note?.trim() || "รับวัตถุดิบเข้า" } });
        return updated;
      });
      await writeAudit(auth.user.id,"STOCK_IN","Ingredient",id,{quantity});
      return NextResponse.json(ingredient);
    }
    if (body.action === "adjust") {
      const stock = Math.max(0, Number(body.stock));
      const ingredient = await prisma.$transaction(async (tx) => {
        const current = await tx.ingredient.findUniqueOrThrow({ where: { id } });
        const updated = await tx.ingredient.update({ where: { id }, data: { stock } });
        await tx.stockMovement.create({ data: { ingredientId: id, type: "ADJUSTMENT", quantity: stock - current.stock, note: body.note?.trim() || "ปรับยอดคงเหลือ" } });
        return updated;
      });
      await writeAudit(auth.user.id,"ADJUST_STOCK","Ingredient",id,{stock});
      return NextResponse.json(ingredient);
    }
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { minStock: Math.max(0, Number(body.minStock)), costPerUnit: Math.max(0, Number(body.costPerUnit)) },
    });
    await writeAudit(auth.user.id,"UPDATE_INGREDIENT","Ingredient",id);
    return NextResponse.json(ingredient);
  } catch {
    return NextResponse.json({ error: "อัปเดตสต็อกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    await prisma.ingredient.delete({ where: { id: Number(id) } });
    await writeAudit(auth.user.id,"DELETE_INGREDIENT","Ingredient",id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "วัตถุดิบนี้ถูกใช้ในสูตรอาหาร" }, { status: 409 });
  }
}
