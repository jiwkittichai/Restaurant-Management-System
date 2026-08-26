import { NextRequest, NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const internalActions = ["CREATE_CUSTOMER_PAYMENT_LINK"];

export async function GET(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  const action = req.nextUrl.searchParams.get("action") || "";
  const employeeId = Number(req.nextUrl.searchParams.get("employeeId") || 0);
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const take = Math.min(Math.max(Number(req.nextUrl.searchParams.get("take") || 100), 20), 300);

  const where: Prisma.AuditLogWhereInput = {};
  if (action) {
    where.action = action;
  } else {
    where.action = { notIn: internalActions };
  }
  if (employeeId) {
    where.OR = [
      { employeeId },
      { entityType: "Employee", entityId: String(employeeId) },
    ];
  }
  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999`) } : {}),
    };
  }

  const [audits, totalCount, oldestAudit, latestAudit] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const filtered = q
    ? audits.filter((audit) =>
        [
          audit.employee?.displayName,
          audit.action,
          audit.entityType,
          audit.entityId,
          JSON.stringify(audit.details || {}),
        ].some((value) => String(value || "").toLowerCase().includes(q)),
      )
    : audits;

  return NextResponse.json({
    audits: filtered,
    meta: {
      totalCount,
      oldestAt: oldestAudit?.createdAt,
      latestAt: latestAudit?.createdAt,
      limit: take,
    },
  });
}
