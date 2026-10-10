import type { Role } from "./types";

export const roleText: Record<Role, string> = {
  OWNER: "เจ้าของร้าน/ผู้จัดการ",
  CASHIER: "แคชเชียร์",
  KITCHEN: "พนักงานครัว",
  STOCK: "พนักงานสต็อก",
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
