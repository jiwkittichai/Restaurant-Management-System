import { NextRequest, NextResponse } from "next/server";
import { authorizePlatform } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  const cursor = Number(req.nextUrl.searchParams.get("before"));
  const logs = await prisma.platformLog.findMany({ where: Number.isSafeInteger(cursor) && cursor > 0 ? { id: { lt: cursor } } : {}, take: 51, orderBy: { id: "desc" }, select: { id: true, actorName: true, action: true, restaurantId: true, details: true, createdAt: true } });
  return NextResponse.json({ logs: logs.slice(0, 50), nextCursor: logs.length > 50 ? logs[49].id : null });
}
