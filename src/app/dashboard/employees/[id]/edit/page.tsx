import { StaffRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmployeeEditForm from "./_components/EmployeeEditForm";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const employee = await prisma.employee.findFirst({
    where: { id, restaurantId: user.restaurantId },
    select: {
      id: true,
      username: true,
      displayName: true,
      active: true,
      roles: { select: { role: true } },
    },
  });
  if (!employee) notFound();

  return (
    <EmployeeEditForm
      employee={{
        ...employee,
        roles: employee.roles.map((item) => item.role),
      }}
    />
  );
}
