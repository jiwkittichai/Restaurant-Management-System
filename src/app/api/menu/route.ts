import { money, moneyJson } from "@/lib/money";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

type ModifierGroupInput = {
  name?: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  options?: Array<{ name?: string; price?: number }>;
};

function normalizeModifierGroups(groups: ModifierGroupInput[] = []) {
  return groups
    .map((group, index) => {
      const options = (group.options || [])
        .map((option) => ({ name: option.name?.trim() || "", price: money(option.price ?? 0) }))
        .filter((option) => option.name);
      const maxSelect = Math.max(1, Number(group.maxSelect || 1));
      const minSelect = group.required ? Math.max(1, Math.min(Number(group.minSelect || 1), maxSelect)) : Math.max(0, Math.min(Number(group.minSelect || 0), maxSelect));
      return {
        name: group.name?.trim() || "",
        required: Boolean(group.required),
        minSelect,
        maxSelect,
        sortOrder: index,
        options,
      };
    })
    .filter((group) => group.name && group.options.length);
}

async function replaceModifierGroups(tx: Prisma.TransactionClient, restaurantId: number, menuItemId: number, groups: ModifierGroupInput[]) {
  const normalized = normalizeModifierGroups(groups);
  await tx.menuItemModifierGroup.deleteMany({ where: { menuItemId } });
  for (const group of normalized) {
    await tx.menuItemModifierGroup.create({
      data: {
        restaurantId,
        menuItemId,
        name: group.name,
        required: group.required,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        sortOrder: group.sortOrder,
        options: {
          create: group.options.map((option) => ({
            restaurantId,
            menuItemId,
            name: option.name,
            price: option.price,
          })),
        },
      },
    });
  }
}

export async function GET() {
  const auth=await authorizeApi();if("response" in auth)return auth.response;
  const items = await prisma.menuItem.findMany({
    where: { restaurantId: auth.user.restaurantId },
    include: {
      category: true,
      recipes: { include: { ingredient: { select: { stock: true } } } },
      modifiers: {
        where: { active: true },
        select: { id: true, name: true, price: true, active: true },
        orderBy: { id: "asc" },
      },
      modifierGroups: {
        include: {
          options: {
            where: { active: true },
            select: { id: true, name: true, price: true, active: true, groupId: true },
            orderBy: { id: "asc" },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return moneyJson(items.map(({ recipes, ...item }) => {
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
      return moneyJson({ error: "ข้อมูลเมนูไม่ครบ" }, { status: 400 });
    }
    const category = await prisma.category.findFirst({ where: { id: Number(body.categoryId), restaurantId: auth.user.restaurantId } });
    if (!category) return moneyJson({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    const item = await prisma.$transaction(async tx => {
    const item = await tx.menuItem.create({
      data: {
        name: body.name.trim(),
        sku: body.sku || `MENU-${Date.now().toString().slice(-6)}`,
        description: body.description?.trim() || null,
        price: money(body.price),
        saleUnit: body.saleUnit?.trim() || "จาน",
        image: body.image || null,
        categoryId: Number(body.categoryId),
        restaurantId: auth.user.restaurantId,
      },
      include: { category: true },
    });
    if (Array.isArray(body.modifierGroups)) await replaceModifierGroups(tx, auth.user.restaurantId, item.id, body.modifierGroups);
    return item;
    });
    await writeAudit(auth.user.id,"CREATE_MENU","MenuItem",item.id,{name:item.name});
    return moneyJson(item, { status: 201 });
  } catch {
    return moneyJson({ error: "สร้างเมนูไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const body = await req.json();
    if (!body.id) return moneyJson({ error: "ไม่พบรหัสเมนู" }, { status: 400 });

    if (body.name === undefined) {
      if (typeof body.available !== "boolean" || body.price !== undefined) return moneyJson({ error: "ข้อมูลเมนูไม่ครบ" }, { status: 400 });
      const current = await prisma.menuItem.findFirst({ where: { id: Number(body.id), restaurantId: auth.user.restaurantId } });
      if (!current) return moneyJson({ error: "ไม่พบเมนู" }, { status: 404 });
      const item = await prisma.menuItem.update({
        where: { id: current.id },
        data: { available: Boolean(body.available) },
      });
      await writeAudit(auth.user.id,"TOGGLE_MENU","MenuItem",item.id,{
        name:item.name,
        before:{available:current.available},
        after:{available:item.available},
      });
      return moneyJson(item);
    }

    if (!body.name?.trim() || !body.sku?.trim() || !body.saleUnit?.trim() || !body.categoryId || Number(body.price) < 0) {
      return moneyJson({ error: "ข้อมูลเมนูไม่ครบ" }, { status: 400 });
    }
    const current = await prisma.menuItem.findFirst({ where: { id: Number(body.id), restaurantId: auth.user.restaurantId } });
    if (!current) return moneyJson({ error: "ไม่พบเมนู" }, { status: 404 });
    const category = await prisma.category.findFirst({ where: { id: Number(body.categoryId), restaurantId: auth.user.restaurantId } });
    if (!category) return moneyJson({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    const item = await prisma.$transaction(async tx => {
    const item = await tx.menuItem.update({
      where: { id: current.id },
      data: {
        name: body.name.trim(),
        sku: body.sku.trim(),
        description: body.description?.trim() || null,
        price: money(body.price),
        saleUnit: body.saleUnit.trim(),
        image: body.image || null,
        categoryId: Number(body.categoryId),
        available: body.available !== false,
      },
      include: { category: true },
    });
    if (Array.isArray(body.modifierGroups)) await replaceModifierGroups(tx, auth.user.restaurantId, item.id, body.modifierGroups);
    return item;
    });
    await writeAudit(auth.user.id,"UPDATE_MENU","MenuItem",item.id,{
      name:item.name,
      imageChanged:current.image !== item.image,
      modifierGroupsChanged:Array.isArray(body.modifierGroups),
      before:{name:current.name,sku:current.sku,description:current.description,price:current.price,saleUnit:current.saleUnit,categoryId:current.categoryId,available:current.available},
      after:{name:item.name,sku:item.sku,description:item.description,price:item.price,saleUnit:item.saleUnit,categoryId:item.categoryId,available:item.available},
    });
    return moneyJson(item);
  } catch {
    return moneyJson({ error: "อัปเดตไม่สำเร็จ กรุณาตรวจสอบว่ารหัสเมนูไม่ซ้ำ" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    const current = await prisma.menuItem.findFirst({ where: { id: Number(id), restaurantId: auth.user.restaurantId } });
    if (!current) return moneyJson({ error: "ไม่พบเมนู" }, { status: 404 });
    const item = await prisma.menuItem.delete({ where: { id: current.id } });
    await writeAudit(auth.user.id,"DELETE_MENU","MenuItem",item.id,{name:item.name,sku:item.sku,price:item.price});
    return moneyJson({ success: true });
  } catch {
    return moneyJson({ error: "เมนูนี้มีประวัติออเดอร์ จึงลบไม่ได้" }, { status: 409 });
  }
}
