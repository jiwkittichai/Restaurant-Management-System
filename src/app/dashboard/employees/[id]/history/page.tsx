/**
 * หน้าประวัติการใช้งานของพนักงาน
 * ใช้เตรียมพารามิเตอร์และตรวจสิทธิ์บนเซิร์ฟเวอร์ก่อนส่งข้อมูลไปแสดงผล
 */

import { redirect } from "next/navigation";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleText } from "../../roles";
import AuditListClient from "../../../audits/_components/list/AuditListClient";
import { queryAudits } from "@/lib/audit-query";
import { publicNumbers } from "@/lib/money";
import { auditFilterParams, auditFilterState } from "../../../audits/_lib/filter-state";

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

export default async function EmployeeHistoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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

  const initialFilters = auditFilterState(await searchParams);
  const auditParams = auditFilterParams(initialFilters);
  auditParams.set("employeeId", String(employee.id));
  const initial = publicNumbers(await queryAudits(user.restaurantId, auditParams));
  const roles = employee.roles.map((item) => roleText[item.role]).join(", ");

  return (
    <AuditListClient
      initialAudits={initial.audits}
      initialMeta={initial.meta}
      initialFilters={initialFilters}
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
