/**
 * รวมตัวช่วยและค่าที่ใช้ซ้ำในพนักงานและสิทธิ์การใช้งาน
 * ใช้แปลงข้อมูล จัดรูปแบบข้อความ และเก็บกฎย่อยไม่ให้ปะปนกับโค้ดแสดงผล
 */

import type { Role } from "./types";
import { employeeRoleText } from "../roles";

export const roleText: Record<Role, string> = {
  ...employeeRoleText,
};

export const roleDescription: Record<Role, string> = {
  OWNER: "เข้าถึงทุกเมนูและจัดการพนักงาน",
  CASHIER: "รับออเดอร์และชำระเงิน",
  KITCHEN: "ดูและอัปเดตสถานะอาหาร",
  STOCK: "จัดการวัตถุดิบและสูตรอาหาร",
};

export function toggleRole(roles: Role[], selectedRole: Role): Role[] {
  return roles.includes(selectedRole)
    ? roles.filter((role) => role !== selectedRole)
    : [...roles, selectedRole];
}
