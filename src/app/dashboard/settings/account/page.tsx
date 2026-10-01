import { StaffRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountSettingsForm from "./_components/AccountSettingsForm";

export default async function AccountSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const employee = await prisma.employee.findFirst({
    where: { id: user.id, restaurantId: user.restaurantId },
    select: {
      id: true,
      displayName: true,
      username: true,
      email: true,
      emailVerifiedAt: true,
    },
  });
  if (!employee) redirect("/login");

  return (
    <AccountSettingsForm
      account={{
        id: employee.id,
        displayName: employee.displayName,
        username: employee.username,
        email: employee.email || "",
        emailVerified: Boolean(employee.emailVerifiedAt),
      }}
    />
  );
}
