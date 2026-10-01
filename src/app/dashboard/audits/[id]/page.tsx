import { notFound, redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { queryAuditById } from "@/lib/audit-query";
import { publicNumbers } from "@/lib/money";
import { Audit } from "../utils";
import AuditDetailPage from "../_components/AuditDetailPage";

export default async function AuditDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const audit = publicNumbers(await queryAuditById(user.restaurantId, id)) as Audit | null;
  if (!audit) notFound();

  return <AuditDetailPage audit={audit} />;
}
