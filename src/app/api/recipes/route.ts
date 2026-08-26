import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  const menu = await prisma.menuItem.findMany({
    include: {
      category: true,
      recipes: { include: { ingredient: true } },
      modifierGroups: {
        include: {
          options: {
            include: { recipes: { include: { ingredient: true } } },
            orderBy: { id: "asc" },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(menu);
}

export async function PUT(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER,StaffRole.STOCK]);if("response" in auth)return auth.response;
  try {
    const { menuItemId, modifierId, targetType = "menu", ingredients } = await req.json() as {
      menuItemId?: number; modifierId?: number; targetType?: "menu" | "modifier"; ingredients: Array<{ ingredientId: number; quantity: number }>;
    };
    const valid = (ingredients || []).filter((item) => Number(item.quantity) > 0);
    await prisma.$transaction(async (tx) => {
      if (targetType === "modifier") {
        await tx.menuItemModifierRecipe.deleteMany({ where: { modifierId: Number(modifierId) } });
        if (valid.length) await tx.menuItemModifierRecipe.createMany({
          data: valid.map((item) => ({
            modifierId: Number(modifierId), ingredientId: Number(item.ingredientId), quantity: Number(item.quantity),
          })),
        });
      } else {
        await tx.recipe.deleteMany({ where: { menuItemId: Number(menuItemId) } });
        if (valid.length) await tx.recipe.createMany({
          data: valid.map((item) => ({
            menuItemId: Number(menuItemId), ingredientId: Number(item.ingredientId), quantity: Number(item.quantity),
          })),
        });
      }
    });
    await writeAudit(auth.user.id,"UPDATE_RECIPE",targetType === "modifier" ? "MenuItemModifier" : "MenuItem",targetType === "modifier" ? modifierId : menuItemId,{ingredientCount:valid.length});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "บันทึกสูตรอาหารไม่สำเร็จ" }, { status: 500 });
  }
}
