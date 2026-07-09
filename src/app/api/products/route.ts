import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";

const prisma = new PrismaClient();

export const GET = async () => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { name, sku, category, qty, price, image } = await req.json();
    const product = await prisma.product.create({
      data: { name, sku, category, qty, price, image },
    });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest) => {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json(); // รับ id จาก body
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
};
