import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Audit } from "../audit-utils";
import AuditsClient from "./AuditsClient";

const INITIAL_LIMIT = 100;
const defaultHiddenActions = ["UPDATE_KITCHEN_STATUS"];

export default async function AuditsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const [audits, totalCount, oldestAudit, latestAudit] = await Promise.all([
    prisma.auditLog.findMany({
      where: { action: { notIn: defaultHiddenActions } },
      take: INITIAL_LIMIT,
      orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName: true } } },
    }),
    prisma.auditLog.count({ where: { action: { notIn: defaultHiddenActions } } }),
    prisma.auditLog.findFirst({ where: { action: { notIn: defaultHiddenActions } }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    prisma.auditLog.findFirst({ where: { action: { notIn: defaultHiddenActions } }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const initial = JSON.parse(JSON.stringify({
    audits,
    meta: {
      totalCount,
      oldestAt: oldestAudit?.createdAt,
      latestAt: latestAudit?.createdAt,
      limit: INITIAL_LIMIT,
    },
  })) as {
    audits: Audit[];
    meta: { totalCount: number; oldestAt?: string; latestAt?: string; limit: number };
  };

  return <AuditsClient initialAudits={initial.audits} initialMeta={initial.meta} />;
}
