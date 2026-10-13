/**
 * รวมรูปแบบข้อมูลที่ใช้ในโต๊ะและออเดอร์ภายในร้าน
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

import type { BillOrder } from "../_components/billing/types";

export type ActiveOrder = BillOrder & { status: string; paymentStatus: string; createdAt?: string };
export type RestaurantTable = { id: number; name: string; seats: number; status: string; orders: ActiveOrder[]; sessions: Array<{ id: number; paused: boolean; billRequestedAt: string | null }> };
export type TableTab = "ALL" | "AVAILABLE" | "ACTIVE" | "READY";
