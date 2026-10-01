import { moneyJson } from "@/lib/money";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  const ingredients = await prisma.ingredient.findMany({
    where: { restaurantId: auth.user.restaurantId, active: true },
    include: {
      _count: { select: { recipes: true, modifierRecipes: true } },
      movements: { where: { restaurantId: auth.user.restaurantId }, orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  });
  return moneyJson(ingredients);
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.unit?.trim()) {
      return moneyJson({ error: "กรุณาระบุชื่อและหน่วยวัตถุดิบ" }, { status: 400 });
    }
    const stock = Math.max(0, Number(body.stock || 0));
    const ingredient = await prisma.$transaction(async (tx) => {
      const created = await tx.ingredient.create({
        data: {
          name: body.name.trim(), unit: body.unit.trim(), stock,
          restaurantId: auth.user.restaurantId,
          minStock: Math.max(0, Number(body.minStock || 0)),
        },
      });
      if (stock > 0) await tx.stockMovement.create({
        data: { restaurantId: auth.user.restaurantId, ingredientId: created.id, type: "STOCK_IN", quantity: stock, note: "ยอดตั้งต้น" },
      });
      return created;
    });
    await writeAudit(auth.user.id,"CREATE_INGREDIENT","Ingredient",ingredient.id,{name:ingredient.name,stock});
    return moneyJson(ingredient, { status: 201 });
  } catch {
    return moneyJson({ error: "ชื่อวัตถุดิบนี้มีอยู่แล้ว" }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (body.action === "stock-in") {
      const quantity = Number(body.quantity);
      if (!(quantity > 0)) return moneyJson({ error: "จำนวนรับเข้าต้องมากกว่า 0" }, { status: 400 });
      const ingredient = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM Ingredient WHERE id = ${id} AND restaurantId = ${auth.user.restaurantId} FOR UPDATE`;
        const current = await tx.ingredient.findFirstOrThrow({ where: { id, restaurantId: auth.user.restaurantId } });
        const updated = await tx.ingredient.update({ where: { id }, data: { stock: { increment: quantity } } });
        await tx.stockMovement.create({ data: { restaurantId: auth.user.restaurantId, ingredientId: id, type: "STOCK_IN", quantity, note: body.note?.trim() || "รับวัตถุดิบเข้า" } });
        return { current, updated };
      });
      await writeAudit(auth.user.id,"STOCK_IN","Ingredient",id,{
        name:ingredient.updated.name,
        quantity,
        unit:ingredient.updated.unit,
        note:body.note?.trim() || "รับวัตถุดิบเข้า",
        before:{stock:ingredient.current.stock},
        after:{stock:ingredient.updated.stock},
      });
      return moneyJson(ingredient.updated);
    }
    if (body.action === "adjust") {
      const stock = Math.max(0, Number(body.stock));
      const ingredient = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM Ingredient WHERE id = ${id} AND restaurantId = ${auth.user.restaurantId} FOR UPDATE`;
        const current = await tx.ingredient.findFirstOrThrow({ where: { id, restaurantId: auth.user.restaurantId } });
        const updated = await tx.ingredient.update({ where: { id }, data: { stock } });
        await tx.stockMovement.create({ data: { restaurantId: auth.user.restaurantId, ingredientId: id, type: "ADJUSTMENT", quantity: stock - current.stock, note: body.note?.trim() || "ปรับยอดคงเหลือ" } });
        return { current, updated };
      });
      await writeAudit(auth.user.id,"ADJUST_STOCK","Ingredient",id,{
        name:ingredient.updated.name,
        stock,
        unit:ingredient.updated.unit,
        note:body.note?.trim() || "ปรับยอดคงเหลือ",
        before:{stock:ingredient.current.stock},
        after:{stock:ingredient.updated.stock},
      });
      return moneyJson(ingredient.updated);
    }
    const { current, ingredient } = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM Ingredient WHERE id = ${id} AND restaurantId = ${auth.user.restaurantId} FOR UPDATE`;
      const current = await tx.ingredient.findFirstOrThrow({ where: { id, restaurantId: auth.user.restaurantId } });
      const nextStock = body.stock === undefined ? current.stock : Math.max(0, Number(body.stock));
      const updated = await tx.ingredient.update({
        where: { id },
        data: {
          name: body.name?.trim() || current.name,
          unit: body.unit?.trim() || current.unit,
          stock: nextStock,
          minStock: Math.max(0, Number(body.minStock ?? current.minStock)),
        },
      });
      if (nextStock !== current.stock) {
        await tx.stockMovement.create({
          data: { restaurantId: auth.user.restaurantId, ingredientId: id, type: "ADJUSTMENT", quantity: nextStock - current.stock, note: body.note?.trim() || "แก้ไขข้อมูลวัตถุดิบ" },
        });
      }
      return { current, ingredient: updated };
    });
    await writeAudit(auth.user.id,"UPDATE_INGREDIENT","Ingredient",id,{
      name:ingredient.name,
      before:{name:current.name,unit:current.unit,stock:current.stock,minStock:current.minStock},
      after:{name:ingredient.name,unit:ingredient.unit,stock:ingredient.stock,minStock:ingredient.minStock},
    });
    return moneyJson(ingredient);
  } catch {
    return moneyJson({ error: "อัปเดตสต็อกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    const current = await prisma.ingredient.findFirst({ where: { id: Number(id), restaurantId: auth.user.restaurantId } });
    if (!current) return moneyJson({ error: "ไม่พบวัตถุดิบ" }, { status: 404 });
    const ingredient = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Ingredient WHERE id = ${current.id} FOR UPDATE`;
      if (await tx.stockMovement.count({ where: { ingredientId: current.id, type: "STOCK_OUT" } })) throw new Error("STOCK_HISTORY_EXISTS");
      return tx.ingredient.delete({ where: { id: current.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    await writeAudit(auth.user.id,"DELETE_INGREDIENT","Ingredient",id,{name:ingredient.name,stock:ingredient.stock,unit:ingredient.unit});
    return moneyJson({ success: true });
  } catch (error) {
    return moneyJson({ error: error instanceof Error && error.message === "STOCK_HISTORY_EXISTS" ? "วัตถุดิบมีประวัติตัดสต็อก จึงลบไม่ได้" : "วัตถุดิบนี้ถูกใช้ในสูตรอาหาร" }, { status: 409 });
  }
}
