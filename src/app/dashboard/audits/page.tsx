import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { queryAudits } from "@/lib/audit-query";
import { publicNumbers } from "@/lib/money";
import AuditsClient from "./_components/AuditsClient";

export default async function AuditsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");
  const initial = publicNumbers(await queryAudits(user.restaurantId));
  return <AuditsClient initialAudits={initial.audits} initialMeta={initial.meta} />;
}
