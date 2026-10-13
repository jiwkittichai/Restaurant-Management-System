/**
 * RoleBoundary ตรวจสิทธิ์ก่อนแสดงเนื้อหาในแดชบอร์ดร้านอาหาร
 * ใช้รับข้อมูลจากส่วนอื่นและจัดการการโต้ตอบที่จำเป็นบนหน้าจอ
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { findDashboardSection } from "../navigation";
import { hasAnyDashboardRole } from "../roles";

function landing(roles: string[]) {
  if (roles.includes("OWNER")) return "/dashboard";
  if (roles.includes("CASHIER")) return "/dashboard/orders";
  if (roles.includes("KITCHEN")) return "/dashboard/kitchen";
  return "/dashboard/inventory";
}

export default function RoleBoundary({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const section = findDashboardSection(pathname);
  const allowed = !section || hasAnyDashboardRole(roles, section.roles);

  useEffect(() => {
    if (!allowed) router.replace(landing(roles));
  }, [allowed, roles, router]);

  if (!allowed) {
    return (
      <div className="p-10 text-center text-gray-400">
        กำลังนำไปยังหน้าที่ได้รับอนุญาต...
      </div>
    );
  }
  return children;
}
