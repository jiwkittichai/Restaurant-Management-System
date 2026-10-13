/**
 * รวมรูปแบบข้อมูลที่ใช้ในพนักงานและสิทธิ์การใช้งาน
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

import type { DashboardRole } from "../roles";

export type Role = DashboardRole;
export type Employee = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: Role[];
};
export type EmployeeForm = {
  displayName: string;
  username: string;
  password: string;
  roles: Role[];
};
export type EmployeeEditForm = {
  displayName: string;
  password: string;
  active: boolean;
  roles: Role[];
};
