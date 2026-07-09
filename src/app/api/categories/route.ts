import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";

export async function GET() {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { menuItems: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { name, color = "#356DDB" } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "กรุณาระบุชื่อหมวดหมู่" }, { status: 400 });
    const category = await prisma.category.create({ data: { name: name.trim(), color } });
    await writeAudit(auth.user.id,"CREATE_CATEGORY","Category",category.id,{name:category.name});
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ชื่อหมวดหมู่นี้มีอยู่แล้ว" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth=await authorizeApi([StaffRole.OWNER]);if("response" in auth)return auth.response;
  try {
    const { id } = await req.json();
    await prisma.category.delete({ where: { id: Number(id) } });
    await writeAudit(auth.user.id,"DELETE_CATEGORY","Category",id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "ลบหมวดหมู่ที่มีเมนูอยู่ไม่ได้" }, { status: 409 });
  }
}
