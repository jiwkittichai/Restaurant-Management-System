import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi();if("response" in auth)return auth.response;
  const items = await prisma.menuItem.findMany({
    include: {
      category: true,
      recipes: { include: { ingredient: { select: { stock: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items.map(({ recipes, ...item }) => {
    const validRecipes = recipes.filter((recipe) => recipe.quantity > 0);
    const stockTracked = validRecipes.length > 0;
    const maxServings = stockTracked
      ? Math.max(0, Math.min(...validRecipes.map((recipe) => Math.floor(recipe.ingredient.stock / recipe.quantity))))
      : null;
    return {
      ...item,
      saleUnit: item.saleUnit || "จาน",
      stockTracked,
      maxServings,
      sellable: item.available && (maxServings === null || maxServings > 0),
    };
  }));
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    if (!body.name?.trim() || !body.categoryId || Number(body.price) < 0) {
      return NextResponse.json({ error: "ข้อมูลเมนูไม่ครบ" }, { status: 400 });
    }
    const item = await prisma.menuItem.create({
      data: {
        name: body.name.trim(),
        sku: body.sku || `MENU-${Date.now().toString().slice(-6)}`,
        description: body.description?.trim() || null,
        price: Number(body.price),
        saleUnit: body.saleUnit?.trim() || "จาน",
        image: body.image || null,
        categoryId: Number(body.categoryId),
      },
      include: { category: true },
    });
    await writeAudit(auth.user.id,"CREATE_MENU","MenuItem",item.id,{name:item.name});
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "สร้างเมนูไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ไม่พบรหัสเมนู" }, { status: 400 });

    if (body.name === undefined) {
      const item = await prisma.menuItem.update({
        where: { id: Number(body.id) },
        data: { available: Boolean(body.available) },
      });
      await writeAudit(auth.user.id,"TOGGLE_MENU","MenuItem",item.id,{available:item.available});
      return NextResponse.json(item);
    }

    if (!body.name?.trim() || !body.sku?.trim() || !body.saleUnit?.trim() || !body.categoryId || Number(body.price) < 0) {
      return NextResponse.json({ error: "ข้อมูลเมนูไม่ครบ" }, { status: 400 });
    }
    const item = await prisma.menuItem.update({
      where: { id: Number(body.id) },
      data: {
        name: body.name.trim(),
        sku: body.sku.trim(),
        description: body.description?.trim() || null,
        price: Number(body.price),
        saleUnit: body.saleUnit.trim(),
        image: body.image || null,
        categoryId: Number(body.categoryId),
        available: body.available !== false,
      },
      include: { category: true },
    });
    await writeAudit(auth.user.id,"UPDATE_MENU","MenuItem",item.id,{name:item.name});
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ กรุณาตรวจสอบว่ารหัสเมนูไม่ซ้ำ" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    await prisma.menuItem.delete({ where: { id: Number(id) } });
    await writeAudit(auth.user.id,"DELETE_MENU","MenuItem",id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "เมนูนี้มีประวัติออเดอร์ จึงลบไม่ได้" }, { status: 409 });
  }
}
