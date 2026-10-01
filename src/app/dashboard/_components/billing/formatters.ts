import type { PaymentMethod } from "./types";

export const methodText: Record<PaymentMethod, string> = { CASH: "เงินสด", PROMPTPAY: "พร้อมเพย์" };

export const itemStatusText: Record<string, string> = {
  NEW: "รอครัวรับ",
  PREPARING: "กำลังทำ",
  READY: "พร้อมแล้ว",
  SERVED: "เสิร์ฟแล้ว",
};

export function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function receiptMoney(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function receiptDateTime(date: Date) {
  return date.toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
