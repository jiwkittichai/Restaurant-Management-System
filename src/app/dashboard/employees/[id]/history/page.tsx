import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleText } from "../../../audits/utils";
import AuditsClient from "../../../audits/_components/AuditsClient";
import { queryAudits } from "@/lib/audit-query";
import { publicNumbers } from "@/lib/money";

function formatLogin(value?: Date | null) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  return value.toLocaleString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default async function EmployeeHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const { id } = await params;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId)) redirect("/dashboard/employees");

  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, restaurantId: user.restaurantId },
    select: {
      id: true,
      username: true,
      displayName: true,
      active: true,
      lastLoginAt: true,
      roles: { select: { role: true } },
    },
  });
  if (!employee) redirect("/dashboard/employees");

  const initial = publicNumbers(await queryAudits(user.restaurantId, new URLSearchParams({ employeeId: String(employee.id) })));
  const roles = employee.roles.map((item) => roleText[item.role]).join(", ");

  return (
    <AuditsClient
      initialAudits={initial.audits}
      initialMeta={initial.meta}
      employeeId={employee.id}
      title={`ประวัติกิจกรรมของ ${employee.displayName}`}
      description="ค้นหาและกรองประวัติรายบุคคลด้วยเงื่อนไขเดียวกับหน้าประวัติทั้งหมด"
      backHref="/dashboard/employees"
      backLabel="กลับหน้าจัดการพนักงาน"
      employeeSummary={[
        { label: "พนักงาน", value: `${employee.displayName} @${employee.username}` },
        { label: "สถานะ", value: employee.active ? "ใช้งาน" : "ปิดใช้งาน", accent: employee.active ? "text-emerald-600" : "text-gray-500" },
        { label: "บทบาท", value: roles || "พนักงาน" },
        { label: "เข้าสู่ระบบล่าสุด", value: formatLogin(employee.lastLoginAt) },
      ]}
    />
  );
}
