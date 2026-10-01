import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authorizePlatform, platformWriteRequest, platformLog } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
import { smallJson, RequestError, requestError } from "@/lib/request-security";
const PAGE_SIZE = 100;
export async function GET(req: NextRequest) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  const search = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(100000, Number(req.nextUrl.searchParams.get("page")) || 1));
  if (!Number.isInteger(page)) return NextResponse.json({ error: "หน้าไม่ถูกต้อง" }, { status: 400 });
  const status = req.nextUrl.searchParams.get("status");
  const sort = req.nextUrl.searchParams.get("sort") === "oldest" ? "asc" : "desc";
  const where: Prisma.RestaurantWhereInput = { ...(status === "pending" ? { approvalStatus: "PENDING" } : status === "rejected" ? { approvalStatus: "REJECTED" } : status === "active" ? { active: true, approvalStatus: "APPROVED" } : status === "suspended" ? { active: false, approvalStatus: "APPROVED" } : {}), ...(search ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }] } : {}) };
  const [restaurants, total, all, active, employees, orders, pending, rejected, suspended] = await Promise.all([
    prisma.restaurant.findMany({ where, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE, orderBy: { id: sort }, select: { id: true, name: true, slug: true, approvalStatus: true, active: true, suspendedAt: true, createdAt: true, owner: { select: { username: true, displayName: true, email: true, emailVerifiedAt: true } }, _count: { select: { employees: true, orders: true, menuItems: true } } } }),
    prisma.restaurant.count({ where }), prisma.restaurant.count(), prisma.restaurant.count({ where: { active: true, approvalStatus: "APPROVED" } }), prisma.employee.count(), prisma.order.count(), prisma.restaurant.count({ where: { approvalStatus: "PENDING" } }), prisma.restaurant.count({ where: { approvalStatus: "REJECTED" } }), prisma.restaurant.count({ where: { approvalStatus: "APPROVED", active: false } }),
  ]);
  return NextResponse.json({ restaurants, total, page, pageSize: PAGE_SIZE, summary: { restaurants: all, active, pending, rejected, suspended, employees, orders } });
}
export async function PATCH(req: NextRequest) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  try {
    platformWriteRequest(req);
    const body = await smallJson(req);
    if (body.decision !== undefined) {
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (!Number.isSafeInteger(body.id) || !["APPROVED", "REJECTED"].includes(body.decision) || reason.length > 500) throw new RequestError("ระบุผลการตรวจสอบให้ถูกต้อง และเหตุผลต้องไม่เกิน 500 ตัวอักษร");
      const result = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM Restaurant WHERE id = ${body.id} FOR UPDATE`;
        const current = await tx.restaurant.findUnique({ where: { id: body.id } });
        if (!current) throw new RequestError("ไม่พบร้าน", 404);
        const canReview = current.approvalStatus === "PENDING" || current.approvalStatus === "REJECTED" && body.decision === "APPROVED";
        if (!canReview) throw new RequestError("ไม่สามารถเปลี่ยนเป็นสถานะนี้ได้ กรุณาโหลดข้อมูลใหม่", 409);
        await tx.restaurant.update({ where: { id: current.id }, data: { approvalStatus: body.decision, active: body.decision === "APPROVED" ? true : current.active, suspendedAt: body.decision === "APPROVED" ? null : current.suspendedAt, reviewedAt: new Date(), reviewReason: reason || null } });
        await tx.authSession.deleteMany({ where: { employee: { restaurantId: current.id } } });
        await platformLog(tx, auth.admin, body.decision === "APPROVED" ? "RESTAURANT_APPROVED" : "RESTAURANT_REJECTED", current.id, { restaurantName: current.name, reason });
        return { changed: true };
      });
      return NextResponse.json(result);
    }
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!Number.isSafeInteger(body.id) || typeof body.active !== "boolean" || reason.length > 500) throw new RequestError("ระบุร้านและสถานะให้ถูกต้อง และเหตุผลต้องไม่เกิน 500 ตัวอักษร");
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM Restaurant WHERE id = ${body.id} FOR UPDATE`;
      const current = await tx.restaurant.findUnique({ where: { id: body.id } });
      if (!current) throw new RequestError("ไม่พบร้าน", 404);
      if (current.approvalStatus !== "APPROVED") throw new RequestError("ร้านต้องผ่านการอนุมัติก่อนจัดการสถานะใช้งาน", 409);
      if (current.active === body.active) return { changed: false };
      await tx.restaurant.update({ where: { id: current.id }, data: { active: body.active, suspendedAt: body.active ? null : new Date() } });
      if (!body.active) {
        await tx.authSession.deleteMany({ where: { employee: { restaurantId: current.id } } });
        await tx.accountToken.deleteMany({ where: { employee: { restaurantId: current.id } } });
        await tx.tableSession.updateMany({ where: { table: { restaurantId: current.id }, closedAt: null }, data: { closedAt: new Date(), paused: true } });
      }
      await platformLog(tx, auth.admin, body.active ? "RESTAURANT_RESUMED" : "RESTAURANT_SUSPENDED", current.id, { restaurantName: current.name, reason });
      return { changed: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
    return NextResponse.json(result);
  } catch (error) { return requestError(error); }
}
