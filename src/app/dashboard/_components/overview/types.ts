/**
 * รวมรูปแบบข้อมูลที่ใช้ในแดชบอร์ดร้านอาหาร
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

import type { DashboardRole } from "../../roles";

export type MenuItem = { id: number; name: string; price: number };
export type TableItem = { status: string };
export type OrderItem = { name: string; price: number; qty: number };
export type Order = {
  status: string;
  paymentStatus: string;
  total: number;
  discount?: number;
  createdAt: string;
  items?: OrderItem[];
};
export type Employee = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt?: string | null;
  roles: DashboardRole[];
};
