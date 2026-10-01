import { money, moneyJson } from "@/lib/money";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";

const prisma = new PrismaClient();

export const GET = async () => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const products = await prisma.product.findMany({ where: { restaurantId: auth.user.restaurantId } });
    return moneyJson(products);
  } catch (err) {
    return moneyJson({ error: "Fetch failed" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { name, sku, category, qty, price, image } = await req.json();
    const product = await prisma.product.create({
      data: { restaurantId: auth.user.restaurantId, name, sku, category, qty, price: money(price), image },
    });
    return moneyJson(product);
  } catch (err) {
    return moneyJson({ error: "Create failed" }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json(); // รับ id จาก body
    const product = await prisma.product.findFirst({ where: { id, restaurantId: auth.user.restaurantId } });
    if (!product) return moneyJson({ error: "Not found" }, { status: 404 });
    await prisma.product.delete({ where: { id: product.id } });
    return moneyJson({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return moneyJson({ error: "Delete failed" }, { status: 500 });
  }
};
