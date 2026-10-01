import type { TakeawayOrder } from "./types";

export const statusText: Record<string, string> = { SENT: "รอครัว", PREPARING: "กำลังทำ", READY: "พร้อมรับ", SERVED: "รับแล้ว", CANCELLED: "ยกเลิก" };
export const itemStatusText: Record<string, string> = { NEW: "รอครัว", PREPARING: "กำลังทำ", READY: "พร้อม", SERVED: "ส่งแล้ว" };
export const money = (value: number) => `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const timeText = (value: string) => new Date(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
export function priority(order: TakeawayOrder) {
  if (order.status === "READY" && order.paymentStatus === "PAID") return 0;
  if (order.status === "READY") return 1;
  if (order.paymentStatus === "UNPAID") return 2;
  return 3;
}

export function badgeClass(order: TakeawayOrder) {
  if (order.status === "READY" && order.paymentStatus === "PAID") return "bg-emerald-50 text-emerald-700";
  if (order.status === "READY") return "bg-blue-50 text-blue-700";
  if (order.status === "PREPARING") return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-600";
}
