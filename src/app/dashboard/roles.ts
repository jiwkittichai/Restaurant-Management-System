/**
 * รวมตัวช่วยและค่าที่ใช้ซ้ำในแดชบอร์ดร้านอาหาร
 * ใช้แปลงข้อมูล จัดรูปแบบข้อความ และเก็บกฎย่อยไม่ให้ปะปนกับโค้ดแสดงผล
 */

export const dashboardRoles = ["OWNER", "CASHIER", "KITCHEN", "STOCK"] as const;

export type DashboardRole = (typeof dashboardRoles)[number];

export const dashboardRoleText: Record<DashboardRole, string> = {
  OWNER: "เจ้าของร้าน",
  CASHIER: "แคชเชียร์",
  KITCHEN: "พนักงานครัว",
  STOCK: "พนักงานสต็อก",
};

export const employeeRoleText: Record<DashboardRole, string> = {
  ...dashboardRoleText,
  OWNER: "เจ้าของร้าน/ผู้จัดการ",
};

export function hasAnyDashboardRole(
  roles: readonly string[],
  allowedRoles: readonly DashboardRole[],
) {
  return roles.some((role) =>
    allowedRoles.some((allowedRole) => allowedRole === role),
  );
}

export function dashboardRoleLabel(role: string) {
  return dashboardRoleText[role as DashboardRole] || role;
}
