import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { queryAudits } from "@/lib/audit-query";
import { publicNumbers } from "@/lib/money";
import AuditListClient from "./_components/list/AuditListClient";
import { auditFilterParams, auditFilterState } from "./_lib/filter-state";

export default async function AuditsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");
  const initialFilters = auditFilterState(await searchParams);
  const initial = publicNumbers(await queryAudits(user.restaurantId, auditFilterParams(initialFilters)));
  return <AuditListClient initialAudits={initial.audits} initialMeta={initial.meta} initialFilters={initialFilters} />;
}
